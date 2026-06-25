import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "../auth/AuthContext";

export interface SharedAgendaRow {
  id: string;
  name: string;
  owner_id: string;
  color: string;
  created_at: string;
  role?: "owner" | "editor" | "viewer";
  memberCount?: number;
}

export interface SharedMember {
  agenda_id: string;
  user_id: string;
  role: "owner" | "editor" | "viewer";
  joined_at: string;
  profile?: {
    id: string;
    nome: string;
    sobrenome: string;
    avatar_url: string | null;
    email: string | null;
  };
}

export function useSharedAgendas() {
  const { user } = useAuth();
  const [agendas, setAgendas] = useState<SharedAgendaRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: memberships } = await supabase
      .from("shared_agenda_members")
      .select("agenda_id, role")
      .eq("user_id", user.id);
    const ids = (memberships ?? []).map((m) => m.agenda_id);
    if (!ids.length) {
      setAgendas([]);
      setLoading(false);
      return;
    }
    const { data: ags } = await supabase
      .from("shared_agendas")
      .select("*")
      .in("id", ids);
    const enriched: SharedAgendaRow[] = (ags ?? []).map((a) => ({
      ...a,
      role: memberships?.find((m) => m.agenda_id === a.id)?.role,
    }));
    setAgendas(enriched);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("shared_agendas:" + user.id)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shared_agenda_members", filter: `user_id=eq.${user.id}` },
        () => fetchAll(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, fetchAll]);

  const createAgenda = async (name: string, color = "#2563EB") => {
    if (!user) throw new Error("Sem usuário");
    const { data, error } = await supabase
      .from("shared_agendas")
      .insert({ name, color, owner_id: user.id })
      .select()
      .single();
    if (error) throw error;
    await fetchAll();
    return data as SharedAgendaRow;
  };

  const inviteMember = async (
    agenda_id: string,
    user_id: string,
    role: "editor" | "viewer" = "editor",
  ) => {
    const { error } = await supabase
      .from("shared_agenda_members")
      .insert({ agenda_id, user_id, role });
    if (error && !error.message.includes("duplicate")) throw error;
  };

  const removeMember = async (agenda_id: string, user_id: string) => {
    await supabase
      .from("shared_agenda_members")
      .delete()
      .eq("agenda_id", agenda_id)
      .eq("user_id", user_id);
  };

  const updateMemberRole = async (
    agenda_id: string,
    user_id: string,
    role: "owner" | "editor" | "viewer",
  ) => {
    await supabase
      .from("shared_agenda_members")
      .update({ role })
      .eq("agenda_id", agenda_id)
      .eq("user_id", user_id);
  };

  const leaveAgenda = async (agenda_id: string) => {
    if (!user) return;
    await supabase
      .from("shared_agenda_members")
      .delete()
      .eq("agenda_id", agenda_id)
      .eq("user_id", user.id);
    await fetchAll();
  };

  const deleteAgenda = async (agenda_id: string) => {
    await supabase.from("shared_agendas").delete().eq("id", agenda_id);
    await fetchAll();
  };

  return {
    loading,
    agendas,
    createAgenda,
    inviteMember,
    removeMember,
    updateMemberRole,
    leaveAgenda,
    deleteAgenda,
    refresh: fetchAll,
  };
}

export function useAgendaMembers(agendaId: string | null) {
  const [members, setMembers] = useState<SharedMember[]>([]);

  const fetch = useCallback(async () => {
    if (!agendaId) return;
    const { data: m } = await supabase
      .from("shared_agenda_members")
      .select("*")
      .eq("agenda_id", agendaId);
    const ids = (m ?? []).map((x) => x.user_id);
    let profiles: any[] = [];
    if (ids.length) {
      const { data: p } = await supabase
        .from("profiles")
        .select("id, nome, sobrenome, avatar_url, email")
        .in("id", ids);
      profiles = p ?? [];
    }
    setMembers(
      (m ?? []).map((x: any) => ({
        ...x,
        profile: profiles.find((p) => p.id === x.user_id),
      })),
    );
  }, [agendaId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  useEffect(() => {
    if (!agendaId) return;
    const ch = supabase
      .channel("members:" + agendaId)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shared_agenda_members", filter: `agenda_id=eq.${agendaId}` },
        () => fetch(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [agendaId, fetch]);

  return { members, refresh: fetch };
}
