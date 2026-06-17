import { useEffect, useRef } from "react";
import type { Evento } from "./types";

const OFFSET_MS: Record<string, number> = {
  "5 min": 5 * 60 * 1000,
  "15 min": 15 * 60 * 1000,
  "30 min": 30 * 60 * 1000,
  "1 hora": 60 * 60 * 1000,
  "1 dia": 24 * 60 * 60 * 1000,
};

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

const tocarSom = () => {
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.setValueAtTime(660, ctx.currentTime + 0.15);
    oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.3);
    gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.6);
  } catch {}
};

const dispararNotificacao = (
  nome: string,
  mensagem: string,
  toast: (t: { kind: "success" | "warning" | "error"; text: string }) => void
) => {
  tocarSom();
  toast({ kind: "warning", text: `🔔 ${nome} — ${mensagem}` });
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("Agenda Digital", {
      body: `⏰ ${nome} — ${mensagem}`,
      icon: "/favicon.ico",
    });
  }
};

export function useNotificationScheduler(
  eventos: Evento[],
  toast: (t: { kind: "success" | "warning" | "error"; text: string }) => void,
) {
  const eventosRef = useRef(eventos);
  const toastRef = useRef(toast);
  const notificadosRef = useRef<Set<string>>(new Set());

  useEffect(() => { notificadosRef.current = carregarNotificados(); }, []);
  useEffect(() => { eventosRef.current = eventos; }, [eventos]);
  useEffect(() => { toastRef.current = toast; }, [toast]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const verificar = () => {
      const agora = Date.now();

      for (const evento of eventosRef.current) {
        // Notificação de lembrete antecipado
        if (evento.lembrete && evento.lembrete !== "Sem lembrete") {
          const offset = OFFSET_MS[evento.lembrete];
          if (offset !== undefined) {
            const dataHora = new Date(`${evento.data}T${evento.horaInicio}:00`);
            if (!isNaN(dataHora.getTime())) {
              const momentoNotificar = dataHora.getTime() - offset;
              const chave = `${evento.id}-lembrete-${evento.lembrete}`;
              const atraso = agora - momentoNotificar;
              if (atraso > JANELA_ATRASO_MS && !notificadosRef.current.has(chave)) {
                notificadosRef.current.add(chave);
                salvarNotificados(notificadosRef.current);
              } else if (atraso >= 0 && atraso <= JANELA_ATRASO_MS && !notificadosRef.current.has(chave)) {
                notificadosRef.current.add(chave);
                salvarNotificados(notificadosRef.current);
                dispararNotificacao(evento.nome, `começa em ${evento.lembrete}`, toastRef.current);
              }
            }
          }
        }

        // Notificação na hora exata do evento
        const dataHora = new Date(`${evento.data}T${evento.horaInicio}:00`);
        if (!isNaN(dataHora.getTime())) {
          const chaveExata = `${evento.id}-inicio`;
          const atraso = agora - dataHora.getTime();
          if (atraso > JANELA_ATRASO_MS && !notificadosRef.current.has(chaveExata)) {
            notificadosRef.current.add(chaveExata);
            salvarNotificados(notificadosRef.current);
          } else if (atraso >= 0 && atraso <= JANELA_ATRASO_MS && !notificadosRef.current.has(chaveExata)) {
            notificadosRef.current.add(chaveExata);
            salvarNotificados(notificadosRef.current);
            dispararNotificacao(evento.nome, "está começando agora! 🚀", toastRef.current);
          }
        }
      }
    };

    verificar();
    const intervalo = window.setInterval(verificar, 10_000);
    return () => window.clearInterval(intervalo);
  }, []);
}
