import { useEffect, useState, type ReactNode } from "react";
import { useToast } from "./store";
import type { Priority } from "./types";

export const Modal = ({
  open,
  onClose,
  children,
  title,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => setMounted(true), 10);
      return () => window.clearTimeout(t);
    }
    setMounted(false);
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <div
        className={`relative w-full max-w-[390px] rounded-t-3xl bg-white p-5 pb-7 transition-transform duration-200 ${
          mounted ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ maxHeight: "85vh", overflowY: "auto" }}
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-gray-200" />
        {title && (
          <h2 className="mb-4 text-center text-base font-bold text-[#1A1A1A]">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
};

export const PriorityChips = ({
  value,
  onChange,
}: {
  value: Priority;
  onChange: (v: Priority) => void;
}) => {
  const opts: { v: Priority; color: string; bg: string }[] = [
    { v: "Baixa", color: "#16A34A", bg: "#DCFCE7" },
    { v: "Média", color: "#D97706", bg: "#FEF3C7" },
    { v: "Alta", color: "#DC2626", bg: "#FEE2E2" },
  ];
  return (
    <div className="flex gap-2">
      {opts.map((o) => {
        const active = value === o.v;
        return (
          <button
            key={o.v}
            type="button"
            onClick={() => onChange(o.v)}
            className="rounded-full px-4 py-1.5 text-xs font-medium transition"
            style={{
              background: active ? o.color : o.bg,
              color: active ? "#fff" : o.color,
            }}
          >
            {o.v}
          </button>
        );
      })}
    </div>
  );
};

export const PriorityBadge = ({ p }: { p: Priority }) => {
  const map: Record<Priority, { c: string; bg: string }> = {
    Baixa: { c: "#16A34A", bg: "#DCFCE7" },
    Média: { c: "#D97706", bg: "#FEF3C7" },
    Alta: { c: "#DC2626", bg: "#FEE2E2" },
  };
  const s = map[p];
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={{ background: s.bg, color: s.c }}
    >
      {p}
    </span>
  );
};

export const Toast = () => {
  const t = useToast();
  if (!t) return null;
  const colors: Record<string, string> = {
    success: "bg-green-500",
    warning: "bg-yellow-500",
    error: "bg-red-500",
  };
  return (
    <div className="pointer-events-none fixed bottom-24 left-1/2 z-[60] -translate-x-1/2">
      <div
        className={`${colors[t.kind]} pointer-events-auto rounded-lg px-4 py-2 text-sm font-medium text-white shadow-lg`}
      >
        {t.text}
      </div>
    </div>
  );
};

export const Spinner = () => (
  <div className="flex items-center justify-center py-4">
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-200 border-t-[#2563EB]" />
  </div>
);

export const SectionTitle = ({ children }: { children: ReactNode }) => (
  <div className="mb-2 px-4">
    <h3 className="text-sm font-semibold text-gray-800">{children}</h3>
    <hr className="mt-2 border-[#F0F0F0]" />
  </div>
);

export const Avatar = ({
  nome,
  size = 32,
}: {
  nome: string;
  size?: number;
}) => {
  const initials = nome
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  // deterministic color
  const colors = [
    "#7C3AED",
    "#2563EB",
    "#16A34A",
    "#DC2626",
    "#D97706",
    "#0EA5E9",
  ];
  const hash = nome
    .split("")
    .reduce((a, c) => a + c.charCodeAt(0), 0);
  const bg = colors[hash % colors.length];
  return (
    <div
      className="flex items-center justify-center rounded-full font-semibold text-white"
      style={{
        background: bg,
        width: size,
        height: size,
        fontSize: size * 0.4,
      }}
    >
      {initials}
    </div>
  );
};
