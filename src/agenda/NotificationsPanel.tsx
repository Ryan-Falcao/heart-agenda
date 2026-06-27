import { useMemo } from "react";
import { BellOff, X } from "lucide-react";
import { useStore } from "./store";
import { Modal } from "./ui";

const fmtDate = (s: string) => {
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
};

export const NotificationsPanel = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const { state } = useStore();

  const items = useMemo(() => {
    const now = new Date();
    const horizonte = now.getTime() + 1000 * 60 * 60 * 48; // 48h
    return state.eventos
      .map((e) => ({
        e,
        when: new Date(`${e.data}T${e.horaInicio || "00:00"}`).getTime(),
      }))
      .filter(({ when }) => when >= now.getTime() && when <= horizonte)
      .sort((a, b) => a.when - b.when);
  }, [state.eventos]);

  return (
    <Modal open={open} onClose={onClose}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold text-[#1A1A1A]">Notificações</h2>
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="flex h-8 w-8 items-center justify-center rounded-full active:bg-gray-100"
        >
          <X size={18} color="#1A1A1A" />
        </button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-gray-400">
          <BellOff size={40} strokeWidth={1.5} />
          <p className="mt-2 text-sm">Nenhuma notificação por enquanto</p>
        </div>
      ) : (
        <ul className="space-y-2 pb-4">
          {items.map(({ e }) => {
            const ag = state.agendas.find((a) => a.id === e.agendaId);
            return (
              <li
                key={e.id}
                className="flex items-center gap-3 rounded-xl border border-gray-100 p-3"
              >
                <span
                  className="h-10 w-1 rounded-full"
                  style={{ background: ag?.cor || "#2563EB" }}
                />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-[#1A1A1A]">
                    {e.nome}
                  </div>
                  <div className="text-xs text-gray-400">
                    {fmtDate(e.data)} • {e.horaInicio}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
};
