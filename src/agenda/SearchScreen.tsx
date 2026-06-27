import { useMemo, useState } from "react";
import { SearchX } from "lucide-react";
import { useStore } from "./store";
import { useNav } from "./nav";
import { AgendaIcon } from "./icons";
import { PriorityBadge } from "./ui";

const formatDate = (s: string) => {
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
};

export const SearchScreen = () => {
  const { state } = useStore();
  const { go } = useNav();
  const [q, setQ] = useState("");

  const handleCancel = () => {
    setQ("");
    go({ name: "home" });
  };
  const [q, setQ] = useState("");

  const ql = q.trim().toLowerCase();

  const results = useMemo(() => {
    if (!ql) return { eventos: [], tasks: [], agendas: [] };
    return {
      eventos: state.eventos.filter((e) => e.nome.toLowerCase().includes(ql)),
      tasks: state.tasks.filter((t) => t.nome.toLowerCase().includes(ql)),
      agendas: state.agendas.filter((a) => a.nome.toLowerCase().includes(ql)),
    };
  }, [ql, state]);

  const total =
    results.eventos.length + results.tasks.length + results.agendas.length;

  return (
    <div className="min-h-screen pb-24">
      <header className="flex items-center gap-2 px-4 py-4">
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar eventos, tarefas ou agendas..."
          className="flex-1 rounded-xl bg-gray-100 px-4 py-2.5 text-sm outline-none placeholder:text-gray-400 focus:bg-gray-50"
        />
        <button
          onClick={back}
          className="text-sm font-medium text-[#2563EB]"
        >
          Cancelar
        </button>
      </header>

      {ql && total === 0 && (
        <div className="mt-20 flex flex-col items-center text-gray-400">
          <SearchX size={48} strokeWidth={1.5} />
          <p className="mt-3 text-sm">Nenhum resultado encontrado</p>
        </div>
      )}

      {results.eventos.length > 0 && (
        <section className="mb-4 px-4">
          <h3 className="mb-2 text-xs font-semibold uppercase text-gray-500">
            Eventos
          </h3>
          <div className="space-y-2">
            {results.eventos.map((e) => {
              const ag = state.agendas.find((a) => a.id === e.agendaId);
              return (
                <button
                  key={e.id}
                  onClick={() =>
                    go({
                      name: ag?.compartilhada ? "shared" : "agenda",
                      id: e.agendaId,
                    })
                  }
                  className="flex w-full items-center gap-3 rounded-xl border border-gray-100 p-3 text-left"
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
                      {e.horaInicio} • {formatDate(e.data)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {results.tasks.length > 0 && (
        <section className="mb-4 px-4">
          <h3 className="mb-2 text-xs font-semibold uppercase text-gray-500">
            Tarefas
          </h3>
          <div className="space-y-2">
            {results.tasks.map((t) => (
              <button
                key={t.id}
                onClick={() => go({ name: "shared", id: t.agendaId })}
                className="flex w-full items-center gap-3 rounded-xl border border-gray-100 p-3 text-left"
              >
                <div className="flex-1">
                  <div
                    className={`text-sm font-semibold ${t.concluida ? "text-gray-400 line-through" : "text-[#1A1A1A]"}`}
                  >
                    {t.nome}
                  </div>
                  <div className="text-xs text-gray-400">
                    {t.concluida ? "Concluída" : "Pendente"}
                  </div>
                </div>
                <PriorityBadge p={t.prioridade} />
              </button>
            ))}
          </div>
        </section>
      )}

      {results.agendas.length > 0 && (
        <section className="mb-4 px-4">
          <h3 className="mb-2 text-xs font-semibold uppercase text-gray-500">
            Agendas
          </h3>
          <div className="space-y-2">
            {results.agendas.map((a) => {
              const count = a.compartilhada
                ? state.tasks.filter((t) => t.agendaId === a.id).length
                : state.eventos.filter((e) => e.agendaId === a.id).length;
              return (
                <button
                  key={a.id}
                  onClick={() =>
                    go({
                      name: a.compartilhada ? "shared" : "agenda",
                      id: a.id,
                    })
                  }
                  className="flex w-full items-center gap-3 rounded-xl border border-gray-100 p-3 text-left"
                >
                  <AgendaIcon name={a.icone} color={a.cor} size={36} />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-[#1A1A1A]">
                      {a.nome}
                    </div>
                    <div className="text-xs text-gray-400">{count} itens</div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
