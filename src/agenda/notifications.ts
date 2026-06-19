// Utilitários de notificação: Service Worker, som e disparo cross-browser.

const SW_PATH = "/notification-sw.js";

let swRegistration: ServiceWorkerRegistration | null = null;
let audioCtx: AudioContext | null = null;
let userInteracted = false;

if (typeof window !== "undefined") {
  const markInteraction = () => {
    userInteracted = true;
    window.removeEventListener("click", markInteraction);
    window.removeEventListener("touchstart", markInteraction);
    window.removeEventListener("keydown", markInteraction);
  };
  window.addEventListener("click", markInteraction);
  window.addEventListener("touchstart", markInteraction);
  window.addEventListener("keydown", markInteraction);
}

export const hasNotificationSupport = () =>
  typeof window !== "undefined" && "Notification" in window;

export const notificationPermission = (): NotificationPermission => {
  if (!hasNotificationSupport()) return "denied";
  return Notification.permission;
};

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!hasNotificationSupport()) return "denied";
  try {
    const perm = await Notification.requestPermission();
    return perm;
  } catch {
    return "denied";
  }
};

export const registerNotificationSW = async (): Promise<ServiceWorkerRegistration | null> => {
  if (typeof window === "undefined") return null;
  if (!("serviceWorker" in navigator)) return null;
  if (swRegistration) return swRegistration;
  try {
    const reg = await navigator.serviceWorker.register(SW_PATH);
    await navigator.serviceWorker.ready;
    swRegistration = reg;
    return reg;
  } catch (e) {
    console.warn("[notifications] falha ao registrar SW", e);
    return null;
  }
};

export const userHasInteracted = () => userInteracted;

export const playAlertSound = async (volume = 0.7): Promise<boolean> => {
  if (typeof window === "undefined") return false;
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return false;
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === "suspended") {
      try { await audioCtx.resume(); } catch {}
    }
    const now = audioCtx.currentTime;
    // Dois beeps curtos (ding-dong)
    const tons = [
      { freq: 880, start: 0, dur: 0.18 },
      { freq: 1175, start: 0.22, dur: 0.28 },
    ];
    for (const t of tons) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = t.freq;
      gain.gain.setValueAtTime(0, now + t.start);
      gain.gain.linearRampToValueAtTime(volume, now + t.start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + t.start + t.dur);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(now + t.start);
      osc.stop(now + t.start + t.dur + 0.05);
    }
    return true;
  } catch {
    return false;
  }
};

export interface ShowNotificationOptions {
  title: string;
  body: string;
  tag?: string;
  url?: string;
}

export const showSystemNotification = async (opts: ShowNotificationOptions): Promise<boolean> => {
  if (!hasNotificationSupport()) return false;
  if (Notification.permission !== "granted") return false;
  try {
    const reg = swRegistration || (await registerNotificationSW());
    if (reg && reg.active) {
      reg.active.postMessage({ type: "SHOW_NOTIFICATION", payload: opts });
      return true;
    }
    // Fallback foreground
    new Notification(opts.title, { body: opts.body, tag: opts.tag, icon: "/favicon.ico" });
    return true;
  } catch {
    return false;
  }
};
