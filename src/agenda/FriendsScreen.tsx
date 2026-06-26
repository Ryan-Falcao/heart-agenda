import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  Copy,
  Mail,
  QrCode,
  ScanLine,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import QRCode from "qrcode";
import { QRScannerModal } from "./QRScannerModal";
import { useNav } from "./nav";
import { useStore } from "./store";
import { useFriendships } from "./hooks/useFriendships";
import { Avatar, Modal, Spinner } from "./ui";

type Tab = "friends" | "received" | "sent";

export const FriendsScreen = () => {
  const { back } = useNav();
  const { toast } = useStore();
  const {
    loading,
    accepted,
    received,
    sent,
    myCode,
    sendRequestByEmail,
    acceptByCode,
    accept,
    reject,
    remove,
  } = useFriendships();

  const [tab, setTab] = useState<Tab>("friends");
  const [showAdd, setShowAdd] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  useEffect(() => {
    if (showQR && myCode) {
      const link = `${window.location.origin}/?friend=${myCode}`;
      QRCode.toDataURL(link, { width: 240, margin: 1 }).then(setQrUrl).catch(() => {});
    }
  }, [showQR, myCode]);

  const handleSendEmail = async () => {
    try {
      await sendRequestByEmail(email);
      toast({ kind: "success", text: "Solicitação enviada!" });
      setEmail("");
      setShowAdd(false);
      setTab("sent");
    } catch (e: any) {
      toast({ kind: "error", text: e?.message ?? "Erro" });
    }
  };
  const handleAcceptCode = async () => {
    try {
      await acceptByCode(code);
      toast({ kind: "success", text: "Solicitação enviada!" });
      setCode("");
      setShowAdd(false);
      setTab("sent");
    } catch (e: any) {
      toast({ kind: "error", text: e?.message ?? "Erro" });
    }
  };

  const copyMyCode = async () => {
    if (!myCode) return;
    const link = `${window.location.origin}/?friend=${myCode}`;
    try {
      await navigator.clipboard.writeText(link);
      toast({ kind: "success", text: "Link copiado!" });
    } catch {
      toast({ kind: "error", text: "Não foi possível copiar" });
    }
  };

  const handleScanResult = async (text: string) => {
    setShowScan(false);
    let scanned = text.trim();
    try {
      const url = new URL(scanned);
      const fc = url.searchParams.get("friend");
      if (fc) scanned = fc;
    } catch {
      // not a URL, use raw text as code
    }
    try {
      await acceptByCode(scanned);
      toast({ kind: "success", text: "Solicitação enviada!" });
      setTab("sent");
    } catch (e: any) {
      toast({ kind: "error", text: e?.message ?? "QR inválido" });
    }
  };

  const list =
    tab === "friends" ? accepted : tab === "received" ? received : sent;

  return (
    <div className="pb-28">
      <header className="flex items-center gap-3 px-4 pb-2 pt-5">
        <button onClick={back} className="-ml-2 p-2">
          <ArrowLeft size={22} />
        </button>
        <h1 className="flex-1 text-base font-bold text-[#1A1A1A]">Amigos</h1>
        <button
          onClick={() => setShowScan(true)}
          className="rounded-full p-2 active:bg-gray-100"
          aria-label="Ler QR code"
        >
          <ScanLine size={20} />
        </button>
        <button
          onClick={() => setShowQR(true)}
          className="rounded-full p-2 active:bg-gray-100"
          aria-label="Meu QR code"
        >
          <QrCode size={20} />
        </button>
        <button
          onClick={() => setShowAdd(true)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2563EB] text-white"
          aria-label="Adicionar amigo"
        >
          <UserPlus size={18} />
        </button>
      </header>

      <div className="mx-4 mb-3 flex rounded-full bg-gray-100 p-1 text-xs font-medium">
        {(
          [
            { k: "friends", label: `Amigos (${accepted.length})` },
            { k: "received", label: `Recebidas (${received.length})` },
            { k: "sent", label: `Enviadas (${sent.length})` },
          ] as { k: Tab; label: string }[]
        ).map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={`flex-1 rounded-full py-1.5 transition ${
              tab === t.k ? "bg-white text-[#1A1A1A] shadow-sm" : "text-gray-500"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : list.length === 0 ? (
        <div className="px-4 py-10 text-center text-sm text-gray-400">
          {tab === "friends" && "Você ainda não tem amigos."}
          {tab === "received" && "Sem solicitações recebidas."}
          {tab === "sent" && "Sem solicitações enviadas."}
        </div>
      ) : (
        <ul className="flex flex-col gap-2 px-4">
          {list.map((f) => {
            const name =
              `${f.other.nome} ${f.other.sobrenome}`.trim() || "Usuário";
            return (
              <li
                key={f.id}
                className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3"
              >
                {f.other.avatar_url ? (
                  <img
                    src={f.other.avatar_url}
                    alt={name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <Avatar nome={name} size={40} />
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-[#1A1A1A]">
                    {name}
                  </div>
                  {f.other.email && (
                    <div className="truncate text-xs text-gray-500">
                      {f.other.email}
                    </div>
                  )}
                </div>
                {tab === "received" && (
                  <>
                    <button
                      onClick={() => accept(f.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500 text-white"
                      aria-label="Aceitar"
                    >
                      <Check size={18} />
                    </button>
                    <button
                      onClick={() => reject(f.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-gray-700"
                      aria-label="Recusar"
                    >
                      <X size={18} />
                    </button>
                  </>
                )}
                {(tab === "friends" || tab === "sent") && (
                  <button
                    onClick={() => remove(f.id)}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-red-500 active:bg-red-50"
                    aria-label="Remover"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Add modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Adicionar amigo">
        <div className="space-y-5">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Por e-mail
            </label>
            <div className="flex gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-xl border border-gray-200 px-3">
                <Mail size={16} className="text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="amigo@email.com"
                  className="flex-1 bg-transparent py-2 text-sm outline-none"
                />
              </div>
              <button
                onClick={handleSendEmail}
                disabled={!email.trim()}
                className="rounded-xl bg-[#2563EB] px-4 text-sm font-semibold text-white disabled:opacity-40"
              >
                Enviar
              </button>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-4">
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Por código de convite
            </label>
            <div className="flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="EX: AB12CD34"
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm uppercase tracking-wider outline-none"
              />
              <button
                onClick={handleAcceptCode}
                disabled={!code.trim()}
                className="rounded-xl bg-[#1E3A8A] px-4 text-sm font-semibold text-white disabled:opacity-40"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* QR modal */}
      <Modal open={showQR} onClose={() => setShowQR(false)} title="Meu convite">
        <div className="flex flex-col items-center gap-3">
          {qrUrl ? (
            <img src={qrUrl} alt="QR code" className="h-60 w-60" />
          ) : (
            <Spinner />
          )}
          {myCode && (
            <>
              <div className="rounded-lg bg-gray-100 px-4 py-2 text-lg font-bold tracking-widest">
                {myCode}
              </div>
              <button
                onClick={copyMyCode}
                className="flex items-center gap-2 rounded-full bg-[#2563EB] px-5 py-2 text-sm font-semibold text-white"
              >
                <Copy size={16} /> Copiar link de convite
              </button>
              <p className="px-4 text-center text-xs text-gray-500">
                Compartilhe o QR ou o link para adicionar amigos automaticamente.
              </p>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};
