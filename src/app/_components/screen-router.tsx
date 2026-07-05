"use client";

import { useApp } from "@/lib/store";

// Client screens
import { ClientHomeScreen } from "./screens/client-home-screen";
import { ClientSearchScreen } from "./screens/client-search-screen";
import { ClientMapScreen } from "./screens/client-map-screen";
import { ClientProviderScreen } from "./screens/client-provider-screen";
import { ClientBookingScreen } from "./screens/client-booking-screen";
import { ClientAppointmentsScreen } from "./screens/client-appointments-screen";
import { ClientAppointmentDetailScreen } from "./screens/client-appointment-detail-screen";
import { ClientNotificationsScreen } from "./screens/client-notifications-screen";
import { ClientProfileScreen } from "./screens/client-profile-screen";

// Provider screens
import { ProviderDashboardScreen } from "./screens/provider-dashboard-screen";
import { ProviderAppointmentsScreen } from "./screens/provider-appointments-screen";
import { ProviderUnavailabilitiesScreen } from "./screens/provider-unavailabilities-screen";
import { ProviderStatsScreen } from "./screens/provider-stats-screen";
import { ProviderNotificationsScreen } from "./screens/provider-notifications-screen";
import { ProviderProfileScreen } from "./screens/provider-profile-screen";

import { BottomNav } from "./bottom-nav";
import { ScreenHeader } from "./screen-header";

const CLIENT_TAB_SCREENS = [
  "client-home",
  "client-appointments",
  "client-notifications",
  "client-profile",
] as const;

const PROVIDER_TAB_SCREENS = [
  "provider-dashboard",
  "provider-appointments",
  "provider-unavailabilities",
  "provider-stats",
  "provider-profile",
] as const;

export function ScreenRouter() {
  const screen = useApp((s) => s.screen);
  const user = useApp((s) => s.user)!;

  const isClient = user.role === "CLIENT";
  const tabScreens = isClient ? CLIENT_TAB_SCREENS : PROVIDER_TAB_SCREENS;
  // Show bottom nav only on tab-root screens
  const showBottomNav = (tabScreens as readonly string[]).includes(screen);
  // Map screen uses the full viewport height (no scroll container, no padding)
  const isMapScreen = screen === "client-map";

  return (
    <div className="flex-1 flex flex-col min-h-0 h-[100dvh]">
      <ScreenHeader />
      {isMapScreen ? (
        <div key={screen} className="flex-1 flex flex-col min-h-0 screen-enter">
          {renderScreen(screen)}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto slim-scrollbar pb-24 md:pb-8">
          <div key={screen} className="flex-1 flex flex-col screen-enter">
            {renderScreen(screen)}
          </div>
        </div>
      )}
      {showBottomNav && <BottomNav />}
    </div>
  );
}

function renderScreen(screen: string) {
  switch (screen) {
    // Client
    case "client-home":
      return <ClientHomeScreen />;
    case "client-search":
      return <ClientSearchScreen />;
    case "client-map":
      return <ClientMapScreen />;
    case "client-provider":
      return <ClientProviderScreen />;
    case "client-booking":
      return <ClientBookingScreen />;
    case "client-appointments":
      return <ClientAppointmentsScreen />;
    case "client-appointment-detail":
      return <ClientAppointmentDetailScreen />;
    case "client-notifications":
      return <ClientNotificationsScreen />;
    case "client-profile":
      return <ClientProfileScreen />;
    // Provider
    case "provider-dashboard":
      return <ProviderDashboardScreen />;
    case "provider-appointments":
      return <ProviderAppointmentsScreen />;
    case "provider-unavailabilities":
      return <ProviderUnavailabilitiesScreen />;
    case "provider-stats":
      return <ProviderStatsScreen />;
    case "provider-notifications":
      return <ProviderNotificationsScreen />;
    case "provider-profile":
      return <ProviderProfileScreen />;
    default:
      return <div className="p-6">Ecran inconnu</div>;
  }
}
