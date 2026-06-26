import { useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader, IScannerControls } from "@zxing/browser";
import { Camera, X } from "lucide-react";
import { Modal, Spinner } from "./ui";

interface Props {
  open: boolean;
  onClose: () => void;
  onResult: (text: string) => void;
}

export const QRScannerModal = ({ open, onClose, onResult }: Props) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setError(null);
    setStarting(true);

    const reader = new BrowserQRCodeReader();

    (async () => {
      try {
        const devices = await BrowserQRCodeReader.listVideoInputDevices();
        if (cancelled) return;
        const back =
          devices.find((d) => /back|rear|environment/i.test(d.label)) ??
          devices[devices.length - 1];
        const controls = await reader.decodeFromVideoDevice(
          back?.deviceId,
          videoRef.current!,
          (result, _err, ctrl) => {
            if (result) {
              ctrl.stop();
              onResult(result.getText());
            }
          },
        );
        if (cancelled) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
        setStarting(false);
      } catch (e: any) {
        if (!cancelled) {
          setError(
            e?.message?.includes("Permission")
              ? "Permissão da câmera negada."
              : "Não foi possível acessar a câmera.",
          );
          setStarting(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [open, onResult]);

  return (
    <Modal open={open} onClose={onClose} title="Ler QR code">
      <div className="flex flex-col items-center gap-3">
        <div className="relative aspect-square w-full max-w-xs overflow-hidden rounded-2xl bg-black">
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            playsInline
            muted
          />
          {starting && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Spinner />
            </div>
          )}
          {!starting && !error && (
            <div className="pointer-events-none absolute inset-6 rounded-xl border-2 border-white/80" />
          )}
        </div>
        {error ? (
          <p className="px-4 text-center text-sm text-red-500">{error}</p>
        ) : (
          <p className="flex items-center gap-2 text-xs text-gray-500">
            <Camera size={14} /> Aponte para o QR code do amigo
          </p>
        )}
        <button
          onClick={onClose}
          className="flex items-center gap-2 rounded-full bg-gray-100 px-5 py-2 text-sm font-semibold text-gray-700"
        >
          <X size={16} /> Cancelar
        </button>
      </div>
    </Modal>
  );
};
