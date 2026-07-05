"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useApp } from "@/lib/store";
import type { ProviderPublic, ReviewPublic } from "@/lib/types";
import {
  Stars,
  categoryIcon,
  categoryLabel,
  formatDuration,
  formatPrice,
  formatLocalDate,
  relativeTime,
} from "../ui-helpers";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, ChevronLeft, Star, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

export function ClientProviderScreen() {
  const providerId = useApp((s) => s.selectedProviderId)!;
  const navigate = useApp((s) => s.navigate);
  const back = useApp((s) => s.back);
  const setSelectedServiceId = useApp((s) => s.setSelectedServiceId);
  const setSelectedDate = useApp((s) => s.setSelectedDate);

  const [provider, setProvider] = useState<ProviderPublic | null>(null);
  const [reviews, setReviews] = useState<ReviewPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"services" | "infos" | "avis">("services");
  const [photoIdx, setPhotoIdx] = useState(0);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [p, r] = await Promise.all([
          api.getProvider(providerId),
          api.getReviews(providerId),
        ]);
        setProvider(p.provider);
        setReviews(r.reviews);
      } finally {
        setLoading(false);
      }
    })();
  }, [providerId]);

  function bookService(serviceId: string) {
    setSelectedServiceId(serviceId);
    // default date = tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const y = tomorrow.getFullYear();
    const m = (tomorrow.getMonth() + 1).toString().padStart(2, "0");
    const d = tomorrow.getDate().toString().padStart(2, "0");
    setSelectedDate(`${y}-${m}-${d}`);
    navigate("client-booking");
  }

  if (loading) {
    return (
      <div className="flex-1 grid place-items-center">
        <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="flex-1 grid place-items-center text-muted-foreground p-6 text-center">
        <div>
          <p>Prestataire introuvable.</p>
          <Button variant="link" onClick={back}>Retour</Button>
        </div>
      </div>
    );
  }

  const Icon = categoryIcon(provider.category);

  return (
    <div className="flex-1 flex flex-col">
      {/* Photo carousel */}
      <div className="relative aspect-[16/10] md:aspect-[21/9] bg-muted shrink-0 overflow-hidden md:max-h-[420px]">
        {provider.photos[photoIdx] ? (
          <img
            src={provider.photos[photoIdx]}
            alt={provider.businessName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full grid place-items-center bg-primary/10 text-primary">
            <Icon className="size-16" />
          </div>
        )}
        <button
          onClick={back}
          className="absolute top-3 left-3 size-9 rounded-full bg-black/40 text-white grid place-items-center backdrop-blur"
        >
          <ChevronLeft className="size-5" />
        </button>
        {provider.photos.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {provider.photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setPhotoIdx(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === photoIdx ? "w-5 bg-white" : "w-1.5 bg-white/50"
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Header info */}
      <div className="px-5 md:px-8 pt-4 pb-3 border-b border-border">
        <div className="mx-auto max-w-5xl flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <span className="text-[11px] uppercase tracking-wide text-primary font-semibold">
              {categoryLabel(provider.category)}
            </span>
            <h1 className="text-xl font-bold leading-tight">{provider.businessName}</h1>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <MapPin className="size-3" />
              <span className="truncate">{provider.address}, {provider.city}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="flex items-center gap-1 justify-end">
              <Star className="size-4 fill-amber-400 text-amber-400" />
              <span className="font-bold text-sm">{provider.rating.toFixed(1)}</span>
            </div>
            <span className="text-[11px] text-muted-foreground">
              {provider.reviewCount} avis
            </span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
          {provider.description}
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-border shrink-0">
        <div className="mx-auto max-w-5xl flex">
          {([
            ["services", "Services"],
            ["infos", "Infos & Horaires"],
            ["avis", `Avis (${reviews.length})`],
          ] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={cn(
                "flex-1 md:flex-none md:px-8 py-2.5 text-sm font-medium relative",
                tab === k ? "text-primary" : "text-muted-foreground"
              )}
            >
              {label}
              {tab === k && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto slim-scrollbar px-5 md:px-8 py-4">
        <div className="mx-auto max-w-5xl">
        {tab === "services" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
            {provider.services.map((s) => (
              <div
                key={s.id}
                className="rounded-xl border border-border bg-card p-3 flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{s.name}</p>
                  {s.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {s.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {formatDuration(s.durationMin)}
                    </span>
                    <span className="font-semibold text-primary text-sm">
                      {formatPrice(s.price)}
                    </span>
                  </div>
                </div>
                <Button size="sm" onClick={() => bookService(s.id)}>
                  Reserver
                </Button>
              </div>
            ))}
          </div>
        )}

        {tab === "infos" && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm mb-2">Adresse</h3>
              <div className="rounded-xl border border-border p-3 text-sm flex items-start gap-2">
                <MapPin className="size-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p>{provider.address}</p>
                  <p className="text-muted-foreground">{provider.city}</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-2">Horaires d'ouverture</h3>
              <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
                {WEEKDAYS.map((d, i) => {
                  const h = provider.openingHours[i];
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between px-3 py-2 text-sm bg-card"
                    >
                      <span className="font-medium">{d}</span>
                      {!h || h.closed ? (
                        <span className="text-muted-foreground">Ferme</span>
                      ) : (
                        <span className="text-muted-foreground">
                          {h.open} - {h.close}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("client-map")}
            >
              <MapPin className="size-4 mr-2" /> Voir sur la carte
            </Button>
          </div>
        )}

        {tab === "avis" && (
          <div className="space-y-3">
            {reviews.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="size-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Aucun avis pour le moment</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-3">
                  <div className="text-center">
                    <p className="text-3xl font-bold">{provider.rating.toFixed(1)}</p>
                    <Stars rating={provider.rating} size={12} />
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {provider.reviewCount} avis
                    </p>
                  </div>
                </div>
                {reviews.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-xl border border-border bg-card p-3"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="size-7 rounded-full bg-primary/15 text-primary grid place-items-center text-xs font-bold">
                          {r.clientName[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{r.clientName}</p>
                          {r.serviceName && (
                            <p className="text-[11px] text-muted-foreground">
                              {r.serviceName}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {relativeTime(r.createdAt)}
                      </span>
                    </div>
                    <Stars rating={r.rating} size={12} />
                    {r.comment && (
                      <p className="text-sm mt-1.5 text-foreground/90">{r.comment}</p>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
