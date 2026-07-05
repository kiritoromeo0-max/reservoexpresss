"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { AppointmentPublic } from "@/lib/types";
import { AppointmentCard } from "./provider-dashboard-screen";
import { formatLocalDate, formatLocalTime } from "../ui-helpers";
import { CalendarX2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProviderAppointmentsScreen() {
  const [tab, setTab] = useState<"upcoming" | "past" | "all">("upcoming");
  const [appts, setAppts] = useState<AppointmentPublic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    api
      .providerAppointments(tab)
      .then((r) => {
        if (active) setAppts(r.appointments);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [tab]);

  // Group by day
  const grouped = new Map<string, AppointmentPublic[]>();
  for (const a of appts) {
    const key = formatLocalDate(a.startTime);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(a);
  }
  const days = Array.from(grouped.entries());

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-4 md:px-8 pt-4 pb-2">
        <div className="mx-auto max-w-5xl">
        <h1 className="text-xl md:text-2xl font-bold mb-3">Rendez-vous</h1>
        <div className="flex bg-muted rounded-lg p-1 max-w-sm">
          {(
            [
              ["upcoming", "A venir"],
              ["past", "Passes"],
              ["all", "Tous"],
            ] as ["upcoming" | "past" | "all", string][]
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={cn(
                "flex-1 py-1.5 text-xs font-medium rounded-md transition-colors",
                tab === k ? "bg-card shadow-sm" : "text-muted-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto slim-scrollbar px-4 md:px-8 py-2 pb-6">
        <div className="mx-auto max-w-5xl">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : appts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CalendarX2 className="size-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Aucun RDV</p>
          </div>
        ) : (
          <div className="space-y-4">
            {days.map(([day, items]) => (
              <div key={day}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 px-1">
                  {day} · {items.length} RDV
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {items.map((a) => (
                    <AppointmentCard key={a.id} appt={a} showClient />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
