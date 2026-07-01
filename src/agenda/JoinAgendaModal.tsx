import { useState } from "react";
import { Modal } from "./ui";
import { useStore } from "./store";
import { useAuth } from "./auth/AuthContext";
import { joinAgendaByCode } from "./hooks/useAgendaInvites";
import { useNav } from "./nav";

export const JoinAgendaModal = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const { toast } = useStore();
  const { user } = useAuth();
  const { go } = useNav();
  const [val, setVal] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!user) {
      toast({ kind: "error", text: "Faça login para entrar em uma agenda" });
      return;
    }
    if (!val.trim()) {
      toast({ kind: "error", text: "Informe o código" });
      return;
    }
    setLoading(true);
    try {
      const invite = await joinAgendaByCode(val, user.id);
      toast({ kind: "success", text: "Você entrou na agenda!" });
      setVal("");
      onClose();
      go({ name: "sharedDetail", id: invite.agenda_id });
    } catch (e: any) {
      toast({ kind: "error", text: e?.message ?? "Erro ao entrar" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Entrar em outra agenda">
      <div className="space-y-4">
        <p className="text-center text-xs text-gray-500">
          Digite o código de convite fornecido pelo dono da agenda
        </p>
        <input
          autoFocus
          value={val}
          onChange={(e) => setVal(e.target.value.toUpperCase())}
          placeholder="Ex: A1B2C3D4"
          maxLength={16}
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-center text-base font-mono tracking-widest outline-none focus:border-[#2563EB]"
        />
        <button
          type="button"
          disabled={loading}
          onClick={submit}
          className="w-full rounded-xl bg-[#1E3A8A] py-3 text-sm font-semibold text-white transition active:scale-[0.99] disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar na agenda"}
        </button>
      </div>
    </Modal>
  );
};
