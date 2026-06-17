import { createFileRoute } from "@tanstack/react-router";
import { AppRoot } from "@/agenda/AppRoot";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Agenda Digital" },
      { name: "description", content: "Organize suas agendas pessoais e compartilhadas." },
    ],
  }),
  component: AppRoot,
});
