import { useState } from "react";
import { Modal, PriorityChips } from "./ui";
import { AGENDA_COLORS, AGENDA_ICON_OPTIONS, ICONS } from "./icons";
import { useStore, uid } from "./store";
import type { IconName, Priority } from "./types";

export const CreateAgendaModal = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const { dispatch, toast } = useStore();
  const [nome, setNome] = useState("");
  const [cor, setCor] = useState(AGENDA_COLORS[0]);
  const [icone, setIcone] = useState<IconName>("AlarmClock");
  const [shared, setShared] = useState(false);
  const [desc, setDesc] = useState("");
  const [prio, setPrio] = useState<Priority>("Média");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setNome("");
    setCor(AGENDA_COLORS[0]);
    setIcone("AlarmClock");
    setShared(false);
    setDesc("");
    setPrio("Média");
  };

  const submit = () => {
    if (!nome.trim()) {
      toast({ kind: "error", text: "Nome é obrigatório" });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const id = uid();
      dispatch({
        type: "ADD_AGENDA",
        agenda: {
          id,
          nome: nome.trim(),
          cor,
          icone,
          compartilhada: shared,
          descricao: shared ? desc : undefined,
          prioridade: prio,
          papel: shared ? "ADM" : undefined,
          subtitulo: shared ? "Compartilhada • 1 membro" : "Pessoal",
        },
      });
      if (shared) {
        dispatch({
          type: "ADD_MEMBRO",
          membro: {
            id: uid(),
            agendaId: id,
            nome: "Ryan",
            email: "ryan@email.com",
            papel: "ADM",
          },
        });
      }
      toast({ kind: "success", text: "Agenda criada!" });
      setLoading(false);
      reset();
      onClose();
    }, 300);
  };

  return (
    <Modal open={open} onClose={onClose} title="Nova Agenda">
      <div className="space-y-5">
        <input
          autoFocus
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome da agenda"
          className="w-full border-b border-[#F0F0F0] bg-transparent py-2 text-[15px] font-medium text-[#1A1A1A] outline-none focus:border-[#2563EB]"
        />

        <div>
          <div className="mb-2 text-xs font-semibold text-gray-600">Cor</div>
          <div className="flex gap-3">
            {AGENDA_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCor(c)}
                className={`h-8 w-8 rounded-full transition ${
                  cor === c ? "ring-2 ring-offset-2 ring-[#1A1A1A]" : ""
                }`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[#1A1A1A]">
            Agenda compartilhada
          </span>
          <button
            type="button"
            onClick={() => setShared((s) => !s)}
            className={`relative h-6 w-11 rounded-full transition ${
              shared ? "bg-[#2563EB]" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                shared ? "left-5" : "left-0.5"
              }`}
            />
          </button>
        </div>

        {shared && (
          <input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Descrição (opcional)"
            className="w-full border-b border-[#F0F0F0] bg-transparent py-2 text-sm outline-none focus:border-[#2563EB]"
          />
        )}

        <div>
          <div className="mb-2 text-xs font-semibold text-gray-600">
            Prioridade
          </div>
          <PriorityChips value={prio} onChange={setPrio} />
        </div>

        <div>
          <div className="mb-2 text-xs font-semibold text-gray-600">Ícone</div>
          <div className="flex flex-wrap gap-3">
            {AGENDA_ICON_OPTIONS.map((n) => {
              const Icon = ICONS[n];
              const active = icone === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setIcone(n)}
                  className="flex h-11 w-11 items-center justify-center rounded-xl transition"
                  style={{
                    background: active ? cor : "#F3F4F6",
                  }}
                >
                  <Icon
                    size={22}
                    color={active ? "#fff" : "#555"}
                    strokeWidth={2.2}
                  />
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={submit}
          className="w-full rounded-xl bg-[#2563EB] py-3 text-sm font-semibold text-white transition active:scale-[0.99] disabled:opacity-60"
        >
          {loading ? "Criando..." : "Criar Agenda"}
        </button>
      </div>
    </Modal>
  );
};
