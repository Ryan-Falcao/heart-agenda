import { useMemo, useState } from "react";
import {
  Bell,
  Calendar as CalendarIcon,
  ChevronRight,
  Plus,
  Search,
} from "lucide-react";
import { useStore } from "./store";
import { useNav } from "./nav";
import { AgendaCard } from "./AgendaCard";
import { SectionTitle } from "./ui";
import { CreateAgendaModal } from "./CreateAgendaModal";
import { JoinAgendaModal } from "./JoinAgendaModal";
import { NotificationsPanel } from "./NotificationsPanel";

const MONTHS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

export const HomeScreen = () => {
  const { state } = useStore();
  const { go } = useNav();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const dateLabel = useMemo(() => {
    const d = new Date();
    return `Hoje ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  }, []);

  const todayEvents = useMemo(
    () =>
      state.eventos
        .filter((e) => e.data === todayStr)
        .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio)),
    [state.eventos, todayStr],
  );

  const pessoais = state.agendas.filter((a) => !a.compartilhada);
  const compartilhadas = state.agendas.filter((a) => a.compartilhada);

  const hasNotifications = todayEvents.length > 0;

  return (
    <div className="pb-32">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pb-4 pt-6">
        <div>
          <h1 className="text-lg font-bold text-[#1A1A1A]">
            Olá {state.usuario.nome}
          </h1>
          <p className="text-sm text-gray-400">{dateLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => go({ name: "search" })}
            className="flex h-10 w-10 items-center justify-center rounded-full active:bg-gray-100"
          >
            <Search size={22} color="#1A1A1A" />
          </button>
          <button className="relative flex h-10 w-10 items-center justify-center rounded-full active:bg-gray-100">
            <Bell size={22} color="#1A1A1A" />
            {hasNotifications && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
            )}
          </button>
        </div>
      </header>

      {/* Próximos eventos */}
      <section className="mb-6">
        <SectionTitle>Próximos eventos</SectionTitle>
        <div className="flex gap-3 overflow-x-auto px-4 pb-1 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {todayEvents.length === 0 && (
            <div className="text-xs text-gray-400">Nenhum evento hoje</div>
          )}
          {todayEvents.map((e) => {
            const ag = state.agendas.find((a) => a.id === e.agendaId);
            return (
              <div
                key={e.id}
                className="flex h-[90px] w-[100px] shrink-0 flex-col justify-between rounded-xl p-2 text-white"
                style={{ background: ag?.cor || "#2563EB" }}
              >
                <div className="text-[13px] font-bold leading-none">
                  {e.horaInicio}
                </div>
                <div className="line-clamp-2 text-[11px] leading-tight">
                  {e.nome}
                </div>
                <div className="text-[10px] opacity-80">Hoje</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Suas Agendas */}
      <section className="mb-6">
        <SectionTitle>Suas Agendas</SectionTitle>
        <div className="flex flex-col gap-[10px] px-4">
          {pessoais.map((a) => (
            <AgendaCard
              key={a.id}
              agenda={a}
              count={
                state.eventos.filter((e) => e.agendaId === a.id).length
              }
              onClick={() => go({ name: "agenda", id: a.id })}
            />
          ))}
        </div>
        <div className="mt-4 px-4">
          <button
            onClick={() => setShowCreate(true)}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-[#22C55E] text-white shadow-md shadow-green-200 transition active:scale-95"
          >
            <Plus size={28} strokeWidth={2.5} />
          </button>
        </div>
      </section>

      {/* Agendas Compartilhadas */}
      <section className="mb-6">
        <SectionTitle>Agendas Compartilhadas</SectionTitle>
        <div className="flex flex-col gap-[10px] px-4">
          {compartilhadas.length === 0 && (
            <div className="text-xs text-gray-400">
              Nenhuma agenda compartilhada
            </div>
          )}
          {compartilhadas.map((a) => (
            <AgendaCard
              key={a.id}
              agenda={a}
              count={
                state.tasks.filter((t) => t.agendaId === a.id).length
              }
              onClick={() => go({ name: "shared", id: a.id })}
              showRole
            />
          ))}
        </div>
      </section>

      {/* Footer button (above bottom nav) */}
      <div className="fixed bottom-20 left-1/2 z-20 w-full max-w-[390px] -translate-x-1/2 px-4">
        <button
          onClick={() => setShowJoin(true)}
          className="flex w-full items-center justify-between rounded-full bg-[#1E3A8A] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 active:scale-[0.99]"
        >
          <span className="flex items-center gap-2">
            <CalendarIcon size={18} />
            Entrar em outra agenda
          </span>
          <ChevronRight size={18} />
        </button>
      </div>

      <CreateAgendaModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
      />
      <JoinAgendaModal open={showJoin} onClose={() => setShowJoin(false)} />
    </div>
  );
};
