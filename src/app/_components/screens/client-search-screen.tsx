"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useApp } from "@/lib/store";
import type { ProviderPublic } from "@/lib/types";
import { CATEGORIES, Stars, categoryIcon, formatPrice } from "../ui-helpers";
import { Search, MapPin, SlidersHorizontal, Locate, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type SortKey = "distance" | "rating" | "name";

export function ClientSearchScreen() {
  const navigate = useApp((s) => s.navigate);
  const setSelectedProviderId = useApp((s) => s.setSelectedProviderId);

  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("distance");
  const [maxDistance, setMaxDistance] = useState<number>(0); // 0 = unlimited
  const [useLocation, setUseLocation] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [providers, setProviders] = useState<ProviderPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const { providers } = await api.listProviders({
        q: q || undefined,
        category: category === "all" ? undefined : category,
        lat: useLocation && location ? location.lat : undefined,
        lng: useLocation && location ? location.lng : undefined,
        maxDistance: useLocation && maxDistance > 0 ? maxDistance : undefined,
        sort,
      });
      setProviders(providers);
    } finally {
      setLoading(false);
    }
  }, [q, category, sort, maxDistance, useLocation, location]);

  // Debounced fetch
  useEffect(() => {
    const id = setTimeout(fetchProviders, 250);
    return () => clearTimeout(id);
  }, [fetchProviders]);

  // Listen for category quick-set from home screen
  useEffect(() => {
    function onCat(e: Event) {
      const cat = (e as CustomEvent).detail as string;
      setCategory(cat);
    }
    window.addEventListener("rx-search-category", onCat);
    return () => window.removeEventListener("rx-search-category", onCat);
  }, []);

  function requestLocation() {
    if (!navigator.geolocation) {
      alert("Geolocalisation non supportee par votre navigateur.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setUseLocation(true);
      },
      () => {
        // Fallback: Paris center
        setLocation({ lat: 48.8566, lng: 2.3522 });
        setUseLocation(true);
      }
    );
  }

  function open(id: string) {
    setSelectedProviderId(id);
    navigate("client-provider");
  }

  const activeCat = CATEGORIES.find((c) => c.id === category);

  return (
    <div className="flex-1 flex flex-col">
      {/* Search bar */}
      <div className="px-4 pt-3 pb-2 bg-card border-b border-border space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un prestataire..."
              className="pl-9 h-10"
            />
            {q && (
              <button
                onClick={() => setQ("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 size-6 grid place-items-center rounded-full hover:bg-accent"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10 shrink-0">
                <SlidersHorizontal className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[85%] max-w-sm">
              <SheetHeader>
                <SheetTitle>Filtres</SheetTitle>
              </SheetHeader>
              <div className="px-4 pb-6 space-y-5 mt-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                    Trier par
                  </Label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(
                      [
                        ["distance", "Distance"],
                        ["rating", "Note"],
                        ["name", "Nom"],
                      ] as [SortKey, string][]
                    ).map(([k, label]) => (
                      <button
                        key={k}
                        onClick={() => setSort(k)}
                        className={cn(
                          "text-xs rounded-lg py-2 border transition-colors",
                          sort === k
                            ? "border-primary bg-primary/10 text-primary font-medium"
                            : "border-border"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Utiliser ma position</Label>
                    <Switch
                      checked={useLocation}
                      onCheckedChange={(c) => {
                        if (c && !location) {
                          requestLocation();
                        } else {
                          setUseLocation(c);
                        }
                      }}
                    />
                  </div>
                  {useLocation && !location && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={requestLocation}
                      className="w-full"
                    >
                      <Locate className="size-4 mr-1" /> Localiser
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                    Distance max: {maxDistance === 0 ? "illimitee" : `${maxDistance} km`}
                  </Label>
                  <input
                    type="range"
                    min={0}
                    max={50}
                    step={1}
                    value={maxDistance}
                    onChange={(e) => setMaxDistance(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>0</span>
                    <span>25</span>
                    <span>50 km</span>
                  </div>
                </div>

                <Button onClick={() => setFiltersOpen(false)} className="w-full">
                  Appliquer
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Category chips */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
          <CatChip
            active={category === "all"}
            onClick={() => setCategory("all")}
            label="Tous"
          />
          {CATEGORIES.map((c) => (
            <CatChip
              key={c.id}
              active={category === c.id}
              onClick={() => setCategory(c.id)}
              label={c.label}
            />
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto slim-scrollbar px-4 py-3">
        <p className="text-xs text-muted-foreground mb-2">
          {loading ? "Recherche..." : `${providers.length} prestataire(s) trouve(s)`}
          {activeCat && ` · ${activeCat.label}`}
        </p>
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : providers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="size-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Aucun resultat</p>
            <p className="text-xs mt-1">Essayez d'autres criteres.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {providers.map((p) => {
              const Icon = categoryIcon(p.category);
              return (
                <button
                  key={p.id}
                  onClick={() => open(p.id)}
                  className="w-full text-left rounded-xl border border-border bg-card p-3 hover:shadow-sm transition-shadow"
                >
                  <div className="flex gap-3">
                    <div className="size-16 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0 overflow-hidden">
                      {p.photos[0] ? (
                         
                        <img
                          src={p.photos[0]}
                          alt={p.businessName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Icon className="size-6" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-sm truncate">{p.businessName}</p>
                        {p.distanceKm != null && (
                          <span className="text-[11px] text-primary font-medium shrink-0">
                            {p.distanceKm.toFixed(1)} km
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <MapPin className="size-3" />
                        <span className="truncate">{p.address}, {p.city}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Stars rating={p.rating} size={12} />
                        <span className="text-xs text-muted-foreground">
                          {p.rating.toFixed(1)} ({p.reviewCount})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {p.services.slice(0, 2).map((s) => (
                          <span
                            key={s.id}
                            className="text-[10px] rounded-full bg-muted px-2 py-0.5"
                          >
                            {s.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {p.services[0] && (
                    <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        A partir de
                      </span>
                      <span className="text-sm font-bold text-primary">
                        {formatPrice(
                          Math.min(...p.services.map((s) => s.price))
                        )}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function CatChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card border-border hover:bg-accent"
      )}
    >
      {label}
    </button>
  );
}
