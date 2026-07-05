"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useApp } from "@/lib/store";
import type { ProviderPublic } from "@/lib/types";
import { CATEGORIES, Stars, categoryIcon, formatPrice } from "../ui-helpers";
import { Avatar } from "../ui-helpers";
import { useNotificationPolling } from "@/lib/use-notification-polling";
import { Search, MapPin, CalendarCheck, ChevronRight } from "lucide-react";

export function ClientHomeScreen() {
  const user = useApp((s) => s.user)!;
  const navigate = useApp((s) => s.navigate);
  const setSelectedProviderId = useApp((s) => s.setSelectedProviderId);
  const [featured, setFeatured] = useState<ProviderPublic[]>([]);
  const [loading, setLoading] = useState(true);

  useNotificationPolling();

  useEffect(() => {
    (async () => {
      try {
        const { providers } = await api.listProviders({ sort: "rating" });
        setFeatured(providers);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function openProvider(id: string) {
    setSelectedProviderId(id);
    navigate("client-provider");
  }

  function searchCategory(cat: string) {
    navigate("client-search");
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("rx-search-category", { detail: cat }));
    }, 50);
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero header */}
      <div className="bg-primary text-primary-foreground rounded-b-3xl md:rounded-none">
        <div className="mx-auto max-w-5xl px-5 md:px-8 pt-6 pb-8 md:pb-10">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <Avatar name={user.name} color={user.avatarColor} size={40} />
              <div>
                <p className="text-xs opacity-80">Bonjour</p>
                <p className="font-semibold leading-tight">{user.name.split(" ")[0]}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1.5">
                <CalendarCheck className="size-4" />
                <span className="text-sm font-semibold">ReservoExpress</span>
              </div>
              <button
                onClick={() => navigate("client-notifications")}
                className="size-10 rounded-full bg-white/15 grid place-items-center"
                aria-label="Notifications"
              >
                <CalendarCheck className="size-5" />
              </button>
            </div>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold leading-tight mb-1">
            Reservez un creneau
          </h2>
          <p className="text-sm md:text-base opacity-90 mb-5">
            Chez un prestataire local en Cote d'Ivoire, en 3 taps.
          </p>
          {/* Search bar */}
          <button
            onClick={() => navigate("client-search")}
            className="w-full bg-white text-foreground rounded-xl flex items-center gap-2 px-4 py-3.5 shadow-sm hover:shadow-md transition-shadow"
          >
            <Search className="size-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Coiffeur, medecin, garage...
            </span>
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl w-full px-5 md:px-8 py-5 md:py-8 space-y-8">
        {/* Categories */}
        <section>
          <h3 className="font-semibold text-lg mb-3">Categories</h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              return (
                <button
                  key={c.id}
                  onClick={() => searchCategory(c.id)}
                  className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-3 hover:bg-accent hover:shadow-sm transition-all"
                >
                  <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
                    <Icon className="size-5" />
                  </div>
                  <span className="text-xs font-medium">{c.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Map shortcut */}
        <button
          onClick={() => navigate("client-map")}
          className="w-full rounded-2xl border border-border bg-gradient-to-br from-amber-50 to-orange-100 dark:from-zinc-800 dark:to-zinc-800/50 p-4 flex items-center gap-3 hover:shadow-md transition-shadow text-left"
        >
          <div className="size-11 rounded-xl bg-white dark:bg-zinc-900 grid place-items-center shadow-sm">
            <MapPin className="size-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">Voir la carte interactive</p>
            <p className="text-xs text-muted-foreground">
              Trouvez un prestataire pres de chez vous en Cote d'Ivoire
            </p>
          </div>
          <ChevronRight className="size-5 text-muted-foreground" />
        </button>

        {/* Featured */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg">Top prestataires</h3>
            <button
              onClick={() => navigate("client-search")}
              className="text-xs text-primary font-medium"
            >
              Tout voir
            </button>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : featured.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Aucun prestataire pour le moment
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
              {featured.map((p) => {
                const Icon = categoryIcon(p.category);
                return (
                  <button
                    key={p.id}
                    onClick={() => openProvider(p.id)}
                    className="w-full flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:shadow-sm transition-shadow text-left"
                  >
                    <div className="size-12 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0 overflow-hidden">
                      {p.photos[0] ? (
                        <img
                          src={p.photos[0]}
                          alt={p.businessName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Icon className="size-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{p.businessName}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3" />
                        <span className="truncate">{p.city}</span>
                        {p.distanceKm != null && (
                          <span className="ml-1">· {p.distanceKm.toFixed(1)} km</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Stars rating={p.rating} size={12} />
                        <span className="text-xs text-muted-foreground">
                          {p.rating.toFixed(1)} ({p.reviewCount})
                        </span>
                      </div>
                    </div>
                    {p.services[0] && (
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground">des</p>
                        <p className="text-sm font-semibold text-primary">
                          {formatPrice(Math.min(...p.services.map((s) => s.price)))}
                        </p>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
