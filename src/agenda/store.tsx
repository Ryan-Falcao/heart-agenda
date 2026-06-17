import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import type {
  Agenda,
  Comentario,
  Evento,
  Membro,
  Task,
  Usuario,
} from "./types";

const STORAGE_KEY = "agenda-digital-v1";


interface State {
  usuario: Usuario;
  agendas: Agenda[];
  eventos: Evento[];
  tasks: Task[];
  membros: Membro[];
  comentarios: Comentario[];
}

const initialState = (): State => {
  // Só acessa localStorage no cliente
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as State;
    } catch {
      // ignore
    }
  }

  // Estado inicial sem datas dinâmicas (evita hydration mismatch)
  const sharedId = "ag-shared-1";
  return {
    usuario: { nome: "Ryan", email: "ryan@email.com" },
    agendas: [
      {
        id: "ag-rotina",
        nome: "Rotina",
        cor: "#B45309",
        icone: "AlarmClock",
        compartilhada: false,
        subtitulo: "Hábitos diários",
      },
      {
        id: "ag-trabalho",
        nome: "Trabalho",
        cor: "#7C3AED",
        icone: "Briefcase",
        compartilhada: false,
        subtitulo: "Compromissos profissionais",
      },
      {
        id: "ag-tarefas",
        nome: "Tarefas",
        cor: "#2563EB",
        icone: "ClipboardList",
        compartilhada: false,
        subtitulo: "Lista pessoal",
      },
      {
        id: sharedId,
        nome: "Tarefas do trabalho ADM",
        cor: "#3B82F6",
        icone: "Users",
        compartilhada: true,
        descricao: "Coordenação de tarefas da equipe",
        papel: "ADM",
        subtitulo: "Compartilhada • 2 membros",
      },
    ],
    // Sem eventos de exemplo — evita datas dinâmicas que quebram SSR
    eventos: [],
    tasks: [],
    membros: [
      {
        id: "m-ryan",
        agendaId: sharedId,
        nome: "Ryan",
        email: "ryan@email.com",
        papel: "ADM",
      },
      {
        id: "m-nicolas",
        agendaId: sharedId,
        nome: "Nicolas",
        email: "nicolas@email.com",
        papel: "Membro",
      },
    ],
    comentarios: [],
  };
};

type Action =
  | { type: "ADD_AGENDA"; agenda: Agenda }
  | { type: "UPDATE_AGENDA"; agenda: Agenda }
  | { type: "DELETE_AGENDA"; id: string }
  | { type: "ADD_EVENTO"; evento: Evento }
  | { type: "UPDATE_EVENTO"; evento: Evento }
  | { type: "DELETE_EVENTO"; id: string }
  | { type: "ADD_TASK"; task: Task }
  | { type: "UPDATE_TASK"; task: Task }
  | { type: "TOGGLE_TASK"; id: string }
  | { type: "ADD_MEMBRO"; membro: Membro }
  | { type: "UPDATE_MEMBRO"; membro: Membro }
  | { type: "DELETE_MEMBRO"; id: string }
  | { type: "ADD_COMENTARIO"; comentario: Comentario }
  | { type: "JOIN_AGENDA"; agenda: Agenda; membro: Membro };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_AGENDA":
      return { ...state, agendas: [...state.agendas, action.agenda] };
    case "UPDATE_AGENDA":
      return {
        ...state,
        agendas: state.agendas.map((a) =>
          a.id === action.agenda.id ? action.agenda : a,
        ),
      };
    case "DELETE_AGENDA":
      return {
        ...state,
        agendas: state.agendas.filter((a) => a.id !== action.id),
        eventos: state.eventos.filter((e) => e.agendaId !== action.id),
        tasks: state.tasks.filter((t) => t.agendaId !== action.id),
        membros: state.membros.filter((m) => m.agendaId !== action.id),
      };
    case "ADD_EVENTO":
      return { ...state, eventos: [...state.eventos, action.evento] };
    case "UPDATE_EVENTO":
      return {
        ...state,
        eventos: state.eventos.map((e) =>
          e.id === action.evento.id ? action.evento : e,
        ),
      };
    case "DELETE_EVENTO":
      return {
        ...state,
        eventos: state.eventos.filter((e) => e.id !== action.id),
      };
    case "ADD_TASK":
      return { ...state, tasks: [...state.tasks, action.task] };
    case "UPDATE_TASK":
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.task.id ? action.task : t,
        ),
      };
    case "TOGGLE_TASK":
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.id ? { ...t, concluida: !t.concluida } : t,
        ),
      };
    case "ADD_MEMBRO":
      return { ...state, membros: [...state.membros, action.membro] };
    case "UPDATE_MEMBRO":
      return {
        ...state,
        membros: state.membros.map((m) =>
          m.id === action.membro.id ? action.membro : m,
        ),
      };
    case "DELETE_MEMBRO":
      return {
        ...state,
        membros: state.membros.filter((m) => m.id !== action.id),
      };
    case "ADD_COMENTARIO":
      return {
        ...state,
        comentarios: [...state.comentarios, action.comentario],
      };
    case "JOIN_AGENDA":
      return {
        ...state,
        agendas: [...state.agendas, action.agenda],
        membros: [...state.membros, action.membro],
      };
    default:
      return state;
  }
};

interface StoreCtx {
  state: State;
  dispatch: React.Dispatch<Action>;
  toast: (t: ToastMsg) => void;
}

interface ToastMsg {
  kind: "success" | "warning" | "error";
  text: string;
}

const Ctx = createContext<StoreCtx | null>(null);
const ToastCtx = createContext<ToastMsg | null>(null);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const [toastMsg, setToastMsg] = useState<ToastMsg | null>(null);

const [hydrated, setHydrated] = useState(false);

useEffect(() => {
  setHydrated(true);
}, []);

useEffect(() => {
  if (!hydrated) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}, [state, hydrated]);

  const toast = (t: ToastMsg) => {
    setToastMsg(t);
    window.setTimeout(() => setToastMsg(null), 2200);
  };

  return (
    <Ctx.Provider value={{ state, dispatch, toast }}>
      <ToastCtx.Provider value={toastMsg}>{children}</ToastCtx.Provider>
    </Ctx.Provider>
  );
};

export const useStore = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("StoreProvider missing");
  return c;
};

export const useToast = () => useContext(ToastCtx);

export const uid = () => Math.random().toString(36).slice(2, 10);
