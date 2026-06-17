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
    if (typeof window === "undefined") return;

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const verificar = () => {
      const agora = Date.now();

      console.log("================================");
      console.log("Agora:", new Date(agora));

      for (const evento of eventosRef.current) {
        if (!evento.lembrete || evento.lembrete === "Sem lembrete") continue;

        const offset = OFFSET_MS[evento.lembrete];
        if (offset === undefined) continue;

        const dataHora = new Date(
          `${evento.data}T${evento.horaInicio}:00`
        );

        if (isNaN(dataHora.getTime())) {
          console.log("Data inválida:", evento);
          continue;
        }

        const momentoNotificar = dataHora.getTime() - offset;
        const chave = `${evento.id}-${evento.lembrete}`;

        console.log({
          evento: evento.nome,
          data: evento.data,
          horaInicio: evento.horaInicio,
          lembrete: evento.lembrete,
          dataHoraEvento: dataHora,
          momentoNotificar: new Date(momentoNotificar),
          diferencaSegundos: Math.floor(
            (agora - momentoNotificar) / 1000
          ),
          jaNotificado: notificados.has(chave),
        });

        // Melhor que a lógica original:
        // dispara se já passou do horário e ainda não notificou
        if (agora >= momentoNotificar && !notificados.has(chave)) {
          notificados.add(chave);

          const label = `em ${evento.lembrete}`;

          console.log("🔔 NOTIFICAÇÃO DISPARADA:", evento.nome);

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

    verificar();

    // verifica a cada 10 segundos
    const intervalo = window.setInterval(verificar, 10_000);

    return () => window.clearInterval(intervalo);
  }, []);
}
