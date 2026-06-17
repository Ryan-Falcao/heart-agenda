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

    console.log("🔔 useNotificationScheduler iniciado");

    if ("Notification" in window) {
      console.log("Permissão atual:", Notification.permission);

      if (Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          console.log("Nova permissão:", permission);
        });
      }
    }

    const verificar = () => {
      const agora = Date.now();

      console.log("================================");
      console.log("Verificando notificações...");
      console.log("Agora:", new Date(agora));
      console.log("Quantidade de eventos:", eventosRef.current.length);

      for (const evento of eventosRef.current) {
        console.log("Evento encontrado:", evento);

        if (!evento.lembrete || evento.lembrete === "Sem lembrete") {
          console.log("Evento sem lembrete");
          continue;
        }

        const offset = OFFSET_MS[evento.lembrete];

        if (offset === undefined) {
          console.log("Lembrete inválido:", evento.lembrete);
          continue;
        }

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
          nome: evento.nome,
          data: evento.data,
          horaInicio: evento.horaInicio,
          lembrete: evento.lembrete,
          dataHoraEvento: dataHora,
          momentoNotificar: new Date(momentoNotificar),
          agora: new Date(agora),
          atrasoSegundos: Math.floor(
            (agora - momentoNotificar) / 1000
          ),
          jaNotificado: notificados.has(chave),
        });

        if (agora >= momentoNotificar && !notificados.has(chave)) {
          console.log("🚨 DISPARANDO NOTIFICAÇÃO:", evento.nome);

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
          } else {
            console.log(
              "❌ Notificação bloqueada. Permissão:",
              Notification.permission
            );
          }
        }
      }
    };

    verificar();

    const intervalo = window.setInterval(verificar, 10_000);

    return () => window.clearInterval(intervalo);
  }, []);
}
