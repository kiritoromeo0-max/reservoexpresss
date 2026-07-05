"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { api } from "@/lib/api";
import { useApp } from "@/lib/store";
import type { ProviderPublic } from "@/lib/types";
import { categoryIcon, categoryLabel, Stars, formatPrice } from "../ui-helpers";
import { MapPin, Locate, X } from "lucide-react";
import { Button } from "@/components/ui/button";

// Leaflet needs `window`, so the map component is loaded client-side only.
const LeafletMap = dynamic(() => import("./leaflet-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full grid place-items-center bg-sky-100">
      <div className="size-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
    </div>
  ),
});

const ABIDJAN: [number, number] = [5.36, -4.0083];

export function ClientMapScreen() {
  const navigate = useApp((s) => s.navigate);
  const setSelectedProviderId = useApp((s) => s.setSelectedProviderId);
  const [providers, setProviders] = useState<ProviderPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ProviderPublic | null>(null);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { providers } = await api.listProviders({ sort: "distance" });
        setProviders(providers);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function locate() {
    if (!navigator.geolocation) {
      setUserPos(ABIDJAN);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
      () => setUserPos(ABIDJAN)
    );
  }

  function open(p: ProviderPublic) {
    setSelectedProviderId(p.id);
    navigate("client-provider");
  }

  return (
    <div className="flex-1 flex flex-col relative h-[calc(100dvh-3.5rem)]">
      {/* Map canvas */}
      <div className="flex-1 relative overflow-hidden min-h-0">
        <LeafletMap
          providers={providers}
          selectedId={selected?.id ?? null}
          userPos={userPos}
          onSelect={setSelected}
        />

        {/* Locate button */}
        <button
          onClick={locate}
          className="absolute bottom-4 right-4 z-[1000] size-11 rounded-full bg-white border-2 border-amber-500 shadow-lg grid place-items-center hover:bg-amber-50 transition-colors"
          aria-label="Me localiser"
        >
          <Locate className="size-5 text-amber-600" />
        </button>

        {/* Legend */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur rounded-lg border border-amber-200 px-2.5 py-1.5 text-xs z-[1000] shadow-sm">
          <p className="font-semibold text-foreground">
            {providers.length} prestataires
          </p>
          <p className="text-muted-foreground text-[10px]">Touchez un marqueur</p>
        </div>

        {loading && (
          <div className="absolute inset-0 grid place-items-center bg-white/60 backdrop-blur-sm z-[1001]">
            <div className="size-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
          </div>
        )}
      </div>

      {/* Bottom sheet for selected provider */}
      {selected && (
        <div className="absolute inset-x-0 bottom-0 z-[1100] bg-white border-t border-amber-200 rounded-t-2xl shadow-2xl p-4 pb-[max(1rem,env(safe-area-inset-bottom))] animate-in slide-in-from-bottom-4">
          <button
            onClick={() => setSelected(null)}
            className="absolute top-2 right-2 size-7 rounded-full hover:bg-amber-50 grid place-items-center"
          >
            <X className="size-4" />
          </button>
          <div className="flex gap-3">
            <div className="size-14 rounded-lg bg-amber-100 text-amber-700 grid place-items-center shrink-0 overflow-hidden">
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
              <span className="text-[10px] uppercase tracking-wide text-amber-600 font-semibold">
                {categoryLabel(selected.category)}
              </span>
              <p className="font-semibold text-sm truncate">
                {selected.businessName}
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3" />
                <span className="truncate">
                  {selected.address}, {selected.city}
                </span>
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
