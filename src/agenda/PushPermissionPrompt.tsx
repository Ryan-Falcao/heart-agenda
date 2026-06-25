import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { usePushNotifications } from "./hooks/usePushNotifications";
import { useStore } from "./store";
import { Modal } from "./ui";

const LS_KEY = "push_prompt_dismissed_v1";

export const PushPermissionPrompt = () => {
  const { supported, permission, subscribed, subscribe } = usePushNotifications();
  const { toast } = useStore();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supported) return;
    if (permission === "default" && !subscribed) {
      const dismissed = localStorage.getItem(LS_KEY);
      if (!dismissed) {
        const t = window.setTimeout(() => setOpen(true), 600);
        return () => window.clearTimeout(t);
      }
    }
  }, [supported, permission, subscribed]);

  const enable = async () => {
    setBusy(true);
    const ok = await subscribe();
    setBusy(false);
    if (ok) {
      toast({ kind: "success", text: "Notificações ativadas!" });
      setOpen(false);
    } else {
      toast({
        kind: "warning",
        text: "Sem notificações push — usaremos alertas in-app.",
      });
      localStorage.setItem(LS_KEY, "1");
      setOpen(false);
    }
  };
  const skip = () => {
    localStorage.setItem(LS_KEY, "1");
    setOpen(false);
  };

  if (!open) return null;
  return (
    <Modal open={open} onClose={skip} title="Receber lembretes?">
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
          <Bell size={28} color="#2563EB" />
        </div>
        <p className="px-2 text-sm text-gray-600">
          Receba lembretes de tarefas atribuídas, prazos próximos e atualizações
          dos seus amigos — mesmo com o app fechado.
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={enable}
            disabled={busy}
            className="w-full rounded-full bg-[#2563EB] py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Ativando..." : "Ativar notificações"}
          </button>
          <button
            onClick={skip}
            className="flex w-full items-center justify-center gap-2 rounded-full py-2 text-sm font-medium text-gray-500"
          >
            <BellOff size={14} /> Agora não
          </button>
        </div>
      </div>
    </Modal>
  );
};
