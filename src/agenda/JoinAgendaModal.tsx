import { useState } from "react";
import { Modal } from "./ui";
import { useStore, uid } from "./store";

export const JoinAgendaModal = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const { dispatch, toast } = useStore();
  const [val, setVal] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = () => {
    if (!val.trim()) {
      toast({ kind: "error", text: "Informe o código ou e-mail" });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const id = uid();
      dispatch({
        type: "JOIN_AGENDA",
        agenda: {
          id,
          nome: `Agenda ${val.slice(0, 8)}`,
          cor: "#3B82F6",
          icone: "Users",
          compartilhada: true,
          papel: "Membro",
          subtitulo: "Compartilhada • Convidado",
        },
        membro: {
          id: uid(),
          agendaId: id,
          nome: "Ryan",
          email: "ryan@email.com",
          papel: "Membro",
        },
      });
      toast({ kind: "success", text: "Você entrou na agenda!" });
      setLoading(false);
      setVal("");
      onClose();
    }, 300);
  };

  return (
    <Modal open={open} onClose={onClose} title="Entrar em outra agenda">
      <div className="space-y-4">
        <p className="text-center text-xs text-gray-500">
          Digite o código de convite ou e-mail do administrador da agenda
        </p>
        <input
          autoFocus
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="Código ou e-mail"
          className="w-full border-b border-[#F0F0F0] bg-transparent py-2 text-sm outline-none focus:border-[#2563EB]"
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
