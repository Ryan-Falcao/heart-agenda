import { useMemo } from "react";
import { BellOff, Check, Users, X } from "lucide-react";
import { useStore } from "./store";
import { Modal } from "./ui";
import { useMyPendingInvites } from "./hooks/useAgendaInvites";
import { useNav } from "./nav";

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
  const { state, toast } = useStore();
  const { go } = useNav();
  const { invites, accept, reject } = useMyPendingInvites();

  const items = useMemo(() => {
    const now = new Date();
    const horizonte = now.getTime() + 1000 * 60 * 60 * 48;
    return state.eventos
      .map((e) => ({
        e,
        when: new Date(`${e.data}T${e.horaInicio || "00:00"}`).getTime(),
      }))
      .filter(({ when }) => when >= now.getTime() && when <= horizonte)
      .sort((a, b) => a.when - b.when);
  }, [state.eventos]);

  const handleAccept = async (inv: any) => {
    try {
      await accept(inv);
      toast({ kind: "success", text: "Convite aceito!" });
      onClose();
      go({ name: "sharedDetail", id: inv.agenda_id });
    } catch (e: any) {
      toast({ kind: "error", text: e?.message ?? "Erro" });
    }
  };
  const handleReject = async (inv: any) => {
    try {
      await reject(inv);
      toast({ kind: "success", text: "Convite recusado" });
    } catch (e: any) {
      toast({ kind: "error", text: e?.message ?? "Erro" });
    }
  };

  const empty = items.length === 0 && invites.length === 0;

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

      {empty ? (
        <div className="flex flex-col items-center py-8 text-gray-400">
          <BellOff size={40} strokeWidth={1.5} />
          <p className="mt-2 text-sm">Nenhuma notificação por enquanto</p>
        </div>
      ) : (
        <div className="space-y-4 pb-4">
          {invites.length > 0 && (
            <section>
              <div className="mb-1.5 text-[10px] font-semibold uppercase text-gray-400">
                Convites de agenda
              </div>
              <ul className="space-y-2">
                {invites.map((inv) => (
                  <li
                    key={inv.id}
                    className="rounded-xl border border-blue-100 bg-blue-50 p-3"
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-white"
                        style={{ background: inv.agenda_color || "#2563EB" }}
                      >
                        <Users size={14} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-[#1A1A1A]">
                          {inv.agenda_name ?? "Agenda"}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {inv.inviter_name
                            ? `Convite de ${inv.inviter_name}`
                            : "Novo convite"}{" "}
                          • {inv.role}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => handleReject(inv)}
                        className="flex-1 rounded-full border border-gray-200 py-1.5 text-[11px] font-semibold text-gray-600"
                      >
                        Recusar
                      </button>
                      <button
                        onClick={() => handleAccept(inv)}
                        className="flex flex-1 items-center justify-center gap-1 rounded-full bg-[#22C55E] py-1.5 text-[11px] font-semibold text-white"
                      >
                        <Check size={12} /> Aceitar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {items.length > 0 && (
            <section>
              <div className="mb-1.5 text-[10px] font-semibold uppercase text-gray-400">
                Próximos eventos
              </div>
              <ul className="space-y-2">
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
            </section>
          )}
        </div>
      )}
    </Modal>
  );
};
