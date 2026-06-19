import { Bell, BellOff } from "lucide-react";
import { Modal } from "./ui";
import { useNotifications } from "./useNotifications";
import { useEffect, useState } from "react";

export const NotificationPermissionPrompt = () => {
  const { supported, permission, settings, solicitarPermissao } = useNotifications();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!supported) return;
    if (permission === "default" && !settings.permissaoSolicitada) {
      const t = window.setTimeout(() => setOpen(true), 1200);
      return () => window.clearTimeout(t);
    }
  }, [supported, permission, settings.permissaoSolicitada]);

  const ativar = async () => {
    await solicitarPermissao();
    setOpen(false);
  };

  const depois = () => {
    setOpen(false);
  };

  return (
    <Modal open={open} onClose={depois} title="Ativar notificações">
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
          <Bell size={32} className="text-[#2563EB]" />
        </div>
        <p className="text-sm text-gray-700">
          Receba lembretes dos seus eventos mesmo com o app em segundo plano. Você pode ajustar o tempo
          de antecedência nas configurações.
        </p>
        <div className="space-y-2">
          <button
            type="button"
            onClick={ativar}
            className="w-full rounded-xl bg-[#2563EB] py-3 text-sm font-semibold text-white active:scale-[0.99]"
          >
            Ativar notificações
          </button>
          <button
            type="button"
            onClick={depois}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600"
          >
            <BellOff size={16} /> Agora não
          </button>
        </div>
      </div>
    </Modal>
  );
};
