import { useEffect, useRef } from "react";
import type { Evento } from "./types";

// Mapa de antecedência em milissegundos
const OFFSET_MS: Record<string, number> = {
  "5 min": 5 * 60 * 1000,
  "15 min": 15 * 60 * 1000,
  "30 min": 30 * 60 * 1000,
  "1 hora": 60 * 60 * 1000,
  "1 dia": 24 * 60 * 60 * 1000,
};

// IDs já notificados nesta sessão (evita repetição)
const notificados = new Set<string>();

function dispararNotificacao(
  evento: Evento,
  toast: (t: { kind: "success" | "warning" | "error"; text: string }) => void,
) {
  const label =
    evento.lembrete === "Sem lembrete" || !evento.lembrete
      ? "agora"
      : `em ${evento.lembrete}`;

  // Canal 1 — Toast interno (sempre funciona)
  toast({
    kind: "warning",
    text: `🔔 ${evento.nome} — começa ${label}`,
  });

  // Canal 2 — Notificação nativa do browser (se permitida)
  if (
    typeof window !== "undefined" &&
    "Notification" in window &&
    Notification.permission === "granted"
  ) {
    new Notification("Agenda Digital", {
      body: `⏰ ${evento.nome} começa ${label}`,
      icon: "/favicon.ico",
    });
  }
}

export function useNotificationScheduler(
  eventos: Evento[],
  toast: (t: { kind: "success" | "warning" | "error"; text: string }) => void,
) {
  // Guarda a referência atualizada dos eventos sem recriar o intervalo
  const eventosRef = useRef(eventos);
  useEffect(() => {
    eventosRef.current = eventos;
  }, [eventos]);

  useEffect(() => {
    // Pede permissão de notificação nativa ao montar
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }

    // Verifica a cada 30 segundos
    const intervalo = window.setInterval(() => {
      const agora = Date.now();

      for (const evento of eventosRef.current) {
        // Ignora eventos sem lembrete
        if (!evento.lembrete || evento.lembrete === "Sem lembrete") continue;

        const offset = OFFSET_MS[evento.lembrete];
        if (offset === undefined) continue;

        // Monta o timestamp do início do evento
        const dataHora = new Date(`${evento.data}T${evento.horaInicio}:00`);
        if (isNaN(dataHora.getTime())) continue;

        // Momento em que deve disparar a notificação
        const momentoNotificar = dataHora.getTime() - offset;

        // Chave única por evento + lembrete para não repetir
        const chave = `${evento.id}-${evento.lembrete}`;

        // Janela de ±30s para não perder o disparo
        const dentro = Math.abs(agora - momentoNotificar) <= 30_000;

        if (dentro && !notificados.has(chave)) {
          notificados.add(chave);
          dispararNotificacao(evento, toast);
        }
      }
    }, 30_000); // 30 segundos

    return () => window.clearInterval(intervalo);
  }, [toast]); // só recria se o toast mudar (nunca muda na prática)
}
