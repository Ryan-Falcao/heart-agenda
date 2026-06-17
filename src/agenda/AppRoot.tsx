import { StoreProvider } from "./store";
import { NavProvider, useNav } from "./nav";
import { HomeScreen } from "./HomeScreen";
import { SearchScreen } from "./SearchScreen";
import { AgendaScreen } from "./AgendaScreen";
import { SharedAgendaScreen } from "./SharedAgendaScreen";
import { CalendarScreen } from "./CalendarScreen";
import { ProfileScreen } from "./ProfileScreen";
import { BottomNav } from "./BottomNav";
import { Toast } from "./ui";

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
    case "agenda":
      return <AgendaScreen id={screen.id} />;
    case "shared":
      return <SharedAgendaScreen id={screen.id} />;
  }
};

export const AppRoot = () => {
  return (
    <div className="min-h-screen w-full bg-[#F3F4F6]">
      <StoreProvider>
        <NavProvider>
          <div className="relative mx-auto min-h-screen w-full max-w-[390px] bg-white">
            <Router />
            <BottomNav />
            <Toast />
          </div>
        </NavProvider>
      </StoreProvider>
    </div>
  );
};
