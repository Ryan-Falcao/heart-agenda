import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "../auth/AuthContext";

export interface AgendaInviteRow {
  id: string;
  agenda_id: string;
  invited_by: string;
  invited_email: string | null;
  code: string;
  role: "owner" | "editor" | "viewer";
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  expires_at: string | null;
}

export interface PendingInvite extends AgendaInviteRow {
  agenda_name?: string;
  agenda_color?: string;
  inviter_name?: string;
}

/** Invites emitidos por uma agenda (visão do dono). */
export function useAgendaInvitesFor(agendaId: string | null) {
  const [invites, setInvites] = useState<AgendaInviteRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!agendaId) return;
    setLoading(true);
    const { data } = await supabase
      .from("agenda_invites")
      .select("*")
      .eq("agenda_id", agendaId)
      .order("created_at", { ascending: false });
    setInvites((data as AgendaInviteRow[]) ?? []);
    setLoading(false);
  }, [agendaId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  useEffect(() => {
    if (!agendaId) return;
    const ch = supabase
      .channel(`agenda_invites-${agendaId}-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "agenda_invites",
          filter: `agenda_id=eq.${agendaId}`,
        },
        () => fetch(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [agendaId, fetch]);

  const createInvite = async (
    invited_email: string | null,
    role: "editor" | "viewer" = "editor",
  ): Promise<AgendaInviteRow> => {
    if (!agendaId) throw new Error("Sem agenda");
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new Error("Não autenticado");
    const { data, error } = await supabase
      .from("agenda_invites")
      .insert({
        agenda_id: agendaId,
        invited_by: auth.user.id,
        invited_email: invited_email?.trim().toLowerCase() || null,
        role,
      })
      .select()
      .single();
    if (error) throw error;
    await fetch();
    return data as AgendaInviteRow;
  };

  const deleteInvite = async (id: string) => {
    await supabase.from("agenda_invites").delete().eq("id", id);
    await fetch();
  };

  return { invites, loading, createInvite, deleteInvite, refresh: fetch };
}

/** Invites pendentes que o usuário logado recebeu (por e-mail). */
export function useMyPendingInvites() {
  const { user } = useAuth();
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user?.email) {
      setInvites([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const email = user.email.toLowerCase();
    const { data: raw } = await supabase
      .from("agenda_invites")
      .select("*")
      .eq("status", "pending")
      .ilike("invited_email", email);
    const rows = (raw as AgendaInviteRow[]) ?? [];
    const active = rows.filter(
      (r) => !r.expires_at || new Date(r.expires_at).getTime() > Date.now(),
    );
    if (active.length === 0) {
      setInvites([]);
      setLoading(false);
      return;
    }
    const agendaIds = Array.from(new Set(active.map((r) => r.agenda_id)));
    const inviterIds = Array.from(new Set(active.map((r) => r.invited_by)));
    const [{ data: ags }, { data: profs }] = await Promise.all([
      supabase.from("shared_agendas").select("id, name, color").in("id", agendaIds),
      supabase
        .from("profiles")
        .select("id, nome, sobrenome")
        .in("id", inviterIds),
    ]);
    const enriched: PendingInvite[] = active.map((r) => {
      const ag = (ags ?? []).find((a: any) => a.id === r.agenda_id);
      const pf = (profs ?? []).find((p: any) => p.id === r.invited_by);
      return {
        ...r,
        agenda_name: ag?.name,
        agenda_color: ag?.color,
        inviter_name: pf
          ? `${pf.nome ?? ""} ${pf.sobrenome ?? ""}`.trim()
          : undefined,
      };
    });
    setInvites(enriched);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`my-invites-${user.id}-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "agenda_invites" },
        () => fetch(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, fetch]);

  const accept = async (invite: PendingInvite) => {
    if (!user) throw new Error("Não autenticado");
    const { error: memErr } = await supabase
      .from("shared_agenda_members")
      .insert({
        agenda_id: invite.agenda_id,
        user_id: user.id,
        role: invite.role,
      });
    if (memErr && !memErr.message.includes("duplicate")) throw memErr;
    await supabase
      .from("agenda_invites")
      .update({ status: "accepted" })
      .eq("id", invite.id);
    await fetch();
  };

  const reject = async (invite: PendingInvite) => {
    await supabase
      .from("agenda_invites")
      .update({ status: "rejected" })
      .eq("id", invite.id);
    await fetch();
  };

  return { invites, loading, accept, reject, refresh: fetch };
}

/** Entrada por código (JoinAgendaModal). */
export async function joinAgendaByCode(code: string, userId: string) {
  const c = code.trim().toUpperCase();
  if (!c) throw new Error("Informe o código");
  const { data: invite, error } = await supabase
    .from("agenda_invites")
    .select("*")
    .eq("code", c)
    .maybeSingle();
  if (error) throw error;
  if (!invite) throw new Error("Código inválido");
  if (invite.status !== "pending") throw new Error("Convite já utilizado");
  if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now())
    throw new Error("Convite expirado");
  const { error: memErr } = await supabase
    .from("shared_agenda_members")
    .insert({
      agenda_id: invite.agenda_id,
      user_id: userId,
      role: invite.role,
    });
  if (memErr && !memErr.message.includes("duplicate")) throw memErr;
  await supabase
    .from("agenda_invites")
    .update({ status: "accepted" })
    .eq("id", invite.id);
  return invite as AgendaInviteRow;
}
