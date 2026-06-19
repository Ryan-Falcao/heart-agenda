import { useCallback, useEffect, useState } from "react";
import {
  hasNotificationSupport,
  notificationPermission,
  playAlertSound,
  registerNotificationSW,
  requestNotificationPermission,
  showSystemNotification,
  userHasInteracted,
} from "./notifications";
import { useStore } from "./store";

export const useNotifications = () => {
  const { state, dispatch, toast } = useStore();
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(hasNotificationSupport());
    setPermission(notificationPermission());
    // Registra SW para notificações em background
    void registerNotificationSW();
  }, []);

  const solicitarPermissao = useCallback(async () => {
    const p = await requestNotificationPermission();
    setPermission(p);
    dispatch({ type: "SET_NOTIF", patch: { permissaoSolicitada: true } });
    if (p === "granted") {
      toast({ kind: "success", text: "Notificações ativadas!" });
    } else if (p === "denied") {
      toast({ kind: "warning", text: "Notificações negadas — usaremos avisos no app." });
    }
    return p;
  }, [dispatch, toast]);

  const setAtivadas = (v: boolean) => dispatch({ type: "SET_NOTIF", patch: { ativadas: v } });
  const setSom = (v: boolean) => dispatch({ type: "SET_NOTIF", patch: { somAtivo: v } });
  const setAntecedencia = (min: number) =>
    dispatch({ type: "SET_NOTIF", patch: { antecedenciaMin: min } });

  const testar = useCallback(async () => {
    if (state.notif.somAtivo) {
      if (!userHasInteracted()) {
        toast({ kind: "warning", text: "Toque na tela para ativar sons." });
      }
      await playAlertSound();
    }
    const enviou = await showSystemNotification({
      title: "Agenda Digital",
      body: "🔔 Esta é uma notificação de teste",
      tag: "teste-notificacao",
    });
    if (!enviou) {
      toast({ kind: "warning", text: "🔔 Notificação de teste (in-app)" });
    } else {
      toast({ kind: "success", text: "Notificação de teste enviada!" });
    }
  }, [state.notif.somAtivo, toast]);

  return {
    supported,
    permission,
    settings: state.notif,
    solicitarPermissao,
    setAtivadas,
    setSom,
    setAntecedencia,
    testar,
  };
};
