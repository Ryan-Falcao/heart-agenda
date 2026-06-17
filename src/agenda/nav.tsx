import { createContext, useContext, useState, type ReactNode } from "react";

export type Screen =
  | { name: "home" }
  | { name: "calendar" }
  | { name: "search" }
  | { name: "profile" }
  | { name: "agenda"; id: string }
  | { name: "shared"; id: string };

interface NavCtx {
  screen: Screen;
  go: (s: Screen) => void;
  back: () => void;
}

const Ctx = createContext<NavCtx | null>(null);

export const NavProvider = ({ children }: { children: ReactNode }) => {
  const [stack, setStack] = useState<Screen[]>([{ name: "home" }]);
  const screen = stack[stack.length - 1];

  const go = (s: Screen) =>
    setStack((st) =>
      // for tabs, reset to single
      ["home", "calendar", "search", "profile"].includes(s.name)
        ? [s]
        : [...st, s],
    );
  const back = () =>
    setStack((st) => (st.length > 1 ? st.slice(0, -1) : st));

  return <Ctx.Provider value={{ screen, go, back }}>{children}</Ctx.Provider>;
};

export const useNav = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("NavProvider missing");
  return c;
};
