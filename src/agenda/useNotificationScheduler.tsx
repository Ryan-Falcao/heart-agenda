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
const JANELA_ATRASO_MS = 60_000; // ignora notificações com mais de 1 min de atraso

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

export function useNotificationScheduler(
  eventos: Evento[],
  toast: (t: { kind: "success" | "warning" | "error"; text: string }) => void,
) {
  const eventosRef = useRef(eventos);
  const toastRef = useRef(toast);
  const notificadosRef = useRef<Set<string>>(carregarNotificados());

  useEffect(() => {
    eventosRef.current = eventos;
  }, [eventos]);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const verificar = () => {
      const agora = Date.now();

      for (const evento of eventosRef.current) {
        if (!evento.lembrete || evento.lembrete === "Sem lembrete") continue;

        const offset = OFFSET_MS[evento.lembrete];
        if (offset === undefined) continue;

        const dataHora = new Date(`${evento.data}T${evento.horaInicio}:00`);
        if (isNaN(dataHora.getTime())) continue;

        const momentoNotificar = dataHora.getTime() - offset;
        const chave = `${evento.id}-${evento.lembrete}`;
        const atraso = agora - momentoNotificar;

        // Só notifica se está dentro da janela (não notifica coisas antigas)
        if (atraso >= 0 && atraso <= JANELA_ATRASO_MS && !notificadosRef.current.has(chave)) {
          notificadosRef.current.add(chave);
          salvarNotificados(notificadosRef.current);

          toastRef.current({
            kind: "warning",
            text: `🔔 ${evento.nome} — começa em ${evento.lembrete}`,
          });

          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("Agenda Digital", {
              body: `⏰ ${evento.nome} começa em ${evento.lembrete}`,
              icon: "/favicon.ico",
            });
          }
        }

        // Marca como notificado mesmo que já tenha passado, para não disparar no futuro
        if (atraso > JANELA_ATRASO_MS && !notificadosRef.current.has(chave)) {
          notificadosRef.current.add(chave);
          salvarNotificados(notificad
