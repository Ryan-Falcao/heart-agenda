import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const AuthPage = lazy(() =>
  import("@/agenda/auth/AuthPage").then((m) => ({ default: m.AuthPage })),
);

function AuthRoute() {
  return (
    <Suspense fallback={null}>
      <AuthPage />
    </Suspense>
  );
}

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Agenda Digital" },
      { name: "description", content: "Acesse sua Agenda Digital." },
    ],
  }),
  ssr: false,
  component: AuthRoute,
});

export { useNavigate };
