"use client";

import { useApp } from "@/lib/store";
import { ChevronLeft, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const TITLES: Record<string, string> = {
  "client-search": "Rechercher",
  "client-map": "Carte",
  "client-provider": "Prestataire",
  "client-booking": "Reservation",
  "client-appointments": "Mes RDV",
  "client-appointment-detail": "Detail du RDV",
  "client-notifications": "Notifications",
  "client-profile": "Mon profil",
  "provider-appointments": "Tous les RDV",
  "provider-unavailabilities": "Indisponibilites",
  "provider-stats": "Statistiques",
  "provider-notifications": "Notifications",
  "provider-profile": "Mon profil",
};

const HIDE_HEADER = new Set([
  "client-home",
  "provider-dashboard",
  "auth-login",
  "auth-register",
]);

export function ScreenHeader() {
  const screen = useApp((s) => s.screen);
  const history = useApp((s) => s.history);
  const back = useApp((s) => s.back);
  const resetTo = useApp((s) => s.resetTo);
  const user = useApp((s) => s.user);
  const unread = useApp((s) => s._unreadCount);

  if (HIDE_HEADER.has(screen)) return null;

  const title = TITLES[screen] ?? "";
  const canBack = history.length > 0;
  const notifTarget = user?.role === "PROVIDER" ? "provider-notifications" : "client-notifications";

  return (
    <header className="shrink-0 sticky top-0 z-20 bg-card/95 backdrop-blur border-b border-border">
      <div className="h-14 px-2 flex items-center gap-1">
        <button
          onClick={() => (canBack ? back() : resetTo(user?.role === "PROVIDER" ? "provider-dashboard" : "client-home"))}
          className={cn(
            "size-9 grid place-items-center rounded-full hover:bg-accent transition-colors",
            !canBack && "opacity-40"
          )}
          aria-label="Retour"
        >
          <ChevronLeft className="size-6" />
        </button>
        <h1 className="flex-1 text-center font-semibold text-base truncate px-1">
          {title}
        </h1>
        <button
          onClick={() => resetTo(notifTarget as never)}
          className="size-9 grid place-items-center rounded-full hover:bg-accent transition-colors relative"
          aria-label="Notifications"
        >
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 min-w-[14px] h-3.5 px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold grid place-items-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
