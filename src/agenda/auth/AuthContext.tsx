import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  nome: string;
  sobrenome: string;
  data_nascimento: string | null;
  avatar_url: string | null;
}

export interface SignUpData {
  nome: string;
  sobrenome: string;
  email: string;
  senha: string;
  dataNascimento: string; // yyyy-mm-dd
  avatarFile?: File | null;
}

interface AuthCtx {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  avatarUrl: string | null;
  loading: boolean;
  signIn: (email: string, senha: string) => Promise<{ error?: string }>;
  signUp: (data: SignUpData) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  updateProfile: (
    patch: Partial<Omit<Profile, "id" | "avatar_url">> & { avatarFile?: File | null },
  ) => Promise<{ error?: string }>;
  refreshProfile: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

const uploadAvatar = async (userId: string, file: File): Promise<string> => {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/avatar.${ext}`;
  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  return path;
};

const getSignedAvatarUrl = async (path: string): Promise<string | null> => {
  const { data, error } = await supabase.storage
    .from("avatars")
    .createSignedUrl(path, 60 * 60);
  if (error) return null;
  return data.signedUrl;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("id, nome, sobrenome, data_nascimento, avatar_url")
      .eq("id", uid)
      .maybeSingle();
    if (data) {
      setProfile(data as Profile);
      if (data.avatar_url) {
        const url = await getSignedAvatarUrl(data.avatar_url);
        setAvatarUrl(url);
      } else {
        setAvatarUrl(null);
      }
    } else {
      setProfile(null);
      setAvatarUrl(null);
    }
  }, []);

  useEffect(() => {
    // Set listener FIRST
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        // defer to avoid deadlock
        setTimeout(() => {
          loadProfile(sess.user.id);
        }, 0);
      } else {
        setProfile(null);
        setAvatarUrl(null);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        loadProfile(data.session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback<AuthCtx["signIn"]>(async (email, senha) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });
    if (error) {
      if (error.message.toLowerCase().includes("invalid"))
        return { error: "E-mail ou senha incorretos." };
      return { error: error.message };
    }
    return {};
  }, []);

  const signUp = useCallback<AuthCtx["signUp"]>(async (data) => {
    const redirectUrl = `${window.location.origin}/`;
    const { data: signed, error } = await supabase.auth.signUp({
      email: data.email.trim(),
      password: data.senha,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          nome: data.nome.trim(),
          sobrenome: data.sobrenome.trim(),
          data_nascimento: data.dataNascimento,
        },
      },
    });
    if (error) {
      if (error.message.toLowerCase().includes("registered"))
        return { error: "Este e-mail já está cadastrado." };
      return { error: error.message };
    }

    const newUser = signed.user;
    if (newUser && data.avatarFile) {
      try {
        const path = await uploadAvatar(newUser.id, data.avatarFile);
        await supabase
          .from("profiles")
          .update({ avatar_url: path })
          .eq("id", newUser.id);
      } catch {
        // ignore avatar errors — profile still created
      }
    }
    if (newUser) {
      await loadProfile(newUser.id);
    }
    return {};
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setAvatarUrl(null);
  }, []);

  const resetPassword = useCallback<AuthCtx["resetPassword"]>(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return { error: error.message };
    return {};
  }, []);

  const updateProfile = useCallback<AuthCtx["updateProfile"]>(
    async (patch) => {
      if (!user) return { error: "Não autenticado." };
      const updates: {
        nome?: string;
        sobrenome?: string;
        data_nascimento?: string | null;
        avatar_url?: string | null;
      } = {};
      if (patch.nome !== undefined) updates.nome = patch.nome.trim();
      if (patch.sobrenome !== undefined)
        updates.sobrenome = patch.sobrenome.trim();
      if (patch.data_nascimento !== undefined)
        updates.data_nascimento = patch.data_nascimento || null;

      if (patch.avatarFile) {
        try {
          const path = await uploadAvatar(user.id, patch.avatarFile);
          updates.avatar_url = path;
        } catch {
          return { error: "Falha ao enviar a foto." };
        }
      }

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);
      if (error) return { error: error.message };
      await loadProfile(user.id);
      return {};
    },
    [user, loadProfile],
  );

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user.id);
  }, [user, loadProfile]);

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      session,
      profile,
      avatarUrl,
      loading,
      signIn,
      signUp,
      signOut,
      resetPassword,
      updateProfile,
      refreshProfile,
    }),
    [
      user,
      session,
      profile,
      avatarUrl,
      loading,
      signIn,
      signUp,
      signOut,
      resetPassword,
      updateProfile,
      refreshProfile,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("AuthProvider missing");
  return c;
};
