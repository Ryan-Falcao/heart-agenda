import { useState } from "react";
import {
  ChevronLeft,
  Clock,
  MoreHorizontal,
  Send,
  UserPlus,
} from "lucide-react";
import { useStore, uid } from "./store";
import { useNav } from "./nav";
import { Avatar, Modal, PriorityBadge, PriorityChips } from "./ui";
import type { Priority, Task } from "./types";

export const SharedAgendaScreen = ({ id }: { id: string }) => {
  const { state, dispatch, toast } = useStore();
  const { back } = useNav();
  const agenda = state.agendas.find((a) => a.id === id);
  const [tab, setTab] = useState<"membros" | "tarefas">("membros");
  const [showInvite, setShowInvite] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [memberMenu, setMemberMenu] = useState<string | null>(null);

  if (!agenda) return null;
  const isAdm = agenda.papel === "ADM";
  const membros = state.membros.filter((m) => m.agendaId === id);
  const tasks = state.tasks.filter((t) => t.agendaId === id);

  return (
    <div className="pb-24">
      <header className="flex items-center justify-between px-4 py-4">
        <button
          onClick={back}
          className="flex h-9 w-9 items-center justify-center rounded-full active:bg-gray-100"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="flex items-center gap-2">
          <h1 className="text-base font-bold text-[#1A1A1A]">{agenda.nome}</h1>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              isAdm
                ? "bg-[#2563EB] text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {agenda.papel}
          </span>
        </div>
        <div className="w-9" />
      </header>

      {/* Tabs */}
      <div className="mx-4 mb-4 flex rounded-xl bg-gray-100 p-1">
        {(["membros", "tarefas"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold capitalize transition ${
              tab === t ? "bg-white text-[#1A1A1A] shadow-sm" : "text-gray-500"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "membros" && (
        <section className="px-4">
          {isAdm && (
            <div className="mb-3 flex justify-end">
              <button
                onClick={() => setShowInvite(true)}
                className="flex items-center gap-1.5 rounded-full bg-[#2563EB] px-3 py-1.5 text-xs font-semibold text-white"
              >
                <UserPlus size={14} /> Convidar
              </button>
            </div>
          )}
          <div className="space-y-2">
            {membros.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-xl border border-gray-100 p-3"
              >
                <Avatar nome={m.nome} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-semibold text-[#1A1A1A]">
                      {m.nome}
                    </span>
                    {m.pendente && (
                      <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                        <Clock size={10} /> pendente
                      </span>
                    )}
                  </div>
                  <div className="truncate text-xs text-gray-400">
                    {m.email}
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    m.papel === "ADM"
                      ? "bg-[#2563EB] text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {m.papel}
                </span>
                {isAdm && m.nome !== state.usuario.nome && (
                  <button
                    onClick={() =>
                      setMemberMenu(memberMenu === m.id ? null : m.id)
                    }
                    className="relative flex h-8 w-8 items-center justify-center rounded-full active:bg-gray-100"
                  >
                    <MoreHorizontal size={18} />
                    {memberMenu === m.id && (
                      <div className="absolute right-0 top-9 z-20 w-48 overflow-hidden rounded-xl border border-gray-100 bg-white text-left text-sm shadow-lg">
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            dispatch({
                              type: "UPDATE_MEMBRO",
                              membro: {
                                ...m,
                                papel: m.papel === "ADM" ? "Membro" : "ADM",
                              },
                            });
                            setMemberMenu(null);
                            toast({ kind: "success", text: "Papel atualizado" });
                          }}
                          className="px-3 py-2.5 hover:bg-gray-50"
                        >
                          Alterar para {m.papel === "ADM" ? "Membro" : "ADM"}
                        </div>
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            dispatch({ type: "DELETE_MEMBRO", id: m.id });
                            setMemberMenu(null);
                            toast({ kind: "success", text: "Membro removido" });
                          }}
                          className="px-3 py-2.5 text-red-600 hover:bg-red-50"
                        >
                          Remover da agenda
                        </div>
                      </div>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "tarefas" && (
        <section className="px-4">
          {isAdm && (
            <div className="mb-3 flex justify-end">
              <button
                onClick={() => setShowNewTask(true)}
                className="rounded-full bg-[#2563EB] px-3 py-1.5 text-xs font-semibold text-white"
              >
                + Nova Task
              </button>
            </div>
          )}
          <div className="space-y-2">
            {tasks.length === 0 && (
              <p className="py-6 text-center text-xs text-gray-400">
                Nenhuma tarefa ainda
              </p>
            )}
            {tasks.map((t) => (
              <TaskRow
                key={t.id}
                task={t}
                expanded={expanded === t.id}
                onToggleExpand={() =>
                  setExpanded(expanded === t.id ? null : t.id)
                }
                isAdm={isAdm}
              />
            ))}
          </div>
        </section>
      )}

      {showInvite && (
        <InviteModal
          agendaId={id}
          onClose={() => setShowInvite(false)}
        />
      )}
      {showNewTask && (
        <NewTaskModal agendaId={id} onClose={() => setShowNewTask(false)} />
      )}
    </div>
  );
};

const TaskRow = ({
  task,
  expanded,
  onToggleExpand,
  isAdm,
}: {
  task: Task;
  expanded: boolean;
  onToggleExpand: () => void;
  isAdm: boolean;
}) => {
  const { state, dispatch, toast } = useStore();
  const [comment, setComment] = useState("");
  const responsaveis = state.membros.filter((m) =>
    task.responsaveis.includes(m.id),
  );
  const comentarios = state.comentarios.filter((c) => c.taskId === task.id);

  const sendComment = () => {
    if (!comment.trim()) return;
    dispatch({
      type: "ADD_COMENTARIO",
      comentario: {
        id: uid(),
        taskId: task.id,
        autor: state.usuario.nome,
        texto: comment.trim(),
        hora: new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    });
    setComment("");
  };

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3">
      <div className="flex items-center gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            dispatch({ type: "TOGGLE_TASK", id: task.id });
          }}
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
            task.concluida
              ? "border-[#22C55E] bg-[#22C55E]"
              : "border-gray-300"
          }`}
        >
          {task.concluida && (
            <svg viewBox="0 0 16 16" className="h-3 w-3 text-white">
              <path
                d="M3 8l3 3 7-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>
        <button
          onClick={onToggleExpand}
          className="min-w-0 flex-1 text-left"
        >
          <div
            className={`truncate text-sm font-semibold ${task.concluida ? "text-gray-400 line-through" : "text-[#1A1A1A]"}`}
          >
            {task.nome}
          </div>
          <div className="text-[11px] text-gray-400">
            {task.prazo.split("-").reverse().slice(0, 2).join("/")}
          </div>
        </button>
        <PriorityBadge p={task.prioridade} />
        <div className="flex -space-x-2">
          {responsaveis.slice(0, 3).map((r) => (
            <div key={r.id} className="ring-2 ring-white rounded-full">
              <Avatar nome={r.nome} size={24} />
            </div>
          ))}
          {responsaveis.length > 3 && (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-[10px] font-semibold ring-2 ring-white">
              +{responsaveis.length - 3}
            </div>
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-3 space-y-3 border-t border-gray-100 pt-3">
          {task.descricao && (
            <div>
              <div className="text-[10px] uppercase text-gray-400">
                Descrição
              </div>
              <div className="text-sm text-[#1A1A1A]">{task.descricao}</div>
            </div>
          )}
          <div>
            <div className="text-[10px] uppercase text-gray-400">
              Responsáveis
            </div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {responsaveis.map((r) => (
                <span
                  key={r.id}
                  className="rounded-full bg-gray-100 px-2 py-1 text-xs text-[#1A1A1A]"
                >
                  {r.nome}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase text-gray-400">
              Comentários
            </div>
            <div className="mt-1 space-y-2">
              {comentarios.map((c) => (
                <div key={c.id} className="flex gap-2">
                  <Avatar nome={c.autor} size={28} />
                  <div className="flex-1 rounded-lg bg-gray-50 p-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">{c.autor}</span>
                      <span className="text-[10px] text-gray-400">
                        {c.hora}
                      </span>
                    </div>
                    <div className="text-xs text-[#1A1A1A]">{c.texto}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Escreva um comentário..."
                className="flex-1 rounded-full bg-gray-100 px-3 py-2 text-xs outline-none"
              />
              <button
                onClick={sendComment}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2563EB] text-white"
              >
                <Send size={14} />
              </button>
            </div>
          </div>

          {isAdm && (
            <div className="flex gap-2">
              <button
                onClick={() => toast({ kind: "success", text: "Função em breve" })}
                className="flex-1 rounded-lg border border-gray-200 py-2 text-xs font-semibold"
              >
                Editar
              </button>
              <button
                onClick={() => {
                  dispatch({
                    type: "UPDATE_TASK",
                    task: { ...task, encerrada: true, concluida: true },
                  });
                  toast({ kind: "success", text: "Task encerrada" });
                }}
                className="flex-1 rounded-lg bg-red-500 py-2 text-xs font-semibold text-white"
              >
                Encerrar task
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const InviteModal = ({
  agendaId,
  onClose,
}: {
  agendaId: string;
  onClose: () => void;
}) => {
  const { dispatch, toast } = useStore();
  const [email, setEmail] = useState("");
  const [papel, setPapel] = useState<"ADM" | "Membro">("Membro");

  const submit = () => {
    if (!email.trim()) {
      toast({ kind: "error", text: "Informe o e-mail" });
      return;
    }
    dispatch({
      type: "ADD_MEMBRO",
      membro: {
        id: uid(),
        agendaId,
        nome: email.split("@")[0],
        email,
        papel,
        pendente: true,
      },
    });
    toast({ kind: "success", text: "Convite enviado!" });
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="Convidar membro">
      <div className="space-y-4">
        <input
          autoFocus
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-mail do convidado"
          className="w-full border-b border-[#F0F0F0] bg-transparent py-2 text-sm outline-none focus:border-[#2563EB]"
        />
        <div>
          <div className="mb-2 text-xs font-semibold text-gray-600">Papel</div>
          <div className="flex gap-2">
            {(["Membro", "ADM"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPapel(p)}
                className={`flex-1 rounded-full py-2 text-xs font-semibold ${
                  papel === p
                    ? "bg-[#2563EB] text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={submit}
          className="w-full rounded-xl bg-[#2563EB] py-3 text-sm font-semibold text-white"
        >
          Enviar convite
        </button>
      </div>
    </Modal>
  );
};

const NewTaskModal = ({
  agendaId,
  onClose,
}: {
  agendaId: string;
  onClose: () => void;
}) => {
  const { state, dispatch, toast } = useStore();
  const [nome, setNome] = useState("");
  const [desc, setDesc] = useState("");
  const [prazo, setPrazo] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [prio, setPrio] = useState<Priority>("Média");
  const [resp, setResp] = useState<string[]>([]);
  const membros = state.membros.filter((m) => m.agendaId === agendaId);

  const toggleResp = (id: string) =>
    setResp((r) => (r.includes(id) ? r.filter((x) => x !== id) : [...r, id]));

  const submit = () => {
    if (!nome.trim()) {
      toast({ kind: "error", text: "Nome é obrigatório" });
      return;
    }
    dispatch({
      type: "ADD_TASK",
      task: {
        id: uid(),
        agendaId,
        nome: nome.trim(),
        descricao: desc,
        prazo,
        prioridade: prio,
        responsaveis: resp,
        concluida: false,
      },
    });
    toast({ kind: "success", text: "Task criada!" });
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="Nova Task">
      <div className="space-y-4">
        <input
          autoFocus
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome da task"
          className="w-full border-b border-[#F0F0F0] bg-transparent py-2 text-base font-semibold outline-none focus:border-[#2563EB]"
        />
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Descrição (opcional)"
          rows={2}
          className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#2563EB]"
        />
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-600">
            Prazo
          </label>
          <input
            type="date"
            value={prazo}
            onChange={(e) => setPrazo(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#2563EB]"
          />
        </div>
        <div>
          <div className="mb-2 text-xs font-semibold text-gray-600">
            Prioridade
          </div>
          <PriorityChips value={prio} onChange={setPrio} />
        </div>
        <div>
          <div className="mb-2 text-xs font-semibold text-gray-600">
            Responsáveis
          </div>
          <div className="space-y-1.5">
            {membros.map((m) => (
              <label
                key={m.id}
                className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={resp.includes(m.id)}
                  onChange={() => toggleResp(m.id)}
                  className="h-4 w-4 accent-[#2563EB]"
                />
                <Avatar nome={m.nome} size={28} />
                <span className="text-sm">{m.nome}</span>
              </label>
            ))}
          </div>
        </div>
        <button
          onClick={submit}
          className="w-full rounded-xl bg-[#2563EB] py-3 text-sm font-semibold text-white"
        >
          Criar Task
        </button>
      </div>
    </Modal>
  );
};
