"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useApp } from "@/lib/store";
import type { AppointmentPublic } from "@/lib/types";
import {
  formatLocalDateTime,
  formatLocalTime,
  formatDuration,
  formatPrice,
  categoryIcon,
  Stars,
} from "../ui-helpers";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, ChevronRight, CalendarX2, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function ClientAppointmentsScreen() {
  const navigate = useApp((s) => s.navigate);
  const setSelectedAppointmentId = useApp((s) => s.setSelectedAppointmentId);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [appts, setAppts] = useState<AppointmentPublic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    api
      .listAppointments(tab)
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

  function open(id: string) {
    setSelectedAppointmentId(id);
    navigate("client-appointment-detail");
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-4 md:px-8 pt-4 pb-2">
        <div className="mx-auto max-w-5xl">
        <h1 className="text-xl md:text-2xl font-bold mb-3">Mes rendez-vous</h1>
        <div className="flex bg-muted rounded-lg p-1 max-w-xs">
          <button
            onClick={() => setTab("upcoming")}
            className={cn(
              "flex-1 py-1.5 text-sm font-medium rounded-md transition-colors",
              tab === "upcoming"
                ? "bg-card shadow-sm"
                : "text-muted-foreground"
            )}
          >
            A venir
          </button>
          <button
            onClick={() => setTab("past")}
            className={cn(
              "flex-1 py-1.5 text-sm font-medium rounded-md transition-colors",
              tab === "past"
                ? "bg-card shadow-sm"
                : "text-muted-foreground"
            )}
          >
            Passes
          </button>
        </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto slim-scrollbar px-4 md:px-8 py-2 pb-6">
        <div className="mx-auto max-w-5xl">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : appts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CalendarX2 className="size-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">
              {tab === "upcoming"
                ? "Aucun RDV a venir"
                : "Aucun RDV passe"}
            </p>
            {tab === "upcoming" && (
              <Button
                variant="link"
                className="mt-2"
                onClick={() => navigate("client-search")}
              >
                Reserver un creneau
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
            {appts.map((a) => {
              const Icon = categoryIcon(a.provider.category);
              const cancelled = a.status === "CANCELLED";
              const completed = a.status === "COMPLETED";
              const canReview =
                completed && !a.review && tab === "past";
              return (
                <button
                  key={a.id}
                  onClick={() => open(a.id)}
                  className={cn(
                    "w-full text-left rounded-xl border bg-card p-3 hover:shadow-sm transition-shadow",
                    cancelled ? "border-border opacity-70" : "border-border"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="size-12 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
                      <Icon className="size-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-sm truncate">
                          {a.provider.businessName}
                        </p>
                        <StatusBadge status={a.status} />
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {a.service.name}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <CalendarDays className="size-3" />
                        <span>{formatLocalDateTime(a.startTime)}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="size-3" />
                          {formatDuration(a.service.durationMin)}
                        </span>
                        <span className="font-semibold text-primary">
                          {formatPrice(a.service.price)}
                        </span>
                        {a.depositPaid > 0 && (
                          <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full px-1.5 py-0.5">
                            Acompte {formatPrice(a.depositPaid)}
                          </span>
                        )}
                      </div>
                      {canReview && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-primary font-medium">
                          <Star className="size-3 fill-primary" />
                          Laisser un avis
                        </div>
                      )}
                      {a.review && (
                        <div className="mt-1.5 flex items-center gap-1">
                          <Stars rating={a.review.rating} size={11} />
                        </div>
                      )}
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground shrink-0 mt-1" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    CONFIRMED: {
      label: "Confirme",
      cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    COMPLETED: {
      label: "Termine",
      cls: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
    },
    CANCELLED: {
      label: "Annule",
      cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    },
    NO_SHOW: {
      label: "Absent",
      cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    },
  };
  const s = map[status] ?? map.CONFIRMED;
  return (
    <span className={cn("text-[10px] font-medium rounded-full px-2 py-0.5 shrink-0", s.cls)}>
      {s.label}
    </span>
  );
}
