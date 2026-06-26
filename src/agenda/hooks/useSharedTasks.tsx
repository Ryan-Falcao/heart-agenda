import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "../auth/AuthContext";

export interface SharedTaskRow {
  id: string;
  agenda_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  assigned_to: string | null;
  created_by: string;
  status: "pending" | "in_progress" | "done";
  reminder_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

const FN_URL =
  "https://qdewykdkuorsvfctljgl.supabase.co/functions/v1/send-push-notification";
const INTERNAL_SECRET = "agenda_internal_push_2026_secret_a9f3k2m";

async function fireAndForgetPush(payload: any) {
  try {
    await fetch(FN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": INTERNAL_SECRET,
      },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.error("push fail", e);
  }
}

export function useSharedTasks(agendaId: string | null) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<SharedTaskRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!agendaId) return;
    setLoading(true);
    const { data } = await supabase
      .from("shared_tasks")
      .select("*")
      .eq("agenda_id", agendaId)
      .order("due_date", { ascending: true, nullsFirst: false });
    setTasks((data as SharedTaskRow[]) ?? []);
    setLoading(false);
  }, [agendaId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (!agendaId) return;
    const ch = supabase
      .channel(`shared_tasks-${agendaId}-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shared_tasks",
          filter: `agenda_id=eq.${agendaId}`,
        },
        () => fetchAll(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [agendaId, fetchAll]);

  const notifyAssigned = async (assigned_to: string, title: string) => {
    if (!assigned_to || assigned_to === user?.id) return;
    fireAndForgetPush({
      user_ids: [assigned_to],
      title: "📋 Nova tarefa atribuída a você",
      body: title,
      tag: `assigned-${Date.now()}`,
    });
  };

  const notifyDone = async (agenda_id: string, title: string) => {
    const { data: members } = await supabase
      .from("shared_agenda_members")
      .select("user_id")
      .eq("agenda_id", agenda_id);
    const ids = (members ?? [])
      .map((m) => m.user_id)
      .filter((id) => id !== user?.id);
    if (!ids.length) return;
    fireAndForgetPush({
      user_ids: ids,
      title: "✅ Tarefa concluída",
      body: title,
      tag: `done-${Date.now()}`,
    });
  };

  const create = async (input: {
    title: string;
    description?: string;
    due_date?: string | null;
    assigned_to?: string | null;
  }) => {
    if (!user || !agendaId) throw new Error("Sem contexto");
    const { data, error } = await supabase
      .from("shared_tasks")
      .insert({
        agenda_id: agendaId,
        title: input.title,
        description: input.description ?? null,
        due_date: input.due_date ?? null,
        assigned_to: input.assigned_to ?? null,
        created_by: user.id,
        status: "pending",
      })
      .select()
      .single();
    if (error) throw error;
    if (input.assigned_to) notifyAssigned(input.assigned_to, input.title);
    await fetchAll();
    return data as SharedTaskRow;
  };

  const update = async (
    id: string,
    patch: Partial<Omit<SharedTaskRow, "id" | "agenda_id" | "created_by" | "created_at">>,
  ) => {
    const prev = tasks.find((t) => t.id === id);
    const { error } = await supabase
      .from("shared_tasks")
      .update({ ...patch, reminder_sent_at: patch.due_date !== undefined ? null : undefined })
      .eq("id", id);
    if (error) throw error;
    if (
      patch.assigned_to &&
      patch.assigned_to !== prev?.assigned_to &&
      prev
    ) {
      notifyAssigned(patch.assigned_to, prev.title);
    }
    if (patch.status === "done" && prev && prev.status !== "done") {
      notifyDone(prev.agenda_id, prev.title);
    }
    await fetchAll();
  };

  const remove = async (id: string) => {
    await supabase.from("shared_tasks").delete().eq("id", id);
    await fetchAll();
  };

  return { tasks, loading, create, update, remove, refresh: fetchAll };
}
