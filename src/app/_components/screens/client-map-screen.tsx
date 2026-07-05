"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useApp } from "@/lib/store";
import type { ProviderPublic } from "@/lib/types";
import { categoryIcon, categoryLabel, Stars, formatPrice } from "../ui-helpers";
import { MapPin, Locate, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ClientMapScreen() {
  const navigate = useApp((s) => s.navigate);
  const setSelectedProviderId = useApp((s) => s.setSelectedProviderId);
  const [providers, setProviders] = useState<ProviderPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ProviderPublic | null>(null);
  const [center, setCenter] = useState<{ lat: number; lng: number }>({
    lat: 48.8566,
    lng: 2.3522,
  });
  const [hasLocation, setHasLocation] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { providers } = await api.listProviders({ sort: "distance" });
        setProviders(providers);
        // Auto-fit bounds to providers if more than 1
        if (providers.length > 0) {
          const lats = providers.map((p) => p.lat);
          const lngs = providers.map((p) => p.lng);
          const minLat = Math.min(...lats);
          const maxLat = Math.max(...lats);
          const minLng = Math.min(...lngs);
          const maxLng = Math.max(...lngs);
          setCenter({
            lat: (minLat + maxLat) / 2,
            lng: (minLng + maxLng) / 2,
          });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function locate() {
    if (!navigator.geolocation) {
      setCenter({ lat: 48.8566, lng: 2.3522 });
      setHasLocation(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setHasLocation(true);
      },
      () => {
        setCenter({ lat: 48.8566, lng: 2.3522 });
        setHasLocation(true);
      }
    );
  }

  function open(p: ProviderPublic) {
    setSelectedProviderId(p.id);
    navigate("client-provider");
  }

  // Project lat/lng to x/y within a virtual bounding box.
  // We compute a bounding box around all providers + center, with padding.
  const allPoints = [
    ...providers.map((p) => ({ lat: p.lat, lng: p.lng })),
    center,
  ];
  const minLat = Math.min(...allPoints.map((p) => p.lat)) - 0.01;
  const maxLat = Math.max(...allPoints.map((p) => p.lat)) + 0.01;
  const minLng = Math.min(...allPoints.map((p) => p.lng)) - 0.01;
  const maxLng = Math.max(...allPoints.map((p) => p.lng)) + 0.01;
  const rangeLat = maxLat - minLat || 0.1;
  const rangeLng = maxLng - minLng || 0.1;

  function project(lat: number, lng: number) {
    // y: inverted (north = top)
    const x = ((lng - minLng) / rangeLng) * 100;
    const y = (1 - (lat - minLat) / rangeLat) * 100;
    return { x, y };
  }

  return (
    <div className="flex-1 flex flex-col relative">
      {/* Map canvas */}
      <div className="flex-1 relative bg-emerald-50 dark:bg-emerald-950/20 overflow-hidden">
        {/* Grid lines for "map" feel */}
        <svg
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          <defs>
            <pattern
              id="grid"
              width="10"
              height="10"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 10 0 L 0 0 0 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.15"
                className="text-emerald-200 dark:text-emerald-900/40"
              />
            </pattern>
            <radialGradient id="glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
          {/* Fake "streets" decoration */}
          <path
            d="M 0 30 Q 30 35 50 28 T 100 32"
            stroke="#fbbf24"
            strokeWidth="1.2"
            fill="none"
            opacity="0.5"
          />
          <path
            d="M 20 0 L 25 50 L 22 100"
            stroke="#fbbf24"
            strokeWidth="1"
            fill="none"
            opacity="0.4"
          />
          <path
            d="M 0 70 Q 40 65 60 72 T 100 68"
            stroke="#fbbf24"
            strokeWidth="0.8"
            fill="none"
            opacity="0.35"
          />
          <circle cx="50" cy="50" r="40" fill="url(#glow)" />
        </svg>

        {/* My location pin */}
        {hasLocation && (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
            style={{
              left: `${project(center.lat, center.lng).x}%`,
              top: `${project(center.lat, center.lng).y}%`,
            }}
          >
            <div className="relative">
              <div className="absolute inset-0 size-5 rounded-full bg-primary/30 animate-ping" />
              <div className="size-5 rounded-full bg-primary border-2 border-white shadow-md" />
            </div>
          </div>
        )}

        {/* Provider markers */}
        {providers.map((p, idx) => {
          const { x, y } = project(p.lat, p.lng);
          const Icon = categoryIcon(p.category);
          const isActive = selected?.id === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className={cn(
                "absolute -translate-x-1/2 -translate-y-full z-20 transition-all",
                isActive && "scale-125 z-30"
              )}
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <div
                className={cn(
                  "flex flex-col items-center",
                  isActive ? "text-primary" : "text-foreground"
                )}
              >
                <div
                  className={cn(
                    "size-9 rounded-full grid place-items-center border-2 border-white shadow-lg",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-primary"
                  )}
                >
                  <Icon className="size-4" />
                </div>
                <div className="w-0.5 h-2 bg-primary" />
                <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-primary" />
              </div>
            </button>
          );
        })}

        {/* Locate button */}
        <button
          onClick={locate}
          className="absolute bottom-4 right-4 size-11 rounded-full bg-card border border-border shadow-lg grid place-items-center hover:bg-accent transition-colors z-40"
          aria-label="Me localiser"
        >
          <Locate className="size-5 text-primary" />
        </button>

        {/* Legend */}
        <div className="absolute top-3 left-3 bg-card/95 backdrop-blur rounded-lg border border-border px-2.5 py-1.5 text-xs z-40">
          <p className="font-semibold mb-0.5">{providers.length} prestataires</p>
          <p className="text-muted-foreground text-[10px]">Cliquez un marqueur</p>
        </div>
      </div>

      {/* Bottom sheet for selected provider */}
      {selected && (
        <div className="absolute inset-x-0 bottom-0 z-50 bg-card border-t border-border rounded-t-2xl shadow-2xl p-4 pb-[max(1rem,env(safe-area-inset-bottom))] animate-in slide-in-from-bottom-4">
          <button
            onClick={() => setSelected(null)}
            className="absolute top-2 right-2 size-7 rounded-full hover:bg-accent grid place-items-center"
          >
            <X className="size-4" />
          </button>
          <div className="flex gap-3">
            <div className="size-14 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0 overflow-hidden">
              {selected.photos[0] ? (
                 
                <img
                  src={selected.photos[0]}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                (() => {
                  const Ic = categoryIcon(selected.category);
                  return <Ic className="size-6" />;
                })()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] uppercase tracking-wide text-primary font-semibold">
                {categoryLabel(selected.category)}
              </span>
              <p className="font-semibold text-sm truncate">
                {selected.businessName}
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3" />
                <span className="truncate">{selected.address}, {selected.city}</span>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <Stars rating={selected.rating} size={11} />
                <span className="text-xs text-muted-foreground">
                  {selected.rating.toFixed(1)} ({selected.reviewCount})
                </span>
              </div>
            </div>
          </div>
          <Button className="w-full mt-3" onClick={() => open(selected)}>
            Voir le prestataire
          </Button>
        </div>
      )}
    </div>
  );
}
