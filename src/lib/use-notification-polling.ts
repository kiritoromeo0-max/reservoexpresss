"use client";

import { useEffect } from "react";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";

// Polls notifications every 30s to keep the unread badge fresh.
export function useNotificationPolling() {
  const user = useApp((s) => s.user);
  const setUnreadCount = useApp((s) => s.setUnreadCount);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const tick = async () => {
      try {
        const { unreadCount } = await api.listNotifications();
        if (active) setUnreadCount(unreadCount);
      } catch {
        // ignore
      }
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [user, setUnreadCount]);
}
