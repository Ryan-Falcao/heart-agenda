import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useStore } from "./store";

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];
const WEEK = ["D", "S", "T", "Q", "Q", "S", "S"];

const fmt = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

export const CalendarScreen = () => {
  const { state } = useStore();
  const today = new Date();
  const [view, setView] = useState({
    y: today.getFullYear(),
    m: today.getMonth(),
  });
  const [selected, setSelected] = useState(
    fmt(today.getFullYear(), today.getMonth(), today.getDate()),
  );

  const cells = useMemo(() => {
    const first = new Date(view.y, view.m, 1);
    const startDay = first.getDay();
    const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
    const arr: (number | null)[] = [];
    for (let i = 0; i < startDay; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    return arr;
  }, [view]);

  const eventsOfDay = state.eventos
    .filter((e) => e.data === selected)
    .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));

  const prev = () =>
    setView((v) =>
      v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 },
    );
  const next = () =>
    setView((v) =>
      v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 },
    );

  return (
    <div className="pb-28">
      <header className="flex items-center justify-between px-4 py-5">
        <button
          onClick={prev}
          className="flex h-9 w-9 items-center justify-center rounded-full active:bg-gray-100"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-base font-bold text-[#1A1A1A]">
          {MONTHS[view.m]} {view.y}
        </h1>
        <button
          onClick={next}
          className="flex h-9 w-9 items-center justify-center rounded-full active:bg-gray-100"
        >
          <ChevronRight size={20} />
        </button>
      </header>

      <div className="px-4">
        <div className="mb-2 grid grid-cols-7 text-center text-[10px] font-semibold text-gray-400">
          {WEEK.map((w, i) => (
            <div key={i}>{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (d === null) return <div key={i} />;
            const s = fmt(view.y, view.m, d);
            const isSel = s === selected;
            const has = state.eventos.some((e) => e.data === s);
            return (
              <button
                key={i}
                onClick={() => setSelected(s)}
                className="flex flex-col items-center gap-0.5 py-2"
              >
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition"
                  style={{
                    background: isSel ? "#2563EB" : "transparent",
                    color: isSel ? "#fff" : "#1A1A1A",
                  }}
                >
                  {d}
                </span>
                <span
                  className="h-1 w-1 rounded-full"
                  style={{ background: has ? "#2563EB" : "transparent" }}
                />
              </button>
            );
          })}
        </div>
      </div>

      <section className="mt-6 px-4">
        <h3 className="mb-2 text-sm font-semibold text-gray-800">
          Eventos de {selected.split("-").reverse().slice(0, 2).join("/")}
        </h3>
        <hr className="mb-3 border-[#F0F0F0]" />
        {eventsOfDay.length === 0 && (
          <p className="py-6 text-center text-xs text-gray-400">
            Nenhum evento neste dia
          </p>
        )}
        <div className="space-y-2">
          {eventsOfDay.map((e) => {
            const ag = state.agendas.find((a) => a.id === e.agendaId);
            return (
              <div
                key={e.id}
                className="flex items-center gap-3 rounded-xl border border-gray-100 p-3"
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
                    {e.horaInicio} - {e.horaFim} • {ag?.nome}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
