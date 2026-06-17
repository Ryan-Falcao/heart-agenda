import { AgendaIcon } from "./icons";
import type { Agenda } from "./types";

export const AgendaCard = ({
  agenda,
  count,
  onClick,
  showRole,
}: {
  agenda: Agenda;
  count: number;
  onClick: () => void;
  showRole?: boolean;
}) => {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 text-left transition active:scale-[0.99]"
    >
      <AgendaIcon name={agenda.icone} color={agenda.cor} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[15px] font-semibold text-[#1A1A1A]">
            {agenda.nome}
          </span>
          {showRole && agenda.papel && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                agenda.papel === "ADM"
                  ? "bg-[#2563EB] text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {agenda.papel}
            </span>
          )}
        </div>
        {agenda.subtitulo && (
          <div className="truncate text-xs text-gray-400">
            {agenda.subtitulo}
          </div>
        )}
      </div>
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E5E5E5] text-xs font-semibold text-[#555]">
        {count}
      </div>
    </button>
  );
};
