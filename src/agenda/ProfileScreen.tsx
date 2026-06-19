import { Bell, BellRing, LogOut, Settings, Shield, Volume2, VolumeX } from "lucide-react";
import { useStore } from "./store";
import { Avatar } from "./ui";
import { useNotifications } from "./useNotifications";

const ANTECEDENCIAS = [5, 10, 15, 30, 60];

export const ProfileScreen = () => {
  const { state } = useStore();
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

  const itens = [
    { icon: Settings, label: "Configurações" },
    { icon: Shield, label: "Privacidade" },
    { icon: LogOut, label: "Sair", danger: true },
  ];
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
          <Avatar nome={state.usuario.nome} size={56} />
          <div>
            <div className="text-base font-bold">{state.usuario.nome}</div>
            <div className="text-xs opacity-80">{state.usuario.email}</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <Stat label="Agendas" value={totalAgendas} />
          <Stat label="Eventos" value={totalEventos} />
          <Stat label="Tarefas" value={totalTasks} />
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

          <Row
            label="Ativar lembretes"
            value={settings.ativadas}
            onChange={setAtivadas}
          />
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
                      active
                        ? "bg-[#2563EB] text-white"
                        : "bg-gray-100 text-gray-700"
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
          {itens.map((i) => (
            <button
              key={i.label}
              className={`flex w-full items-center gap-3 rounded-xl border border-gray-100 p-3 text-left text-sm font-medium ${
                i.danger ? "text-red-600" : "text-[#1A1A1A]"
              }`}
            >
              <i.icon size={18} />
              {i.label}
            </button>
          ))}
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
