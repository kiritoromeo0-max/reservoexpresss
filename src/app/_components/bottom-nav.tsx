"use client";

import { useApp } from "@/lib/store";
import { Home, CalendarDays, Bell, User, CalendarX2, BarChart3, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

const CLIENT_TABS = [
  { id: "client-home", label: "Accueil", icon: Home },
  { id: "client-appointments", label: "RDV", icon: CalendarDays },
  { id: "client-notifications", label: "Alertes", icon: Bell },
  { id: "client-profile", label: "Profil", icon: User },
] as const;

const PROVIDER_TABS = [
  { id: "provider-dashboard", label: "Tableau", icon: LayoutDashboard },
  { id: "provider-appointments", label: "RDV", icon: CalendarDays },
  { id: "provider-unavailabilities", label: "Indisp.", icon: CalendarX2 },
  { id: "provider-stats", label: "Stats", icon: BarChart3 },
  { id: "provider-profile", label: "Profil", icon: User },
] as const;

export function BottomNav() {
  const user = useApp((s) => s.user)!;
  const screen = useApp((s) => s.screen);
  const resetTo = useApp((s) => s.resetTo);
  const unreadCount = useApp((s) => s._unreadCount);

  const tabs = user.role === "CLIENT" ? CLIENT_TABS : PROVIDER_TABS;

  return (
    <>
      {/* Mobile: fixed full-width bar at bottom */}
      <nav className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 px-1 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <ul className="flex items-stretch justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active =
              screen === tab.id ||
              (tab.id === "client-notifications" && screen === "client-notifications") ||
              (tab.id === "provider-appointments" && screen === "provider-appointments");
            const showBadge =
              (tab.id === "client-notifications" || tab.id === "provider-notifications") &&
              unreadCount > 0;
            return (
              <li key={tab.id} className="flex-1">
                <button
                  onClick={() => resetTo(tab.id as never)}
                  className={cn(
                    "w-full flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-lg transition-colors relative",
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className="relative">
                    <Icon className={cn("size-5", active && "stroke-[2.5]")} />
                    {showBadge && (
                      <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold grid place-items-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium leading-none">{tab.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Desktop: floating centered pill */}
      <nav className="hidden md:flex fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border border-border shadow-xl rounded-full px-2 py-1.5 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active =
            screen === tab.id ||
            (tab.id === "client-notifications" && screen === "client-notifications") ||
            (tab.id === "provider-appointments" && screen === "provider-appointments");
          const showBadge =
            (tab.id === "client-notifications" || tab.id === "provider-notifications") &&
            unreadCount > 0;
          return (
            <button
              key={tab.id}
              onClick={() => resetTo(tab.id as never)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full transition-colors relative",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <div className="relative">
                <Icon className={cn("size-5", active && "stroke-[2.5]")} />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold grid place-items-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-sm font-medium leading-none hidden lg:inline">
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
