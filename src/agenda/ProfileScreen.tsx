import { Bell, LogOut, Settings, Shield } from "lucide-react";
import { useStore } from "./store";
import { Avatar } from "./ui";

export const ProfileScreen = () => {
  const { state } = useStore();
  const itens = [
    { icon: Settings, label: "Configurações" },
    { icon: Bell, label: "Notificações" },
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
