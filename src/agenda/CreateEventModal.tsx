import { useState } from "react";
import { Modal, PriorityChips } from "./ui";
import { useStore, uid } from "./store";
import { ICONS } from "./icons";
import type { Evento, Priority } from "./types";

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const CreateEventModal = ({
  open,
  onClose,
  defaultAgendaId,
}: {
  open: boolean;
  onClose: () => void;
  defaultAgendaId?: string;
}) => {
  const { state, dispatch, toast } = useStore();
  const [nome, setNome] = useState("");
  const [data, setData] = useState(todayStr());
  const [hi, setHi] = useState("09:00");
  const [hf, setHf] = useState("10:00");
  const [rep, setRep] = useState<Evento["repeticao"]>("Não repete");
  const [lem, setLem] = useState("15 min");
  const [prio, setPrio] = useState<Priority>("Média");
  const [agendaId, setAgendaId] = useState(
    defaultAgendaId || state.agendas[0]?.id || "",
  );
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = () => {
    if (!nome.trim()) {
      toast({ kind: "error", text: "Nome do evento é obrigatório" });
      return;
    }
    if (!agendaId) {
      toast({ kind: "error", text: "Selecione uma agenda" });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      // Conflict check
      const conflict = state.eventos.find(
        (e) =>
          e.agendaId === agendaId &&
          e.data === data &&
          !(hf <= e.horaInicio || hi >= e.horaFim),
      );
      dispatch({
        type: "ADD_EVENTO",
        evento: {
          id: uid(),
          agendaId,
          nome: nome.trim(),
          data,
          horaInicio: hi,
          horaFim: hf,
          repeticao: rep,
          lembrete: lem,
          prioridade: prio,
          descricao: desc,
        },
      });
      if (conflict) {
        toast({
          kind: "warning",
          text: `⚠ Conflito de horário com ${conflict.nome}`,
        });
      } else {
        toast({ kind: "success", text: "Evento criado!" });
      }
      setLoading(false);
      setNome("");
      setDesc("");
      onClose();
    }, 300);
  };

  const selectedAgenda = state.agendas.find((a) => a.id === agendaId);
  const SelectedIcon = selectedAgenda ? ICONS[selectedAgenda.icone] : null;

  return (
    <Modal open={open} onClose={onClose} title="Novo Evento">
      <div className="space-y-4">
        <input
          autoFocus
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome do evento"
          className="w-full border-b border-[#F0F0F0] bg-transparent py-2 text-base font-semibold outline-none focus:border-[#2563EB]"
        />

        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">
            Data
          </label>
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#2563EB]"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-semibold text-gray-600">
              Início
            </label>
            <input
              type="time"
              value={hi}
              onChange={(e) => setHi(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#2563EB]"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-semibold text-gray-600">
              Fim
            </label>
            <input
              type="time"
              value={hf}
              onChange={(e) => setHf(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#2563EB]"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">
            Repetição
          </label>
          <select
            value={rep}
            onChange={(e) => setRep(e.target.value as Evento["repeticao"])}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#2563EB]"
          >
            <option>Não repete</option>
            <option>Diário</option>
            <option>Semanal</option>
            <option>Mensal</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">
            Lembrete
          </label>
          <select
            value={lem}
            onChange={(e) => setLem(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#2563EB]"
          >
            <option>Sem lembrete</option>
            <option>5 min</option>
            <option>15 min</option>
            <option>30 min</option>
            <option>1 hora</option>
            <option>1 dia antes</option>
          </select>
        </div>

        <div>
          <div className="mb-2 text-xs font-semibold text-gray-600">
            Prioridade
          </div>
          <PriorityChips value={prio} onChange={setPrio} />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">
            Agenda
          </label>
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
            {SelectedIcon && selectedAgenda && (
              <div
                className="flex h-6 w-6 items-center justify-center rounded-md"
                style={{ background: selectedAgenda.cor }}
              >
                <SelectedIcon size={14} color="#fff" />
              </div>
            )}
            <select
              value={agendaId}
              onChange={(e) => setAgendaId(e.target.value)}
              className="flex-1 bg-white text-sm outline-none"
            >
              {state.agendas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">
            Descrição
          </label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={2}
            className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#2563EB]"
          />
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={submit}
          className="w-full rounded-xl bg-[#2563EB] py-3 text-sm font-semibold text-white transition active:scale-[0.99] disabled:opacity-60"
        >
          {loading ? "Salvando..." : "Criar Evento"}
        </button>
      </div>
    </Modal>
  );
};
