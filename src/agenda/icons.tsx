import {
  AlarmClock,
  Briefcase,
  ClipboardList,
  Users,
  Star,
  BookOpen,
  Heart,
  type LucideIcon,
} from "lucide-react";
import type { IconName } from "./types";

export const ICONS: Record<IconName, LucideIcon> = {
  AlarmClock,
  Briefcase,
  ClipboardList,
  Users,
  Star,
  BookOpen,
  Heart,
};

export const AGENDA_COLORS = [
  "#B45309",
  "#7C3AED",
  "#2563EB",
  "#16A34A",
  "#DC2626",
  "#D97706",
];

export const AGENDA_ICON_OPTIONS: IconName[] = [
  "AlarmClock",
  "Briefcase",
  "ClipboardList",
  "Star",
  "BookOpen",
  "Heart",
];

export const AgendaIcon = ({
  name,
  color,
  size = 44,
}: {
  name: IconName;
  color: string;
  size?: number;
}) => {
  const Icon = ICONS[name];
  return (
    <div
      className="flex items-center justify-center rounded-xl shrink-0"
      style={{ background: color, width: size, height: size }}
    >
      <Icon size={size * 0.5} color="#fff" strokeWidth={2.2} />
    </div>
  );
};
