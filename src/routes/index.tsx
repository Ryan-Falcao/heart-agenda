import { createFileRoute } from "@tanstack/react-router";
import { AppRoot } from "@/agenda/AppRoot";
import { useEffect, useState } from "react";

function ClientOnly() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <AppRoot />;
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Agenda Digital" },
      { name: "description", content: "Organize suas agendas pessoais e compartilhadas." },
    ],
  }),
  component: ClientOnly,
});
