"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatPrice, Stars } from "../ui-helpers";
import {
  TrendingUp,
  Clock,
  CalendarDays,
  Star,
  Banknote,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Stats {
  occupancyRate: number;
  bookedMinWeek: number;
  availableMinWeek: number;
  totalAppointments: number;
  totalRevenue: number;
  avgRating: number;
  reviewCount: number;
  popularServices: { name: string; count: number; revenue: number }[];
  revenueByDay: { day: string; revenue: number; count: number }[];
}

export function ProviderStatsScreen() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.providerStats().then((s) => {
      setStats(s);
      setLoading(false);
    });
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex-1 grid place-items-center">
        <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const maxRevenue = Math.max(...stats.revenueByDay.map((d) => d.revenue), 1);
  const maxCount = Math.max(...stats.popularServices.map((s) => s.count), 1);

  return (
    <div className="flex-1 overflow-y-auto slim-scrollbar px-4 py-4 pb-6">
      <h1 className="text-xl font-bold mb-1">Statistiques</h1>
      <p className="text-xs text-muted-foreground mb-4">
        Apercu de votre activite
      </p>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <Kpi
          icon={<TrendingUp className="size-4" />}
          value={`${stats.occupancyRate}%`}
          label="Taux d'occupation"
          sub="cette semaine"
          color="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
        />
        <Kpi
          icon={<Banknote className="size-4" />}
          value={formatPrice(stats.totalRevenue)}
          label="Revenu total"
          sub={`${stats.totalAppointments} RDV`}
          color="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
        />
        <Kpi
          icon={<Star className="size-4" />}
          value={stats.avgRating.toFixed(1)}
          label="Note moyenne"
          sub={`${stats.reviewCount} avis`}
          color="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
        />
        <Kpi
          icon={<Clock className="size-4" />}
          value={`${Math.floor(stats.bookedMinWeek / 60)}h${(stats.bookedMinWeek % 60).toString().padStart(2, "0")}`}
          label="Reserve"
          sub={`/ ${Math.floor(stats.availableMinWeek / 60)}h dispo.`}
          color="bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400"
        />
      </div>

      {/* Revenue by day bar chart */}
      <div className="rounded-xl border border-border bg-card p-3 mb-4">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <CalendarDays className="size-4 text-primary" /> Revenu par jour
          <span className="text-xs text-muted-foreground font-normal ml-auto">
            cette semaine
          </span>
        </h3>
        <div className="flex items-end justify-between gap-1.5 h-28">
          {stats.revenueByDay.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex-1 flex items-end">
                <div
                  className="w-full bg-primary/80 rounded-t-md min-h-[2px] transition-all"
                  style={{
                    height: `${(d.revenue / maxRevenue) * 100}%`,
                  }}
                  title={`${formatPrice(d.revenue)} (${d.count} RDV)`}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">{d.day}</span>
              <span className="text-[9px] font-medium">
                {d.count > 0 ? formatPrice(d.revenue) : "-"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Popular services */}
      <div className="rounded-xl border border-border bg-card p-3 mb-4">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Award className="size-4 text-primary" /> Services populaires
        </h3>
        {stats.popularServices.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            Aucune donnee pour le moment
          </p>
        ) : (
          <div className="space-y-2.5">
            {stats.popularServices.map((s, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium truncate flex-1">{s.name}</span>
                  <span className="text-muted-foreground ml-2">
                    {s.count}x · {formatPrice(s.revenue)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${(s.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rating summary */}
      <div className="rounded-xl border border-border bg-card p-3">
        <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
          <Star className="size-4 text-primary" /> Satisfaction client
        </h3>
        <div className="flex items-center gap-3">
          <div className="text-center">
            <p className="text-3xl font-bold">{stats.avgRating.toFixed(1)}</p>
            <Stars rating={stats.avgRating} size={12} />
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {stats.reviewCount} avis
            </p>
          </div>
          <div className="flex-1 text-xs text-muted-foreground pl-3 border-l border-border">
            Continuez a offrir un excellent service pour maintenir votre
            notation et attirer de nouveaux clients.
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({
  icon,
  value,
  label,
  sub,
  color,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div
        className={cn(
          "size-7 rounded-lg grid place-items-center mb-1.5",
          color
        )}
      >
        {icon}
      </div>
      <p className="text-lg font-bold leading-none">{value}</p>
      <p className="text-xs font-medium mt-1">{label}</p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </div>
  );
}
