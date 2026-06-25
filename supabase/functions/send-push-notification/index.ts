// Edge function: envia notificações push para uma lista de user_ids.
// Chamada por triggers (pg_net) ou pelo cron de lembretes.
// Protegida por header x-internal-secret.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import webpush from "https://esm.sh/web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface SendRequest {
  user_ids: string[];
  title: string;
  body: string;
  url?: string;
  tag?: string;
  // Or, when triggered as a reminder loop
  mode?: "send" | "reminder-scan";
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:notifications@agenda.app";
const INTERNAL_SECRET = Deno.env.get("INTERNAL_PUSH_SECRET") ?? "";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function sendToUsers(user_ids: string[], payload: { title: string; body: string; url?: string; tag?: string }) {
  if (!user_ids.length) return { sent: 0, removed: 0 };
  const { data: subs, error } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .in("user_id", user_ids);
  if (error) throw error;

  let sent = 0;
  let removed = 0;
  const removeIds: string[] = [];

  await Promise.all(
    (subs ?? []).map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
        );
        sent++;
      } catch (e: any) {
        if (e?.statusCode === 404 || e?.statusCode === 410) {
          removeIds.push(s.id);
          removed++;
        } else {
          console.error("push error", e?.statusCode, e?.body);
        }
      }
    }),
  );

  if (removeIds.length) {
    await admin.from("push_subscriptions").delete().in("id", removeIds);
  }
  return { sent, removed };
}

async function reminderScan() {
  // Find tasks whose due_date is within the user's minutes_before window and not yet reminded.
  // We fetch tasks due in the next 60 minutes (max window), then per-task compare against each member's preference.
  const now = new Date();
  const horizon = new Date(now.getTime() + 60 * 60 * 1000);
  const { data: tasks, error } = await admin
    .from("shared_tasks")
    .select("id, agenda_id, title, due_date, reminder_sent_at, status")
    .gte("due_date", now.toISOString())
    .lte("due_date", horizon.toISOString())
    .is("reminder_sent_at", null)
    .neq("status", "done");
  if (error) throw error;
  let totalSent = 0;
  for (const t of tasks ?? []) {
    const { data: members } = await admin
      .from("shared_agenda_members")
      .select("user_id")
      .eq("agenda_id", t.agenda_id);
    const userIds = (members ?? []).map((m) => m.user_id);
    if (!userIds.length) continue;
    const { data: prefs } = await admin
      .from("notification_preferences")
      .select("user_id, push_enabled, minutes_before")
      .in("user_id", userIds);
    const due = new Date(t.due_date!).getTime();
    const toNotify: string[] = [];
    for (const uid of userIds) {
      const p = prefs?.find((x) => x.user_id === uid);
      const enabled = p?.push_enabled ?? true;
      const minutes = p?.minutes_before ?? 10;
      const triggerAt = due - minutes * 60 * 1000;
      if (enabled && now.getTime() >= triggerAt) toNotify.push(uid);
    }
    if (toNotify.length) {
      const r = await sendToUsers(toNotify, {
        title: "⏰ Tarefa próxima do prazo",
        body: t.title,
        tag: `task-${t.id}`,
        url: "/",
      });
      totalSent += r.sent;
      await admin.from("shared_tasks").update({ reminder_sent_at: new Date().toISOString() }).eq("id", t.id);
    }
  }
  return { totalSent, scanned: tasks?.length ?? 0 };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Authorize internal callers
  const provided = req.headers.get("x-internal-secret");
  if (!INTERNAL_SECRET || provided !== INTERNAL_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json()) as SendRequest;
    if (body.mode === "reminder-scan") {
      const r = await reminderScan();
      return new Response(JSON.stringify(r), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const r = await sendToUsers(body.user_ids ?? [], {
      title: body.title,
      body: body.body,
      url: body.url,
      tag: body.tag,
    });
    return new Response(JSON.stringify(r), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("send-push error", e);
    return new Response(JSON.stringify({ error: e?.message ?? "error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
