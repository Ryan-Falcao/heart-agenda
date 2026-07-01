import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "../auth/AuthContext";

export interface TaskCompletionRow {
  task_id: string;
  user_id: string;
  completed_at: string;
}

/** Completions de todas as tasks de uma agenda (para exibir quem entregou). */
export function useAgendaTaskCompletions(agendaId: string | null) {
  const { user } = useAuth();
  const [rows, setRows] = useState<TaskCompletionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!agendaId) return;
    setLoading(true);
    const { data: taskIds } = await supabase
      .from("shared_tasks")
      .select("id")
      .eq("agenda_id", agendaId);
    const ids = (taskIds ?? []).map((t: any) => t.id);
    if (!ids.length) {
      setRows([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("shared_task_completions")
      .select("*")
      .in("task_id", ids);
    setRows((data as TaskCompletionRow[]) ?? []);
    setLoading(false);
  }, [agendaId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  useEffect(() => {
    if (!agendaId) return;
    const ch = supabase
      .channel(`task-completions-${agendaId}-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shared_task_completions" },
        () => fetch(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [agendaId, fetch]);

  const isCompletedByMe = (taskId: string) =>
    !!user && rows.some((r) => r.task_id === taskId && r.user_id === user.id);

  const completedUserIds = (taskId: string) =>
    rows.filter((r) => r.task_id === taskId).map((r) => r.user_id);

  const toggleMyCompletion = async (taskId: string) => {
    if (!user) return;
    if (isCompletedByMe(taskId)) {
      await supabase
        .from("shared_task_completions")
        .delete()
        .eq("task_id", taskId)
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("shared_task_completions")
        .insert({ task_id: taskId, user_id: user.id });
    }
    await fetch();
  };

  return {
    rows,
    loading,
    isCompletedByMe,
    completedUserIds,
    toggleMyCompletion,
    refresh: fetch,
  };
}
