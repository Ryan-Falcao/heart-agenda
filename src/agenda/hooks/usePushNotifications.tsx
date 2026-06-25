import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "../auth/AuthContext";
import { VAPID_PUBLIC_KEY } from "../config";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export interface NotifPrefs {
  push_enabled: boolean;
  minutes_before: number;
  sound_enabled: boolean;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default",
  );
  const [subscribed, setSubscribed] = useState(false);
  const [prefs, setPrefs] = useState<NotifPrefs>({
    push_enabled: true,
    minutes_before: 10,
    sound_enabled: true,
  });

  const supported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  const ensureRegistration = useCallback(async () => {
    if (!supported) return null;
    const reg =
      (await navigator.serviceWorker.getRegistration("/")) ??
      (await navigator.serviceWorker.register("/sw.js"));
    return reg;
  }, [supported]);

  const fetchPrefs = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) {
      setPrefs({
        push_enabled: data.push_enabled,
        minutes_before: data.minutes_before,
        sound_enabled: data.sound_enabled,
      });
    }
  }, [user]);

  const checkSubscription = useCallback(async () => {
    if (!supported || !user) return;
    const reg = await ensureRegistration();
    if (!reg) return;
    const sub = await reg.pushManager.getSubscription();
    setSubscribed(!!sub);
  }, [supported, user, ensureRegistration]);

  useEffect(() => {
    fetchPrefs();
    checkSubscription();
  }, [fetchPrefs, checkSubscription]);

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!supported) return "denied";
    const p = await Notification.requestPermission();
    setPermission(p);
    return p;
  }, [supported]);

  const subscribe = useCallback(async () => {
    if (!supported || !user) return false;
    let perm = permission;
    if (perm !== "granted") perm = await requestPermission();
    if (perm !== "granted") return false;
    const reg = await ensureRegistration();
    if (!reg) return false;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }
    const json = sub.toJSON() as any;
    await supabase.from("push_subscriptions").upsert(
      {
        user_id: user.id,
        endpoint: sub.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
        user_agent: navigator.userAgent,
      },
      { onConflict: "endpoint" },
    );
    await supabase.from("notification_preferences").upsert(
      { user_id: user.id, ...prefs },
      { onConflict: "user_id" },
    );
    setSubscribed(true);
    return true;
  }, [supported, user, permission, requestPermission, ensureRegistration, prefs]);

  const unsubscribe = useCallback(async () => {
    if (!supported || !user) return;
    const reg = await ensureRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
      await sub.unsubscribe();
    }
    setSubscribed(false);
  }, [supported, user, ensureRegistration]);

  const updatePrefs = useCallback(
    async (patch: Partial<NotifPrefs>) => {
      if (!user) return;
      const next = { ...prefs, ...patch };
      setPrefs(next);
      await supabase
        .from("notification_preferences")
        .upsert({ user_id: user.id, ...next }, { onConflict: "user_id" });
    },
    [user, prefs],
  );

  return {
    supported,
    permission,
    subscribed,
    prefs,
    requestPermission,
    subscribe,
    unsubscribe,
    updatePrefs,
    refresh: () => {
      fetchPrefs();
      checkSubscription();
    },
  };
}
