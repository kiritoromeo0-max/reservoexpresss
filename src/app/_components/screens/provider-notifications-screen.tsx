"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useApp } from "@/lib/store";
import type { NotificationPublic } from "@/lib/types";
import { relativeTime } from "../ui-helpers";
import { Button } from "@/components/ui/button";
import {
  Bell,
  CheckCircle2,
  CalendarDays,
  XCircle,
  Star,
  AlertCircle,
  BellOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function ProviderNotificationsScreen() {
  const [items, setItems] = useState<NotificationPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const showToast = useApp((s) => s.showToast);
  const setUnreadCount = useApp((s) => s.setUnreadCount);

  useEffect(() => {
    fetch();
  }, []);

  async function fetch() {
    setLoading(true);
    try {
      const { notifications, unreadCount } = await api.listNotifications();
      setItems(notifications);
      setUnreadCount(unreadCount);
    } finally {
      setLoading(false);
    }
  }

  async function markAll() {
    await api.markNotificationsRead(undefined, true);
    await fetch();
    showToast("Tout marque comme lu.", "success");
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <h1 className="text-xl font-bold">Notifications</h1>
        {items.some((n) => !n.read) && (
          <Button variant="ghost" size="sm" onClick={markAll}>
            Tout lire
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto slim-scrollbar px-4 pb-6">
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <BellOff className="size-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Aucune notification</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((n) => {
              const Icon = iconForType(n.type);
              return (
                <div
                  key={n.id}
                  className={cn(
                    "rounded-xl border p-3 flex gap-3",
                    n.read
                      ? "border-border bg-card opacity-70"
                      : "border-primary/30 bg-primary/5"
                  )}
                >
                  <div
                    className={cn(
                      "size-9 rounded-lg grid place-items-center shrink-0",
                      colorForType(n.type)
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{n.title}</p>
                    <p className="text-xs text-foreground/80 mt-0.5">
                      {n.message}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {relativeTime(n.createdAt)}
                    </p>
                  </div>
                  {!n.read && (
                    <div className="size-2 rounded-full bg-primary shrink-0 mt-1.5" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function iconForType(t: string) {
  switch (t) {
    case "BOOKING_CONFIRMED":
      return CheckCircle2;
    case "REMINDER_D1":
      return CalendarDays;
    case "BOOKING_CANCELLED":
      return XCircle;
    case "NEW_REVIEW":
      return Star;
    case "NEW_BOOKING":
      return Bell;
    default:
      return AlertCircle;
  }
}

function colorForType(t: string): string {
  switch (t) {
    case "BOOKING_CONFIRMED":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "REMINDER_D1":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    case "BOOKING_CANCELLED":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    case "NEW_REVIEW":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
    case "NEW_BOOKING":
      return "bg-primary/15 text-primary";
    default:
      return "bg-muted text-muted-foreground";
  }
}
