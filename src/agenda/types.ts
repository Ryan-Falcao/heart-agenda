export type IconName =
  | "AlarmClock"
  | "Briefcase"
  | "ClipboardList"
  | "Users"
  | "Star"
  | "BookOpen"
  | "Heart";

export type Priority = "Baixa" | "Média" | "Alta";

export interface Agenda {
  id: string;
  nome: string;
  cor: string;
  icone: IconName;
  compartilhada: boolean;
  descricao?: string;
  prioridade?: Priority;
  subtitulo?: string;
  papel?: "ADM" | "Membro"; // para compartilhadas
}

export interface Evento {
  id: string;
  agendaId: string;
  nome: string;
  data: string; // yyyy-mm-dd
  horaInicio: string; // HH:mm
  horaFim: string;
  repeticao: "Não repete" | "Diário" | "Semanal" | "Mensal";
  lembrete: string;
  prioridade: Priority;
  descricao?: string;
}

export interface Membro {
  id: string;
  agendaId: string;
  nome: string;
  email: string;
  papel: "ADM" | "Membro";
  pendente?: boolean;
}

export interface Comentario {
  id: string;
  taskId: string;
  autor: string;
  texto: string;
  hora: string;
}

export interface Task {
  id: string;
  agendaId: string;
  nome: string;
  descricao?: string;
  prazo: string;
  prioridade: Priority;
  responsaveis: string[]; // membro ids
  concluida: boolean;
  encerrada?: boolean;
}

export interface Usuario {
  nome: string;
  email: string;
  avatar?: string;
}
