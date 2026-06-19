import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const ResetPasswordPage = lazy(() =>
  import("@/agenda/auth/ResetPasswordPage").then((m) => ({
    default: m.ResetPasswordPage,
  })),
);

function ResetRoute() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordPage />
    </Suspense>
  );
}

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [{ title: "Redefinir senha — Agenda Digital" }],
  }),
  ssr: false,
  component: ResetRoute,
});
