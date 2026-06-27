import { CalendarDays, House, User, Users } from "lucide-react";
import { useNav, type Screen } from "./nav";

const items: { name: Screen["name"]; label: string; icon: typeof House }[] = [
  { name: "home", label: "Home", icon: House },
  { name: "calendar", label: "Agenda", icon: CalendarDays },
  { name: "friends", label: "Amigos", icon: Users },
  { name: "profile", label: "Perfil", icon: User },
];

export const BottomNav = () => {
  const { screen, go } = useNav();
  return (
    <nav className="fixed bottom-0 left-1/2 z-30 flex w-full max-w-[390px] -translate-x-1/2 border-t border-gray-100 bg-white px-1 py-2">
      {items.map((i) => {
        const active = screen.name === i.name;
        const color = active ? "#2563EB" : "#8A8A8A";
        return (
          <button
            key={i.name}
            onClick={() => go({ name: i.name } as Screen)}
            className="flex flex-1 flex-col items-center gap-0.5 py-1"
          >
            <i.icon size={20} color={color} strokeWidth={active ? 2.4 : 2} />
            <span className="text-[10px] font-medium" style={{ color }}>
              {i.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
