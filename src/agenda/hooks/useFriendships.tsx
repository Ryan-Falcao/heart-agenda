import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "../auth/AuthContext";

export interface FriendProfile {
  id: string;
  nome: string;
  sobrenome: string;
  avatar_url: string | null;
  email: string | null;
}

export interface FriendshipRow {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  other: FriendProfile;
}

const randomCode = () =>
  Array.from({ length: 8 }, () =>
    "ABCDEFGHJKMNPQRSTUVWXYZ23456789".charAt(Math.floor(Math.random() * 31)),
  ).join("");

export function useFriendships() {
  const { user } = useAuth();
  const [items, setItems] = useState<FriendshipRow[]>([]);
  const [myCode, setMyCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: rows } = await supabase
      .from("friendships")
      .select("*")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    const ids = Array.from(
      new Set(
        (rows ?? []).flatMap((r) => [r.requester_id, r.addressee_id]),
      ),
    ).filter((id) => id !== user.id);

    let profiles: FriendProfile[] = [];
    if (ids.length) {
      const { data: p } = await supabase
        .from("profiles")
        .select("id, nome, sobrenome, avatar_url, email")
        .in("id", ids);
      profiles = (p as FriendProfile[]) ?? [];
    }

    const enriched: FriendshipRow[] = (rows ?? []).map((r: any) => {
      const otherId = r.requester_id === user.id ? r.addressee_id : r.requester_id;
      const other =
        profiles.find((x) => x.id === otherId) ?? {
          id: otherId,
          nome: "Usuário",
          sobrenome: "",
          avatar_url: null,
          email: null,
        };
      return { ...r, other };
    });
    setItems(enriched);
    setLoading(false);
  }, [user]);

  const fetchMyCode = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("friend_invite_codes")
      .select("code")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data?.code) setMyCode(data.code);
    else {
      const code = randomCode();
      const { error } = await supabase
        .from("friend_invite_codes")
        .insert({ user_id: user.id, code });
      if (!error) setMyCode(code);
    }
  }, [user]);

  useEffect(() => {
    fetchAll();
    fetchMyCode();
  }, [fetchAll, fetchMyCode]);

  useEffect(() => {
    if (!user) return;
    const handleChange = () => fetchAll();
    const ch = supabase
      .channel(`friendships-changes-${user.id}-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "friendships",
          filter: `requester_id=eq.${user.id}`,
        },
        handleChange,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "friendships",
          filter: `addressee_id=eq.${user.id}`,
        },
        handleChange,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, fetchAll]);

  const sendRequestByEmail = async (email: string) => {
    if (!user) throw new Error("Sem usuário");
    const e = email.trim().toLowerCase();
    if (!e) throw new Error("Informe um e-mail");
    const { data: prof } = await supabase
      .from("profiles")
      .select("id, email")
      .ilike("email", e)
      .maybeSingle();
    if (!prof) throw new Error("Usuário não encontrado");
    if (prof.id === user.id) throw new Error("Não pode adicionar você mesmo");
    return sendRequestToUser(prof.id);
  };

  const sendRequestToUser = async (targetId: string) => {
    if (!user) throw new Error("Sem usuário");
    if (targetId === user.id) throw new Error("Não pode adicionar você mesmo");
    const { error } = await supabase
      .from("friendships")
      .insert({ requester_id: user.id, addressee_id: targetId, status: "pending" });
    if (error && !error.message.includes("duplicate")) throw error;
    await fetchAll();
  };

  const acceptByCode = async (code: string) => {
    if (!user) throw new Error("Sem usuário");
    const c = code.trim().toUpperCase();
    const { data: row } = await supabase
      .from("friend_invite_codes")
      .select("user_id")
      .eq("code", c)
      .maybeSingle();
    if (!row) throw new Error("Código inválido");
    if (row.user_id === user.id) throw new Error("Esse é o seu próprio código");
    await sendRequestToUser(row.user_id);
  };

  const accept = async (id: string) => {
    await supabase.from("friendships").update({ status: "accepted" }).eq("id", id);
    await fetchAll();
  };
  const reject = async (id: string) => {
    await supabase.from("friendships").update({ status: "rejected" }).eq("id", id);
    await fetchAll();
  };
  const remove = async (id: string) => {
    await supabase.from("friendships").delete().eq("id", id);
    await fetchAll();
  };

  const accepted = items.filter((i) => i.status === "accepted");
  const received = items.filter(
    (i) => i.status === "pending" && i.addressee_id === user?.id,
  );
  const sent = items.filter(
    (i) => i.status === "pending" && i.requester_id === user?.id,
  );

  return {
    loading,
    accepted,
    received,
    sent,
    myCode,
    sendRequestByEmail,
    acceptByCode,
    accept,
    reject,
    remove,
    refresh: fetchAll,
  };
}
