import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const AppRoot = lazy(() =>
  import("@/agenda/AppRoot").then((m) => ({ default: m.AppRoot }))
);

function App() {
  return (
    <Suspense fallback={null}>
      <AppRoot />
    </Suspense>
  );
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Agenda Digital" },
      { name: "description", content: "Organize suas agendas pessoais e compartilhadas." },
    ],
  }),
  ssr: false,
  component: App,
});
