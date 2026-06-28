import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Loader2,
  LogOut,
  Pencil,
  Plus,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { useNav } from "./nav";
import { useStore } from "./store";
import { useAuth } from "./auth/AuthContext";
import {
  useAgendaMembers,
  useSharedAgendas,
} from "./hooks/useSharedAgendas";
import {
  useSharedTasks,
  type SharedTaskRow,
} from "./hooks/useSharedTasks";
import { useFriendships } from "./hooks/useFriendships";
import { Avatar, Modal, Spinner } from "./ui";
import { PushPermissionPrompt } from "./PushPermissionPrompt";

const STATUS_LABEL: Record<SharedTaskRow["status"], string> = {
  pending: "Pendente",
  in_progress: "Em andamento",
  done: "Concluída",
};
const STATUS_COLOR: Record<SharedTaskRow["status"], string> = {
  pending: "#9CA3AF",
  in_progress: "#D97706",
  done: "#16A34A",
};

const fmtDateInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

interface TaskFormState {
  id?: string;
  title: string;
  description: string;
  due_date: string;
  assigned_to: string;
  status: SharedTaskRow["status"];
}

const EMPTY_FORM: TaskFormState = {
  title: "",
  description: "",
  due_date: "",
  assigned_to: "",
  status: "pending",
};

export const SharedAgendaDetailScreen = ({ id }: { id: string }) => {
  const { back } = useNav();
  const { toast } = useStore();
  const { user } = useAuth();
  const { agendas, inviteMember, removeMember, leaveAgenda, deleteAgenda } =
    useSharedAgendas();
  const { members } = useAgendaMembers(id);
  const { tasks, loading, create, update, remove } = useSharedTasks(id);
  const { accepted: friends } = useFriendships();

  const agenda = agendas.find((a) => a.id === id);
  const myMember = members.find((m) => m.user_id === user?.id);
  const myRole = myMember?.role ?? "viewer";
  const isOwner = myRole === "owner";
  const canEdit = myRole === "owner" || myRole === "editor";

  const [showForm, setShowForm] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [form, setForm] = useState<TaskFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const friendsAvailable = useMemo(() => {
    const memberIds = new Set(members.map((m) => m.user_id));
    return friends.filter((f) => !memberIds.has(f.other.id));
  }, [friends, members]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setShowForm(true);
  };
  const openEdit = (t: SharedTaskRow) => {
    setForm({
      id: t.id,
      title: t.title,
      description: t.description ?? "",
      due_date: fmtDateInput(t.due_date),
      assigned_to: t.assigned_to ?? "",
      status: t.status,
    });
    setShowForm(true);
  };

  const submit = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
        assigned_to: form.assigned_to || null,
      };
      if (form.id) {
        await update(form.id, { ...payload, status: form.status });
      } else {
        await create(payload);
      }
      toast({ kind: "success", text: form.id ? "Atualizado" : "Criada" });
      setShowForm(false);
    } catch (e: any) {
      toast({ kind: "error", text: e?.message ?? "Erro" });
    } finally {
      setSaving(false);
    }
  };

  const toggleDone = async (t: SharedTaskRow) => {
    if (!canEdit) return;
    await update(t.id, { status: t.status === "done" ? "pending" : "done" });
  };

  const handleInvite = async (
    userId: string,
    role: "editor" | "viewer",
  ) => {
    try {
      await inviteMember(id, userId, role);
      toast({ kind: "success", text: "Membro adicionado" });
    } catch (e: any) {
      toast({ kind: "error", text: e?.message ?? "Erro" });
    }
  };

  const handleLeave = async () => {
    if (!confirm("Sair desta agenda?")) return;
    await leaveAgenda(id);
    back();
  };
  const handleDelete = async () => {
    if (!confirm("Excluir agenda e todas as tarefas?")) return;
    await deleteAgenda(id);
    back();
  };

  if (!agenda) {
    return (
      <div className="px-4 py-10 text-center text-sm text-gray-400">
        <button onClick={back} className="mb-4 flex items-center gap-1">
          <ArrowLeft size={18} /> Voltar
        </button>
        Carregando agenda...
      </div>
    );
  }

  return (
    <div className="pb-28">
      <PushPermissionPrompt />
      <header
        className="px-4 pb-5 pt-5 text-white"
        style={{ background: agenda.color }}
      >
        <div className="flex items-center gap-3">
          <button onClick={back} className="-ml-2 p-2">
            <ArrowLeft size={22} color="#fff" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold">{agenda.name}</h1>
            <div className="text-[11px] opacity-80">
              {myRole === "owner"
                ? "Você é o dono"
                : myRole === "editor"
                  ? "Editor"
                  : "Visualizador"}
            </div>
          </div>
          <button
            onClick={() => setShowMembers(true)}
            className="flex h-9 items-center gap-1 rounded-full bg-white/20 px-3 text-xs font-semibold"
          >
            <Users size={14} /> {members.length}
          </button>
        </div>
      </header>

      <section className="px-4 pt-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#1A1A1A]">Tarefas</h2>
          {canEdit && (
            <button
              onClick={openCreate}
              className="flex h-8 items-center gap-1 rounded-full bg-[#22C55E] px-3 text-xs font-semibold text-white"
            >
              <Plus size={14} /> Nova
            </button>
          )}
        </div>

        {loading ? (
          <Spinner />
        ) : (
          <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2">
            {(["pending", "in_progress", "done"] as const).map((col) => {
              const colTasks = tasks.filter((t) => t.status === col);
              const color = STATUS_COLOR[col];
              return (
                <div
                  key={col}
                  className="flex w-[78%] flex-shrink-0 snap-start flex-col rounded-2xl bg-[#F3F4F6] p-2"
                >
                  <div className="mb-2 flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: color }}
                      />
                      <span className="text-xs font-semibold text-[#1A1A1A]">
                        {STATUS_LABEL[col]}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {colTasks.length}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {colTasks.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-gray-300 py-6 text-center text-[11px] text-gray-400">
                        Vazio
                      </div>
                    ) : (
                      colTasks.map((t) => {
                        const assignee = members.find(
                          (m) => m.user_id === t.assigned_to,
                        );
                        const name = assignee
                          ? `${assignee.profile?.nome ?? ""} ${assignee.profile?.sobrenome ?? ""}`.trim() ||
                            "Membro"
                          : null;
                        const due = t.due_date ? new Date(t.due_date) : null;
                        const prevStatus =
                          col === "in_progress"
                            ? "pending"
                            : col === "done"
                              ? "in_progress"
                              : null;
                        const nextStatus =
                          col === "pending"
                            ? "in_progress"
                            : col === "in_progress"
                              ? "done"
                              : null;
                        return (
                          <div
                            key={t.id}
                            className="rounded-xl border border-gray-100 bg-white p-2.5 shadow-sm"
                            style={{ borderLeft: `3px solid ${color}` }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div
                                className={`min-w-0 flex-1 text-[13px] font-semibold ${t.status === "done" ? "text-gray-400 line-through" : "text-[#1A1A1A]"}`}
                              >
                                {t.title}
                              </div>
                              {canEdit && (
                                <button
                                  onClick={() => openEdit(t)}
                                  className="p-0.5 text-gray-400"
                                  aria-label="Editar"
                                >
                                  <Pencil size={13} />
                                </button>
                              )}
                            </div>
                            {t.description && (
                              <div className="mt-1 line-clamp-2 text-[11px] text-gray-500">
                                {t.description}
                              </div>
                            )}
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-gray-500">
                              {due && (
                                <span className="flex items-center gap-1">
                                  <Calendar size={10} />
                                  {due.toLocaleString("pt-BR", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              )}
                              {assignee && (
                                <span className="flex items-center gap-1">
                                  {assignee.profile?.avatar_url ? (
                                    <img
                                      src={assignee.profile.avatar_url}
                                      className="h-4 w-4 rounded-full object-cover"
                                      alt=""
                                    />
                                  ) : (
                                    <Avatar nome={name ?? "?"} size={16} />
                                  )}
                                  <span className="max-w-[80px] truncate">
                                    {name}
                                  </span>
                                </span>
                              )}
                            </div>
                            {canEdit && (
                              <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2">
                                <button
                                  onClick={() =>
                                    prevStatus && update(t.id, { status: prevStatus })
                                  }
                                  disabled={!prevStatus}
                                  className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-600 disabled:opacity-30"
                                  aria-label="Mover para esquerda"
                                >
                                  <ChevronLeft size={14} />
                                </button>
                                <button
                                  onClick={() => remove(t.id)}
                                  className="p-1 text-red-400"
                                  aria-label="Excluir"
                                >
                                  <Trash2 size={13} />
                                </button>
                                <button
                                  onClick={() =>
                                    nextStatus && update(t.id, { status: nextStatus })
                                  }
                                  disabled={!nextStatus}
                                  className="flex h-6 w-6 items-center justify-center rounded-full text-white disabled:opacity-30"
                                  style={{
                                    background: nextStatus
                                      ? STATUS_COLOR[nextStatus]
                                      : "#9CA3AF",
                                  }}
                                  aria-label="Mover para direita"
                                >
                                  <ChevronRight size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>


      <section className="mt-6 px-4">
        {isOwner ? (
          <button
            onClick={handleDelete}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 py-2.5 text-sm font-semibold text-red-600"
          >
            <Trash2 size={16} /> Excluir agenda
          </button>
        ) : (
          <button
            onClick={handleLeave}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600"
          >
            <LogOut size={16} /> Sair da agenda
          </button>
        )}
      </section>

      {/* Task form modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={form.id ? "Editar tarefa" : "Nova tarefa"}
      >
        <div className="space-y-3">
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Título"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Descrição (opcional)"
            rows={3}
            className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
          />
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Prazo
            </label>
            <input
              type="datetime-local"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Responsável
            </label>
            <select
              value={form.assigned_to}
              onChange={(e) =>
                setForm({ ...form, assigned_to: e.target.value })
              }
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
            >
              <option value="">Ninguém</option>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {(m.profile?.nome ?? "") + " " + (m.profile?.sobrenome ?? "")}
                </option>
              ))}
            </select>
          </div>
          {form.id && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Status
              </label>
              <div className="flex gap-2">
                {(["pending", "in_progress", "done"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setForm({ ...form, status: s })}
                    className="flex-1 rounded-full px-2 py-1.5 text-xs font-semibold"
                    style={{
                      background:
                        form.status === s ? STATUS_COLOR[s] : `${STATUS_COLOR[s]}22`,
                      color: form.status === s ? "#fff" : STATUS_COLOR[s],
                    }}
                  >
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>
          )}
          <button
            onClick={submit}
            disabled={saving || !form.title.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#2563EB] py-3 text-sm font-semibold text-white disabled:opacity-40"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            Salvar
          </button>
        </div>
      </Modal>

      {/* Members modal */}
      <Modal
        open={showMembers}
        onClose={() => setShowMembers(false)}
        title="Membros"
      >
        <ul className="flex flex-col gap-2">
          {members.map((m) => {
            const nm =
              `${m.profile?.nome ?? ""} ${m.profile?.sobrenome ?? ""}`.trim() ||
              "Membro";
            return (
              <li
                key={m.user_id}
                className="flex items-center gap-3 rounded-xl border border-gray-100 p-2"
              >
                {m.profile?.avatar_url ? (
                  <img
                    src={m.profile.avatar_url}
                    alt={nm}
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <Avatar nome={nm} size={36} />
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{nm}</div>
                  <div className="text-[10px] text-gray-500">{m.role}</div>
                </div>
                {isOwner && m.user_id !== user?.id && (
                  <button
                    onClick={() => removeMember(id, m.user_id)}
                    className="p-1 text-red-500"
                    aria-label="Remover"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        {isOwner && (
          <button
            onClick={() => {
              setShowMembers(false);
              setShowInvite(true);
            }}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#2563EB] py-2.5 text-sm font-semibold text-white"
          >
            <UserPlus size={16} /> Convidar amigos
          </button>
        )}
      </Modal>

      {/* Invite friends modal */}
      <Modal
        open={showInvite}
        onClose={() => setShowInvite(false)}
        title="Convidar amigos"
      >
        {friendsAvailable.length === 0 ? (
          <div className="py-6 text-center text-sm text-gray-400">
            Todos os seus amigos já estão na agenda.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {friendsAvailable.map((f) => {
              const nm = `${f.other.nome} ${f.other.sobrenome}`.trim() || "Amigo";
              return (
                <li
                  key={f.id}
                  className="flex items-center gap-3 rounded-xl border border-gray-100 p-2"
                >
                  {f.other.avatar_url ? (
                    <img
                      src={f.other.avatar_url}
                      alt={nm}
                      className="h-9 w-9 rounded-full object-cover"
                    />
                  ) : (
                    <Avatar nome={nm} size={36} />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{nm}</div>
                  </div>
                  <button
                    onClick={() => handleInvite(f.other.id, "viewer")}
                    className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold text-gray-700"
                  >
                    Viewer
                  </button>
                  <button
                    onClick={() => handleInvite(f.other.id, "editor")}
                    className="rounded-full bg-[#2563EB] px-3 py-1 text-[11px] font-semibold text-white"
                  >
                    Editor
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Modal>
    </div>
  );
};
