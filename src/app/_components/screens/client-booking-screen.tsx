"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useApp } from "@/lib/store";
import type { ProviderPublic, SlotPublic } from "@/lib/types";
import {
  categoryIcon,
  formatDuration,
  formatPrice,
  formatLocalTime,
  toLocalDateInput,
} from "../ui-helpers";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CalendarDays, Clock, MapPin, Check, Loader2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";

export function ClientBookingScreen() {
  const providerId = useApp((s) => s.selectedProviderId)!;
  const serviceId = useApp((s) => s.selectedServiceId)!;
  const initialDate = useApp((s) => s.selectedDate);
  const navigate = useApp((s) => s.navigate);
  const back = useApp((s) => s.back);
  const showToast = useApp((s) => s.showToast);

  const [provider, setProvider] = useState<ProviderPublic | null>(null);
  const [date, setDate] = useState<Date>(
    initialDate ? new Date(initialDate + "T00:00:00") : new Date()
  );
  const [slots, setSlots] = useState<SlotPublic[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<SlotPublic | null>(null);
  const [notes, setNotes] = useState("");
  const [deposit, setDeposit] = useState(false);
  const [booking, setBooking] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const service = useMemo(
    () => provider?.services.find((s) => s.id === serviceId) ?? null,
    [provider, serviceId]
  );

  useEffect(() => {
    (async () => {
      const { provider } = await api.getProvider(providerId);
      setProvider(provider);
    })();
  }, [providerId]);

  // Fetch slots whenever provider/date/service changes
  useEffect(() => {
    if (!provider) return;
    setSelectedSlot(null);
    setLoadingSlots(true);
    const dateStr = toLocalDateInput(date);
    api
      .getSlots(providerId, serviceId, dateStr)
      .then((r) => setSlots(r.slots))
      .finally(() => setLoadingSlots(false));
  }, [provider, providerId, serviceId, date]);

  async function confirm() {
    if (!selectedSlot) return;
    setBooking(true);
    try {
      const appt = await api.createAppointment({
        providerId,
        serviceId,
        startTime: selectedSlot.start,
        notes: notes || undefined,
        depositPaid: deposit && service ? service.price * 0.2 : 0,
      });
      showToast("Reservation confirmee !", "success");
      // Go to appointment detail
      useApp.getState().setSelectedAppointmentId(appt.appointment.id);
      useApp.getState().resetTo("client-appointments");
      setTimeout(() => {
        useApp.getState().setSelectedAppointmentId(appt.appointment.id);
        useApp.getState().navigate("client-appointment-detail");
      }, 100);
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : "Erreur lors de la reservation",
        "error"
      );
      // refresh slots in case of conflict
      setLoadingSlots(true);
      const dateStr = toLocalDateInput(date);
      api
        .getSlots(providerId, serviceId, dateStr)
        .then((r) => setSlots(r.slots))
        .finally(() => setLoadingSlots(false));
    } finally {
      setBooking(false);
    }
  }

  if (!provider || !service) {
    return (
      <div className="flex-1 grid place-items-center">
        <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const Icon = categoryIcon(provider.category);
  const depositAmount = service.price * 0.2;

  return (
    <div className="flex-1 flex flex-col">
      {/* Provider summary */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-3 bg-card">
        <div className="size-11 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0 overflow-hidden">
          {provider.photos[0] ? (
             
            <img src={provider.photos[0]} alt="" className="w-full h-full object-cover" />
          ) : (
            <Icon className="size-5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{provider.businessName}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="size-3" /> {provider.city}
          </p>
        </div>
      </div>

      {/* Service summary */}
      <div className="px-4 py-3 bg-primary/5 border-b border-primary/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">{service.name}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
              <span className="flex items-center gap-1">
                <Clock className="size-3" /> {formatDuration(service.durationMin)}
              </span>
            </div>
          </div>
          <p className="text-lg font-bold text-primary">{formatPrice(service.price)}</p>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="px-4 py-2 flex items-center gap-2 border-b border-border bg-card">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex items-center gap-2 flex-1">
            <div
              className={cn(
                "size-6 rounded-full grid place-items-center text-xs font-bold transition-colors",
                step >= n
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {step > n ? <Check className="size-3" /> : n}
            </div>
            {n < 3 && (
              <div
                className={cn(
                  "h-0.5 flex-1 rounded-full",
                  step > n ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto slim-scrollbar px-4 md:px-8 py-4">
        <div className="mx-auto max-w-2xl">
        {/* Step 1: Date */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <CalendarDays className="size-5 text-primary" /> Choisissez une date
            </h2>
            <div className="rounded-xl border border-border p-2 bg-card flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                locale={undefined}
                className="mx-auto"
              />
            </div>
            {/* Quick day chips */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {Array.from({ length: 7 }).map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() + i + 1);
                const active =
                  date.toDateString() === d.toDateString();
                return (
                  <button
                    key={i}
                    onClick={() => setDate(d)}
                    className={cn(
                      "shrink-0 flex flex-col items-center gap-0.5 rounded-xl border px-3 py-2 min-w-[52px] transition-colors",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card"
                    )}
                  >
                    <span className="text-[10px] uppercase">
                      {d.toLocaleDateString("fr-FR", { weekday: "short" })}
                    </span>
                    <span className="text-sm font-bold">{d.getDate()}</span>
                  </button>
                );
              })}
            </div>
            <Button className="w-full" onClick={() => setStep(2)}>
              Continuer <ChevronRight className="size-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Step 2: Slot */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2">
                <Clock className="size-5 text-primary" /> Choisissez un creneau
              </h2>
              <button
                onClick={() => setStep(1)}
                className="text-xs text-primary font-medium"
              >
                Changer la date
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {date.toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
            {loadingSlots ? (
              <div className="grid place-items-center py-10">
                <Loader2 className="size-6 animate-spin text-primary" />
              </div>
            ) : slots.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Clock className="size-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Aucun creneau disponible</p>
                <p className="text-xs mt-1">Essayez une autre date.</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {slots.map((slot) => {
                  const active = selectedSlot?.start === slot.start;
                  return (
                    <button
                      key={slot.start}
                      onClick={() => setSelectedSlot(slot)}
                      className={cn(
                        "rounded-lg py-2 text-sm font-medium border transition-colors",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card hover:border-primary/40"
                      )}
                    >
                      {formatLocalTime(slot.start)}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                Retour
              </Button>
              <Button
                className="flex-1"
                disabled={!selectedSlot}
                onClick={() => setStep(3)}
              >
                Continuer
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Check className="size-5 text-primary" /> Confirmation
            </h2>

            <div className="rounded-xl border border-border bg-card p-3 space-y-2 text-sm">
              <Row label="Prestataire" value={provider.businessName} />
              <Row label="Service" value={service.name} />
              <Row
                label="Date"
                value={date.toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              />
              <Row
                label="Heure"
                value={selectedSlot ? formatLocalTime(selectedSlot.start) : "-"}
              />
              <Row label="Duree" value={formatDuration(service.durationMin)} />
              <div className="border-t border-border my-1" />
              <Row
                label="Prix"
                value={formatPrice(service.price)}
                bold
              />
            </div>

            {/* Deposit (nice-to-have) */}
            <div className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <Label className="text-sm font-medium">
                    Acompte (20%)
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Regler {formatPrice(depositAmount)} maintenant pour garantir
                    votre creneau. Simulation, aucun paiement reel.
                  </p>
                </div>
                <Switch checked={deposit} onCheckedChange={setDeposit} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes pour le prestataire (optionnel)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Ex: coupe degradee, info medicale..."
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                Retour
              </Button>
              <Button
                className="flex-1"
                disabled={booking || !selectedSlot}
                onClick={confirm}
              >
                {booking ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" /> Reservation...
                  </>
                ) : (
                  <>Confirmer la reservation</>
                )}
              </Button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn(bold && "font-bold text-base text-primary")}>{value}</span>
    </div>
  );
}
