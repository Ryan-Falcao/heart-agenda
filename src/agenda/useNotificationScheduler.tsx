
import { useEffect, useRef } from "react";
import type { Evento } from "./types";

const OFFSET_MS: Record<string, number> = {
  "5 min": 5 * 60 * 1000,
  "15 min": 15 * 60 * 1000,
  "30 min": 30 * 60 * 1000,
  "1 hora": 60 * 60 * 1000,
  "1 dia": 24 * 60 * 60 * 1000,
};

const notificados = new Set<string>();

export function useNotificationScheduler(
  eventos: Evento[],
  toast: (t: { kind: "success" | "warning" | "error"; text: string }) => void,
) {
  const eventosRef = useRef(eventos);
  const toastRef = useRef(toast);

  useEffect(() => {
    eventosRef.current = eventos;
  }, [eventos]);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  useEffect(() => {
    // Garante que só roda no browser
    if (typeof window === "undefined") return;

    // Pede permissão de notificação nativa
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
        const dentro = Math.abs(agora - momentoNotificar) <= 60_000;

        if (dentro && !notificados.has(chave)) {
          notificados.add(chave);

          const label = `em ${evento.lembrete}`;

          toastRef.current({
            kind: "warning",
            text: `🔔 ${evento.nome} — começa ${label}`,
          });

          if (
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            new Notification("Agenda Digital", {
              body: `⏰ ${evento.nome} começa ${label}`,
              icon: "/favicon.ico",
            });
          }
        }
      }
    };

    // Roda imediatamente uma vez e depois a cada 30s
    verificar();
    const intervalo = window.setInterval(verificar, 10_000);

    return () => window.clearInterval(intervalo);
  }, []); // array vazio — roda só no mount, no client
}
