import { useMemo, useState } from "react";
import { ChevronLeft, MoreVertical, Plus, Trash2, Pencil } from "lucide-react";
import { useStore } from "./store";
import { useNav } from "./nav";
import { AgendaIcon } from "./icons";
import { Modal, PriorityBadge } from "./ui";
import { CreateEventModal } from "./CreateEventModal";

const fmt = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const WEEK = ["D", "S", "T", "Q", "Q", "S", "S"];

export const AgendaScreen = ({ id }: { id: string }) => {
  const { state, dispatch, toast } = useStore();
  const { back } = useNav();
  const agenda = state.agendas.find((a) => a.id === id);
  const [selected, setSelected] = useState(() => fmt(new Date()));
  const [showCreate, setShowCreate] = useState(false);
  const [menu, setMenu] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);

  const weekDays = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, []);

  if (!agenda) return null;

  const eventsOfAgenda = state.eventos.filter((e) => e.agendaId === id);
  const eventsOfDay = eventsOfAgenda
    .filter((e) => e.data === selected)
    .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));

  const detailEv = detail ? state.eventos.find((e) => e.id === detail) : null;

  return (
    <div className="pb-32">
      <header className="flex items-center justify-between px-4 py-4">
        <button
          onClick={back}
          className="flex h-9 w-9 items-center justify-center rounded-full active:bg-gray-100"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="flex items-center gap-2">
          <AgendaIcon name={agenda.icone} color={agenda.cor} size={28} />
          <h1 className="text-base font-bold text-[#1A1A1A]">{agenda.nome}</h1>
        </div>
        <button
          onClick={() => setMenu((m) => !m)}
          className="relative flex h-9 w-9 items-center justify-center rounded-full active:bg-gray-100"
        >
          <MoreVertical size={20} />
          {menu && (
            <div className="absolute right-0 top-10 z-20 w-44 overflow-hidden rounded-xl border border-gray-100 bg-white text-left text-sm shadow-lg">
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setMenu(false);
                  toast({ kind: "success", text: "Função em breve" });
                }}
                className="flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50"
              >
                <Pencil size={16} /> Editar agenda
              </div>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setMenu(false);
                  dispatch({ type: "DELETE_AGENDA", id });
                  toast({ kind: "success", text: "Agenda excluída" });
                  back();
                }}
                className="flex items-center gap-2 px-3 py-2.5 text-red-600 hover:bg-red-50"
              >
                <Trash2 size={16} /> Excluir agenda
              </div>
            </div>
          )}
        </button>
      </header>

      {/* Mini calendar */}
      <div className="px-4">
        <div className="flex justify-between">
          {weekDays.map((d, i) => {
            const s = fmt(d);
            const isSel = s === selected;
            const has = eventsOfAgenda.some((e) => e.data === s);
            return (
              <button
                key={i}
                onClick={() => setSelected(s)}
                className="flex flex-1 flex-col items-center gap-1 py-1"
              >
                <span className="text-[10px] font-medium text-gray-400">
                  {WEEK[i]}
                </span>
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition"
                  style={{
                    background: isSel ? agenda.cor : "transparent",
                    color: isSel ? "#fff" : "#1A1A1A",
                  }}
                >
                  {d.getDate()}
                </span>
                <span
                  className="h-1 w-1 rounded-full"
                  style={{ background: has ? agenda.cor : "transparent" }}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Events */}
      <section className="mt-4 px-4">
        <h3 className="mb-2 text-sm font-semibold text-gray-800">Eventos</h3>
        <hr className="mb-3 border-[#F0F0F0]" />
        {eventsOfDay.length === 0 && (
          <p className="py-6 text-center text-xs text-gray-400">
            Nenhum evento neste dia
          </p>
        )}
        <div className="space-y-2">
          {eventsOfDay.map((e) => (
            <button
              key={e.id}
              onClick={() => setDetail(e.id)}
              className="flex w-full items-center gap-3 overflow-hidden rounded-xl border border-gray-100 bg-white p-3 text-left"
            >
              <span
                className="h-12 w-[3px] rounded-full"
                style={{ background: agenda.cor }}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-[#1A1A1A]">
                  {e.nome}
                </div>
                <div className="text-xs text-gray-400">
                  {e.horaInicio} - {e.horaFim} • {e.data.split("-").reverse().slice(0, 2).join("/")}
                </div>
              </div>
              <PriorityBadge p={e.prioridade} />
            </button>
          ))}
        </div>
      </section>

      {/* FAB */}
      <button
        onClick={() => setShowCreate(true)}
        className="fixed bottom-24 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-[#22C55E] text-white shadow-lg shadow-green-300 active:scale-95"
        style={{ left: "calc(50% + 195px - 80px)" }}
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      <CreateEventModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        defaultAgendaId={id}
      />

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="Detalhes do evento"
      >
        {detailEv && (
          <div className="space-y-3">
            <div>
              <div className="text-xs text-gray-400">Evento</div>
              <div className="text-base font-semibold">{detailEv.nome}</div>
            </div>
            <div className="flex gap-4">
              <div>
                <div className="text-xs text-gray-400">Início</div>
                <div className="text-sm font-medium">{detailEv.horaInicio}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Fim</div>
                <div className="text-sm font-medium">{detailEv.horaFim}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Data</div>
                <div className="text-sm font-medium">
                  {detailEv.data.split("-").reverse().join("/")}
                </div>
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Prioridade</div>
              <PriorityBadge p={detailEv.prioridade} />
            </div>
            {detailEv.descricao && (
              <div>
                <div className="text-xs text-gray-400">Descrição</div>
                <div className="text-sm">{detailEv.descricao}</div>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  toast({ kind: "success", text: "Função em breve" });
                  setDetail(null);
                }}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold"
              >
                Editar
              </button>
              <button
                onClick={() => {
                  dispatch({ type: "DELETE_EVENTO", id: detailEv.id });
                  toast({ kind: "success", text: "Evento excluído" });
                  setDetail(null);
                }}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white"
              >
                Excluir
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
