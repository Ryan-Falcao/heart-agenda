import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { StoreProvider, useStore } from "./store";
import { NavProvider, useNav } from "./nav";
import { HomeScreen } from "./HomeScreen";
import { SearchScreen } from "./SearchScreen";
import { AgendaScreen } from "./AgendaScreen";
import { SharedAgendaScreen } from "./SharedAgendaScreen";
import { CalendarScreen } from "./CalendarScreen";
import { ProfileScreen } from "./ProfileScreen";
import { FriendsScreen } from "./FriendsScreen";
import { SharedListScreen } from "./SharedListScreen";
import { SharedAgendaDetailScreen } from "./SharedAgendaDetailScreen";
import { BottomNav } from "./BottomNav";
import { Toast } from "./ui";
import { useNotificationScheduler } from "./useNotificationScheduler";
import { NotificationPermissionPrompt } from "./NotificationPermissionPrompt";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { useFriendInviteHandler } from "./hooks/useFriendInviteHandler";

const NotificationScheduler = () => {
  const { state, toast } = useStore();
  useNotificationScheduler(state.eventos, state.notif, toast);
  return null;
};

const AuthBridge = () => {
  const { profile, user } = useAuth();
  const { dispatch } = useStore();
  useEffect(() => {
    if (profile && user) {
      dispatch({
        type: "SET_USUARIO",
        usuario: {
          nome: `${profile.nome} ${profile.sobrenome}`.trim() || "Usuário",
          email: user.email ?? "",
        },
      });
    }
  }, [profile, user, dispatch]);
  return null;
};

const Router = () => {
  const { screen } = useNav();
  switch (screen.name) {
    case "home":
      return <HomeScreen />;
    case "search":
      return <SearchScreen />;
    case "calendar":
      return <CalendarScreen />;
    case "profile":
      return <ProfileScreen />;
    case "friends":
      return <FriendsScreen />;
    case "sharedList":
      return <SharedListScreen />;
    case "agenda":
      return <AgendaScreen id={screen.id} />;
    case "shared":
      return <SharedAgendaScreen id={screen.id} />;
    case "sharedDetail":
      return <SharedAgendaDetailScreen id={screen.id} />;
  }
};

const InviteHandler = () => {
  useFriendInviteHandler();
  return null;
};

const AuthGate = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F3F4F6]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-[#2563EB]" />
      </div>
    );
  }
  if (!user) return null;
  return <>{children}</>;
};

export const AppRoot = () => {
  return (
    <AuthProvider>
      <AuthGate>
        <div className="min-h-screen w-full bg-[#F3F4F6]">
          <StoreProvider>
            <NavProvider>
              <AuthBridge />
              <NotificationScheduler />
              <div className="relative mx-auto min-h-screen w-full max-w-[390px] bg-white">
                <Router />
                <BottomNav />
                <Toast />
                <NotificationPermissionPrompt />
              </div>
            </NavProvider>
          </StoreProvider>
        </div>
      </AuthGate>
    </AuthProvider>
  );
};
