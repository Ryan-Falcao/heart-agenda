// Lê ?friend=CODE da URL e envia solicitação de amizade automaticamente.
import { useEffect } from "react";
import { useStore } from "../store";
import { useFriendships } from "./useFriendships";

export function useFriendInviteHandler() {
  const { acceptByCode } = useFriendships();
  const { toast } = useStore();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("friend");
    if (!code) return;
    (async () => {
      try {
        await acceptByCode(code);
        toast({ kind: "success", text: "Solicitação de amizade enviada!" });
      } catch (e: any) {
        toast({ kind: "warning", text: e?.message ?? "Convite inválido" });
      } finally {
        params.delete("friend");
        const qs = params.toString();
        const url = window.location.pathname + (qs ? `?${qs}` : "");
        window.history.replaceState({}, "", url);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
