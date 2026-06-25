import { useState } from "react";
import { ArrowLeft, Plus, Share2, Users } from "lucide-react";
import { useNav } from "./nav";
import { useStore } from "./store";
import { useSharedAgendas } from "./hooks/useSharedAgendas";
import { Modal, Spinner } from "./ui";

const COLORS = ["#2563EB", "#7C3AED", "#16A34A", "#DC2626", "#D97706", "#0EA5E9"];

export const SharedListScreen = () => {
  const { back, go } = useNav();
  const { toast } = useStore();
  const { loading, agendas, createAgenda } = useSharedAgendas();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      const a = await createAgenda(name.trim(), color);
      toast({ kind: "success", text: "Agenda criada!" });
      setName("");
      setShowCreate(false);
      go({ name: "sharedDetail", id: a.id });
    } catch (e: any) {
      toast({ kind: "error", text: e?.message ?? "Erro" });
    }
  };

  return (
    <div className="pb-28">
      <header className="flex items-center gap-3 px-4 pb-2 pt-5">
        <button onClick={back} className="-ml-2 p-2">
          <ArrowLeft size={22} />
        </button>
        <h1 className="flex-1 text-base font-bold text-[#1A1A1A]">
          Agendas compartilhadas
        </h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#22C55E] text-white"
          aria-label="Nova agenda"
        >
          <Plus size={18} />
        </button>
      </header>

      {loading ? (
        <Spinner />
      ) : agendas.length === 0 ? (
        <div className="px-4 py-10 text-center text-sm text-gray-400">
          Você não participa de nenhuma agenda ainda. Crie uma!
        </div>
      ) : (
        <ul className="flex flex-col gap-2 px-4">
          {agendas.map((a) => (
            <li key={a.id}>
              <button
                onClick={() => go({ name: "sharedDetail", id: a.id })}
                className="flex w-full items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 text-left active:bg-gray-50"
              >
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
                  style={{ background: a.color }}
                >
                  <Share2 size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-[#1A1A1A]">
                    {a.name}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Users size={12} />
                    <span>{a.role === "owner" ? "Você é o dono" : a.role}</span>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Nova agenda compartilhada"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Nome
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Família, Projeto X..."
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium text-gray-600">
              Cor
            </label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="h-8 w-8 rounded-full ring-2 ring-offset-2"
                  style={{
                    background: c,
                    boxShadow: color === c ? `0 0 0 2px ${c}` : "none",
                    outline: color === c ? `2px solid ${c}` : "none",
                  }}
                />
              ))}
            </div>
          </div>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="w-full rounded-full bg-[#2563EB] py-3 text-sm font-semibold text-white disabled:opacity-40"
          >
            Criar agenda
          </button>
        </div>
      </Modal>
    </div>
  );
};
