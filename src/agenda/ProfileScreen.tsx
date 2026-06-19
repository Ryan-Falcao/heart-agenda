import { useEffect, useState } from "react";
import {
  Bell,
  BellRing,
  Camera,
  LogOut,
  Save,
  Settings,
  Shield,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useStore } from "./store";
import { Avatar } from "./ui";
import { useNotifications } from "./useNotifications";
import { useAuth } from "./auth/AuthContext";

const ANTECEDENCIAS = [5, 10, 15, 30, 60];

export const ProfileScreen = () => {
  const { state, toast } = useStore();
  const { user, profile, avatarUrl, signOut, updateProfile } = useAuth();
  const {
    supported,
    permission,
    settings,
    solicitarPermissao,
    setAtivadas,
    setSom,
    setAntecedencia,
    testar,
  } = useNotifications();

  const [editing, setEditing] = useState(false);
  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [dataNasc, setDataNasc] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setNome(profile.nome);
      setSobrenome(profile.sobrenome);
      setDataNasc(profile.data_nascimento ?? "");
    }
  }, [profile]);

  const onAvatarChange = (f: File | null) => {
    setAvatarFile(f);
    if (f) {
      const r = new FileReader();
      r.onload = () => setAvatarPreview(r.result as string);
      r.readAsDataURL(f);
    } else setAvatarPreview(null);
  };

  const salvar = async () => {
    if (!nome.trim() || !sobrenome.trim()) {
      toast({ kind: "error", text: "Nome e sobrenome são obrigatórios." });
      return;
    }
    setSaving(true);
    const r = await updateProfile({
      nome,
      sobrenome,
      data_nascimento: dataNasc,
      avatarFile,
    });
    setSaving(false);
    if (r.error) {
      toast({ kind: "error", text: r.error });
      return;
    }
    toast({ kind: "success", text: "Perfil atualizado!" });
    setEditing(false);
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const nomeCompleto =
    profile ? `${profile.nome} ${profile.sobrenome}`.trim() : state.usuario.nome;

  const totalAgendas = state.agendas.length;
  const totalEventos = state.eventos.length;
  const totalTasks = state.tasks.length;

  return (
    <div className="pb-28">
      <header className="px-4 py-6">
        <h1 className="text-lg font-bold text-[#1A1A1A]">Perfil</h1>
      </header>
      <div className="px-4">
        <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#1E3A8A] p-5 text-white">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={nomeCompleto}
              className="h-14 w-14 rounded-full object-cover ring-2 ring-white/30"
            />
          ) : (
            <Avatar nome={nomeCompleto || "U"} size={56} />
          )}
          <div className="min-w-0">
            <div className="truncate text-base font-bold">{nomeCompleto || "Sem nome"}</div>
            <div className="truncate text-xs opacity-80">{user?.email}</div>
            {profile?.data_nascimento && (
              <div className="text-[10px] opacity-70">
                Nascimento:{" "}
                {new Date(profile.data_nascimento).toLocaleDateString("pt-BR")}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <Stat label="Agendas" value={totalAgendas} />
          <Stat label="Eventos" value={totalEventos} />
          <Stat label="Tarefas" value={totalTasks} />
        </div>

        {/* Editar perfil */}
        <div className="mt-6 rounded-2xl border border-gray-100 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1A1A1A]">Meus dados</h3>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-xs font-semibold text-[#2563EB]"
              >
                Editar
              </button>
            )}
          </div>

          {editing ? (
            <div className="space-y-2">
              <div className="flex justify-center">
                <label className="relative flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-gray-100 ring-2 ring-gray-200">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
                  ) : avatarUrl ? (
                    <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Camera size={22} className="text-gray-400" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 cursor-pointer opacity-0"
                    onChange={(e) => onAvatarChange(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Input value={nome} onChange={setNome} placeholder="Nome" />
                <Input value={sobrenome} onChange={setSobrenome} placeholder="Sobrenome" />
              </div>
              <Input
                value={dataNasc}
                onChange={setDataNasc}
                placeholder="Data de nascimento"
                type="date"
              />

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    setEditing(false);
                    setAvatarFile(null);
                    setAvatarPreview(null);
                  }}
                  className="flex-1 rounded-xl border border-gray-200 py-2 text-sm font-semibold text-gray-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={salvar}
                  disabled={saving}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#2563EB] py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  <Save size={14} /> Salvar
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5 text-sm text-[#1A1A1A]">
              <div className="flex justify-between"><span className="text-gray-500">Nome</span><span>{profile?.nome || "—"}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Sobrenome</span><span>{profile?.sobrenome || "—"}</span></div>
              <div className="flex justify-between">
                <span className="text-gray-500">Nascimento</span>
                <span>
                  {profile?.data_nascimento
                    ? new Date(profile.data_nascimento).toLocaleDateString("pt-BR")
                    : "—"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Notificações */}
        <div className="mt-6 rounded-2xl border border-gray-100 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Bell size={16} className="text-[#2563EB]" />
            <h3 className="text-sm font-bold text-[#1A1A1A]">Notificações</h3>
          </div>

          {!supported && (
            <p className="mb-3 rounded-lg bg-yellow-50 px-3 py-2 text-xs text-yellow-700">
              Seu navegador não suporta notificações. Você verá apenas avisos no app.
            </p>
          )}

          {supported && permission !== "granted" && (
            <button
              type="button"
              onClick={solicitarPermissao}
              className="mb-3 w-full rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-[#2563EB]"
            >
              {permission === "denied"
                ? "Permissão negada — ajuste no navegador"
                : "Permitir notificações do navegador"}
            </button>
          )}

          <Row label="Ativar lembretes" value={settings.ativadas} onChange={setAtivadas} />
          <Row
            label="Som de alerta"
            icon={settings.somAtivo ? Volume2 : VolumeX}
            value={settings.somAtivo}
            onChange={setSom}
          />

          <div className="mt-3">
            <div className="mb-1.5 text-xs font-semibold text-gray-600">
              Avisar com antecedência
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ANTECEDENCIAS.map((m) => {
                const active = settings.antecedenciaMin === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setAntecedencia(m)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      active ? "bg-[#2563EB] text-white" : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {m} min
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={testar}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] py-2.5 text-sm font-semibold text-white active:scale-[0.99]"
          >
            <BellRing size={16} /> Testar notificação
          </button>
        </div>

        <div className="mt-6 space-y-1.5">
          <button className="flex w-full items-center gap-3 rounded-xl border border-gray-100 p-3 text-left text-sm font-medium text-[#1A1A1A]">
            <Settings size={18} />
            Configurações
          </button>
          <button className="flex w-full items-center gap-3 rounded-xl border border-gray-100 p-3 text-left text-sm font-medium text-[#1A1A1A]">
            <Shield size={18} />
            Privacidade
          </button>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-xl border border-gray-100 p-3 text-left text-sm font-medium text-red-600"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </div>
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-xl border border-gray-100 p-3 text-center">
    <div className="text-lg font-bold text-[#1A1A1A]">{value}</div>
    <div className="text-[10px] uppercase text-gray-400">{label}</div>
  </div>
);

const Input = ({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
}) => (
  <input
    type={type}
    value={value}
    placeholder={placeholder}
    onChange={(e) => onChange(e.target.value)}
    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#2563EB]"
  />
);

const Row = ({
  label,
  icon: Icon,
  value,
  onChange,
}: {
  label: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  value: boolean;
  onChange: (v: boolean) => void;
}) => (
  <button
    type="button"
    onClick={() => onChange(!value)}
    className="flex w-full items-center justify-between py-2 text-left"
  >
    <span className="flex items-center gap-2 text-sm text-[#1A1A1A]">
      {Icon && <Icon size={16} className="text-gray-500" />}
      {label}
    </span>
    <span
      className={`relative h-5 w-9 rounded-full transition ${
        value ? "bg-[#2563EB]" : "bg-gray-300"
      }`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
          value ? "left-[18px]" : "left-0.5"
        }`}
      />
    </span>
  </button>
);
