import { useEffect, useRef } from "react";
import type { Evento } from "./types";
import type { NotifSettings } from "./store";
import { playAlertSound, showSystemNotification, userHasInteracted } from "./notifications";

const STORAGE_KEY = "notificados-v1";
const JANELA_ATRASO_MS = 60_000;

const carregarNotificados = (): Set<string> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
};

const salvarNotificados = (set: Set<string>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {}
};

const disparar = async (
  nome: string,
  mensagem: string,
  notif: NotifSettings,
  toast: (t: { kind: "success" | "warning" | "error"; text: string }) => void,
) => {
  // Som (respeitando autoplay)
  if (notif.somAtivo && userHasInteracted()) {
    void playAlertSound();
  }
  // Notificação do sistema
  const enviou = await showSystemNotification({
    title: "Agenda Digital",
    body: `⏰ ${nome} — ${mensagem}`,
    tag: `agenda-${nome}`,
  });
  // Fallback in-app sempre, garante que o aviso aparece
  toast({ kind: "warning", text: `🔔 ${nome} — ${mensagem}` });
  if (!enviou && notif.somAtivo && userHasInteracted()) {
    void playAlertSound();
  }
};

export function useNotificationScheduler(
  eventos: Evento[],
  notif: NotifSettings,
  toast: (t: { kind: "success" | "warning" | "error"; text: string }) => void,
) {
  const eventosRef = useRef(eventos);
  const notifRef = useRef(notif);
  const toastRef = useRef(toast);
  const notificadosRef = useRef<Set<string>>(new Set());

  useEffect(() => { notificadosRef.current = carregarNotificados(); }, []);
  useEffect(() => { eventosRef.current = eventos; }, [eventos]);
  useEffect(() => { notifRef.current = notif; }, [notif]);
  useEffect(() => { toastRef.current = toast; }, [toast]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const verificar = () => {
      const cfg = notifRef.current;
      if (!cfg.ativadas) return;
      const agora = Date.now();

      for (const evento of eventosRef.current) {
        const dataHora = new Date(`${evento.data}T${evento.horaInicio}:00`);
        if (isNaN(dataHora.getTime())) continue;

        // Lembrete antecipado (preferência global)
        const offset = cfg.antecedenciaMin * 60_000;
        if (offset > 0) {
          const momentoNotificar = dataHora.getTime() - offset;
          const chave = `${evento.id}-pre-${cfg.antecedenciaMin}`;
          const atraso = agora - momentoNotificar;
          if (atraso > JANELA_ATRASO_MS && !notificadosRef.current.has(chave)) {
            notificadosRef.current.add(chave);
            salvarNotificados(notificadosRef.current);
          } else if (atraso >= 0 && atraso <= JANELA_ATRASO_MS && !notificadosRef.current.has(chave)) {
            notificadosRef.current.add(chave);
            salvarNotificados(notificadosRef.current);
            void disparar(evento.nome, `começa em ${cfg.antecedenciaMin} min`, cfg, toastRef.current);
          }
        }

        // Início exato
        const chaveExata = `${evento.id}-inicio`;
        const atraso = agora - dataHora.getTime();
        if (atraso > JANELA_ATRASO_MS && !notificadosRef.current.has(chaveExata)) {
          notificadosRef.current.add(chaveExata);
          salvarNotificados(notificadosRef.current);
        } else if (atraso >= 0 && atraso <= JANELA_ATRASO_MS && !notificadosRef.current.has(chaveExata)) {
          notificadosRef.current.add(chaveExata);
          salvarNotificados(notificadosRef.current);
          void disparar(evento.nome, "está começando agora! 🚀", cfg, toastRef.current);
        }
      }
    };

    verificar();
    const intervalo = window.setInterval(verificar, 10_000);
    return () => window.clearInterval(intervalo);
  }, []);
}
