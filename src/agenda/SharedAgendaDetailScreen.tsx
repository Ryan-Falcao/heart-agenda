import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  Check,
  Copy,
  Loader2,
  LogOut,
  Mail,
  Pencil,
  Plus,
  QrCode,
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
import { useAgendaInvitesFor } from "./hooks/useAgendaInvites";
import { useAgendaTaskCompletions } from "./hooks/useSharedTaskCompletions";
import { Avatar, Modal, Spinner } from "./ui";
import { PushPermissionPrompt } from "./PushPermissionPrompt";

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
}

const EMPTY_FORM: TaskFormState = {
  title: "",
  description: "",
  due_date: "",
  assigned_to: "",
};

type InviteTab = "friends" | "email" | "code";

export const SharedAgendaDetailScreen = ({ id }: { id: string }) => {
  const { back } = useNav();
  const { toast } = useStore();
  const { user } = useAuth();
  const { agendas, removeMember, leaveAgenda, deleteAgenda } =
    useSharedAgendas();
  const { members } = useAgendaMembers(id);
  const { tasks, loading, create, update, remove } = useSharedTasks(id);
  const { accepted: friends } = useFriendships();
  const { invites, createInvite, deleteInvite } = useAgendaInvitesFor(id);
  const {
    isCompletedByMe,
    completedUserIds,
    toggleMyCompletion,
  } = useAgendaTaskCompletions(id);

  const agenda = agendas.find((a) => a.id === id);
  const myMember = members.find((m) => m.user_id === user?.id);
  const myRole = myMember?.role ?? "viewer";
  const isOwner = myRole === "owner";
  const canEdit = myRole === "owner" || myRole === "editor";

  const [showForm, setShowForm] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteTab, setInviteTab] = useState<InviteTab>("friends");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("editor");
  const [genCode, setGenCode] = useState<string | null>(null);
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
      if (form.id) await update(form.id, payload);
      else await create(payload);
      toast({ kind: "success", text: form.id ? "Atualizado" : "Criada" });
      setShowForm(false);
    } catch (e: any) {
      toast({ kind: "error", text: e?.message ?? "Erro" });
    } finally {
      setSaving(false);
    }
  };

  const openInvite = () => {
    setInviteTab("friends");
    setInviteEmail("");
    setGenCode(null);
    setShowInvite(true);
  };

  const inviteFriend = async (
    email: string | null,
    role: "editor" | "viewer",
  ) => {
    try {
      const inv = await createInvite(email, role);
      toast({ kind: "success", text: "Convite enviado" });
      return inv;
    } catch (e: any) {
      toast({ kind: "error", text: e?.message ?? "Erro" });
      throw e;
    }
  };

  const handleGenerateCode = async () => {
    try {
      const inv = await createInvite(null, inviteRole);
      setGenCode(inv.code);
    } catch {
      /* toast handled above */
    }
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast({ kind: "success", text: "Código copiado" });
    } catch {
      toast({ kind: "error", text: "Não foi possível copiar" });
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

  const pendingInvites = invites.filter((i) => i.status === "pending");

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
          {isOwner && (
            <button
              onClick={openInvite}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white"
              aria-label="Convidar pessoas"
            >
              <UserPlus size={16} />
            </button>
          )}
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
        ) : tasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 py-8 text-center text-xs text-gray-400">
            Nenhuma tarefa ainda
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {tasks.map((t) => {
              const done = isCompletedByMe(t.id);
              const doneIds = completedUserIds(t.id);
              const doneMembers = members.filter((m) =>
                doneIds.includes(m.user_id),
              );
              const pendingCount = members.length - doneMembers.length;
              const due = t.due_date ? new Date(t.due_date) : null;
              const assignee = members.find(
                (m) => m.user_id === t.assigned_to,
              );
              return (
                <li
                  key={t.id}
                  className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm"
                  style={{
                    borderLeft: `4px solid ${done ? "#16A34A" : agenda.color}`,
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div
                        className={`text-sm font-semibold ${done ? "text-gray-400 line-through" : "text-[#1A1A1A]"}`}
                      >
                        {t.title}
                      </div>
                      {t.description && (
                        <div className="mt-0.5 line-clamp-2 text-[11px] text-gray-500">
                          {t.description}
                        </div>
                      )}
                    </div>
                    {canEdit && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEdit(t)}
                          className="p-1 text-gray-400"
                          aria-label="Editar"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => remove(t.id)}
                          className="p-1 text-red-400"
                          aria-label="Excluir"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>

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
                        <Users size={10} /> Responsável:{" "}
                        {assignee.profile?.nome ?? "Membro"}
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-medium text-gray-600">
                        {doneMembers.length}/{members.length} entregou
                      </span>
                      <div className="ml-1 flex -space-x-1.5">
                        {doneMembers.slice(0, 4).map((m) => {
                          const nm =
                            `${m.profile?.nome ?? ""}`.trim() || "Membro";
                          return m.profile?.avatar_url ? (
                            <img
                              key={m.user_id}
                              src={m.profile.avatar_url}
                              alt={nm}
                              title={nm}
                              className="h-5 w-5 rounded-full border border-white object-cover"
                            />
                          ) : (
                            <div
                              key={m.user_id}
                              title={nm}
                              className="h-5 w-5 rounded-full border border-white"
                            >
                              <Avatar nome={nm} size={20} />
                            </div>
                          );
                        })}
                        {doneMembers.length > 4 && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full border border-white bg-gray-200 text-[9px] font-semibold text-gray-600">
                            +{doneMembers.length - 4}
                          </span>
                        )}
                      </div>
                      {pendingCount > 0 && doneMembers.length > 0 && (
                        <span className="ml-2 text-[10px] text-gray-400">
                          • {pendingCount} pendente
                          {pendingCount > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => toggleMyCompletion(t.id)}
                      className={`flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                        done
                          ? "bg-green-100 text-green-700"
                          : "bg-[#2563EB] text-white"
                      }`}
                    >
                      {done ? (
                        <>
                          <Check size={12} /> Entregue
                        </>
                      ) : (
                        "Marcar entregue"
                      )}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
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

      {/* Task form */}
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
              Responsável (opcional)
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

      {/* Members */}
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
              openInvite();
            }}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#2563EB] py-2.5 text-sm font-semibold text-white"
          >
            <UserPlus size={16} /> Convidar pessoas
          </button>
        )}
      </Modal>

      {/* Invite modal (3 tabs) */}
      <Modal
        open={showInvite}
        onClose={() => setShowInvite(false)}
        title="Convidar pessoas"
      >
        <div className="mb-3 flex rounded-full bg-gray-100 p-1 text-xs font-semibold">
          {(
            [
              { k: "friends", label: "Amigos" },
              { k: "email", label: "E-mail" },
              { k: "code", label: "Código" },
            ] as const
          ).map((t) => (
            <button
              key={t.k}
              onClick={() => setInviteTab(t.k)}
              className={`flex-1 rounded-full py-1.5 transition ${
                inviteTab === t.k
                  ? "bg-white text-[#1A1A1A] shadow-sm"
                  : "text-gray-500"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {inviteTab === "friends" && (
          <>
            {friendsAvailable.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-400">
                {friends.length === 0
                  ? "Você ainda não tem amigos adicionados."
                  : "Todos os seus amigos já estão na agenda."}
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {friendsAvailable.map((f) => {
                  const nm =
                    `${f.other.nome} ${f.other.sobrenome}`.trim() || "Amigo";
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
                        <div className="truncate text-sm font-semibold">
                          {nm}
                        </div>
                        {f.other.email && (
                          <div className="truncate text-[10px] text-gray-400">
                            {f.other.email}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => inviteFriend(f.other.email, "viewer")}
                        className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold text-gray-700"
                      >
                        Viewer
                      </button>
                      <button
                        onClick={() => inviteFriend(f.other.email, "editor")}
                        className="rounded-full bg-[#2563EB] px-3 py-1 text-[11px] font-semibold text-white"
                      >
                        Editor
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}

        {inviteTab === "email" && (
          <div className="space-y-3">
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="email@exemplo.com"
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none"
              />
            </div>
            <div className="flex gap-2">
              {(["viewer", "editor"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setInviteRole(r)}
                  className={`flex-1 rounded-full py-2 text-xs font-semibold ${
                    inviteRole === r
                      ? "bg-[#2563EB] text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {r === "viewer" ? "Visualizador" : "Editor"}
                </button>
              ))}
            </div>
            <button
              onClick={async () => {
                if (!inviteEmail.trim()) return;
                try {
                  await inviteFriend(inviteEmail, inviteRole);
                  setInviteEmail("");
                } catch {}
              }}
              disabled={!inviteEmail.trim()}
              className="w-full rounded-full bg-[#22C55E] py-2.5 text-sm font-semibold text-white disabled:opacity-40"
            >
              Enviar convite
            </button>
            {pendingInvites.filter((i) => i.invited_email).length > 0 && (
              <div className="pt-2">
                <div className="mb-1 text-[10px] font-semibold uppercase text-gray-400">
                  Pendentes
                </div>
                <ul className="flex flex-col gap-1">
                  {pendingInvites
                    .filter((i) => i.invited_email)
                    .map((i) => (
                      <li
                        key={i.id}
                        className="flex items-center gap-2 rounded-lg bg-gray-50 px-2 py-1.5 text-[11px]"
                      >
                        <Mail size={12} className="text-gray-400" />
                        <span className="flex-1 truncate">
                          {i.invited_email}
                        </span>
                        <button
                          onClick={() => deleteInvite(i.id)}
                          className="text-red-400"
                        >
                          <Trash2 size={12} />
                        </button>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {inviteTab === "code" && (
          <div className="space-y-3">
            <p className="text-center text-xs text-gray-500">
              Gere um código único e compartilhe manualmente. Quem receber
              digita esse código na tela "Entrar em outra agenda".
            </p>
            <div className="flex gap-2">
              {(["viewer", "editor"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setInviteRole(r)}
                  className={`flex-1 rounded-full py-2 text-xs font-semibold ${
                    inviteRole === r
                      ? "bg-[#2563EB] text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {r === "viewer" ? "Visualizador" : "Editor"}
                </button>
              ))}
            </div>
            {genCode ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 rounded-xl border-2 border-dashed border-[#2563EB] bg-blue-50 p-4">
                  <QrCode size={22} className="text-[#2563EB]" />
                  <span className="flex-1 text-center font-mono text-xl font-bold tracking-widest text-[#1A1A1A]">
                    {genCode}
                  </span>
                  <button
                    onClick={() => copyCode(genCode)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#2563EB]"
                  >
                    <Copy size={16} />
                  </button>
                </div>
                <p className="text-center text-[10px] text-gray-400">
                  Válido por 7 dias
                </p>
                <button
                  onClick={() => setGenCode(null)}
                  className="w-full rounded-full border border-gray-200 py-2 text-xs font-semibold text-gray-600"
                >
                  Gerar outro código
                </button>
              </div>
            ) : (
              <button
                onClick={handleGenerateCode}
                className="w-full rounded-full bg-[#2563EB] py-2.5 text-sm font-semibold text-white"
              >
                Gerar código
              </button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
