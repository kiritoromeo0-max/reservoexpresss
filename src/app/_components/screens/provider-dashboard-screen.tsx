"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useApp } from "@/lib/store";
import type { AppointmentPublic } from "@/lib/types";
import {
  formatLocalTime,
  formatLocalDate,
  formatDuration,
  formatPrice,
  Avatar,
} from "../ui-helpers";
import {
  CalendarDays,
  Clock,
  TrendingUp,
  CalendarX2,
  ChevronRight,
  Users,
} from "lucide-react";
import { useNotificationPolling } from "@/lib/use-notification-polling";
import { cn } from "@/lib/utils";

export function ProviderDashboardScreen() {
  const user = useApp((s) => s.user)!;
  const navigate = useApp((s) => s.navigate);
  const resetTo = useApp((s) => s.resetTo);
  const [data, setData] = useState<{
    today: AppointmentPublic[];
    week: AppointmentPublic[];
    counts: { today: number; week: number; unavailabilities: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useNotificationPolling();

  useEffect(() => {
    api.providerDashboard().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  const todayLabel = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="flex-1 overflow-y-auto slim-scrollbar pb-6">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-5 pt-6 pb-6 rounded-b-3xl">
        <div className="flex items-center gap-3 mb-4">
          <Avatar name={user.name} color={user.avatarColor} size={44} />
          <div className="flex-1">
            <p className="text-xs opacity-80">Espace prestataire</p>
            <p className="font-semibold leading-tight">
              {user.provider?.businessName ?? user.name}
            </p>
          </div>
        </div>
        <h2 className="text-xl font-bold leading-tight">
          Tableau de bord
        </h2>
        <p className="text-sm opacity-90 capitalize">{todayLabel}</p>
      </div>

      {/* Stat cards */}
      <div className="px-4 -mt-4 grid grid-cols-3 gap-2">
        <StatCard
          icon={<CalendarDays className="size-4" />}
          value={loading ? "..." : String(data?.counts.today ?? 0)}
          label="Aujourd'hui"
          onClick={() => resetTo("provider-appointments")}
        />
        <StatCard
          icon={<TrendingUp className="size-4" />}
          value={loading ? "..." : String(data?.counts.week ?? 0)}
          label="Cette semaine"
          onClick={() => resetTo("provider-appointments")}
        />
        <StatCard
          icon={<CalendarX2 className="size-4" />}
          value={loading ? "..." : String(data?.counts.unavailabilities ?? 0)}
          label="Indispo."
          onClick={() => resetTo("provider-unavailabilities")}
        />
      </div>

      {/* Today's appointments */}
      <div className="px-4 mt-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold flex items-center gap-2">
            <Clock className="size-4 text-primary" /> RDV du jour
          </h3>
          <button
            onClick={() => resetTo("provider-appointments")}
            className="text-xs text-primary font-medium"
          >
            Tout voir
          </button>
        </div>
        {loading ? (
          <div className="space-y-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : !data || data.today.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">
            <CalendarDays className="size-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Aucun RDV aujourd'hui</p>
            <p className="text-xs mt-0.5">Profitez-en pour faire une pause !</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.today.map((a) => (
              <AppointmentCard
                key={a.id}
                appt={a}
                showClient
                onClick={() => {
                  useApp.getState().setSelectedAppointmentId(a.id);
                  // open in a simple dialog-like nav (we reuse client detail screen logic via state)
                  // For provider, we show a lighter inline view: navigate to appointments list
                  resetTo("provider-appointments");
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Week preview */}
      <div className="px-4 mt-5">
        <h3 className="font-semibold flex items-center gap-2 mb-2">
          <CalendarDays className="size-4 text-primary" /> Cette semaine
        </h3>
        {loading ? (
          <div className="h-20 rounded-xl bg-muted animate-pulse" />
        ) : !data || data.week.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
            Aucun RDV cette semaine
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            {groupByDay(data.week).map((group) => (
              <div key={group.day} className="px-3 py-2 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{group.day}</p>
                  <p className="text-xs text-muted-foreground">
                    {group.items.length} RDV
                    {group.items.length > 0 &&
                      ` · ${formatLocalTime(group.items[0].startTime)}...`}
                  </p>
                </div>
                <ChevronRight className="size-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="px-4 mt-5 grid grid-cols-2 gap-2">
        <button
          onClick={() => resetTo("provider-unavailabilities")}
          className="rounded-xl border border-border bg-card p-3 flex flex-col items-center gap-1.5 hover:shadow-sm transition-shadow"
        >
          <CalendarX2 className="size-5 text-primary" />
          <span className="text-xs font-medium">Ajouter indispo.</span>
        </button>
        <button
          onClick={() => resetTo("provider-stats")}
          className="rounded-xl border border-border bg-card p-3 flex flex-col items-center gap-1.5 hover:shadow-sm transition-shadow"
        >
          <TrendingUp className="size-5 text-primary" />
          <span className="text-xs font-medium">Statistiques</span>
        </button>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border border-border bg-card p-3 text-left hover:shadow-sm transition-shadow"
    >
      <div className="size-7 rounded-lg bg-primary/10 text-primary grid place-items-center mb-1.5">
        {icon}
      </div>
      <p className="text-xl font-bold leading-none">{value}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
    </button>
  );
}

export function AppointmentCard({
  appt,
  showClient,
  onClick,
}: {
  appt: AppointmentPublic;
  showClient?: boolean;
  onClick?: () => void;
}) {
  const cancelled = appt.status === "CANCELLED";
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-xl border bg-card p-3 hover:shadow-sm transition-shadow",
        cancelled ? "border-border opacity-60" : "border-border"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center justify-center w-14 shrink-0">
          <span className="text-lg font-bold text-primary leading-none">
            {formatLocalTime(appt.startTime)}
          </span>
          <span className="text-[10px] text-muted-foreground mt-0.5">
            {formatDuration(appt.service.durationMin)}
          </span>
        </div>
        <div className="flex-1 min-w-0 border-l border-border pl-3">
          <p className="font-semibold text-sm truncate">{appt.service.name}</p>
          {showClient && appt.client ? (
            <div className="flex items-center gap-1.5 mt-0.5">
              <Avatar
                name={appt.client.name}
                color={appt.client.avatarColor}
                size={16}
              />
              <span className="text-xs text-muted-foreground truncate">
                {appt.client.name}
              </span>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground truncate">
              {appt.provider.businessName}
            </p>
          )}
          {appt.notes && (
            <p className="text-[11px] text-muted-foreground mt-0.5 italic line-clamp-1">
              "{appt.notes}"
            </p>
          )}
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-xs font-semibold text-primary">
              {formatPrice(appt.service.price)}
            </span>
            {appt.depositPaid > 0 && (
              <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full px-1.5 py-0.5">
                Acompte
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function groupByDay(appts: AppointmentPublic[]) {
  const groups = new Map<string, AppointmentPublic[]>();
  for (const a of appts) {
    const key = formatLocalDate(a.startTime);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(a);
  }
  return Array.from(groups.entries()).map(([day, items]) => ({ day, items }));
}
