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
  formatLocalDate,
} from "../ui-helpers";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  CalendarDays,
  Clock,
  MapPin,
  Phone,
  Star,
  CheckCircle2,
  XCircle,
  Banknote,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function ClientAppointmentDetailScreen() {
  const id = useApp((s) => s.selectedAppointmentId)!;
  const navigate = useApp((s) => s.navigate);
  const resetTo = useApp((s) => s.resetTo);
  const showToast = useApp((s) => s.showToast);

  const [appt, setAppt] = useState<AppointmentPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  // review form
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchDetail();
     
  }, [id]);

  async function fetchDetail() {
    try {
      const res = await fetch(`/api/appointments/${id}`);
      const data = await res.json();
      setAppt(data.appointment);
    } finally {
      setLoading(false);
    }
  }

  async function cancel() {
    if (!appt) return;
    setCancelling(true);
    try {
      const { appointment } = await api.cancelAppointment(
        appt.id,
        cancelReason || undefined
      );
      setAppt(appointment);
      showToast("RDV annule.", "success");
      setCancelReason("");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Erreur", "error");
    } finally {
      setCancelling(false);
    }
  }

  async function submitReview() {
    if (!appt || rating < 1) return;
    setSubmittingReview(true);
    try {
      await api.reviewAppointment(appt.id, rating, comment);
      showToast("Merci pour votre avis !", "success");
      await fetchDetail();
      setRating(0);
      setComment("");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Erreur", "error");
    } finally {
      setSubmittingReview(false);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 grid place-items-center">
        <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }
  if (!appt) {
    return (
      <div className="flex-1 grid place-items-center text-muted-foreground p-6 text-center">
        RDV introuvable.
      </div>
    );
  }

  const Icon = categoryIcon(appt.provider.category);
  const cancelled = appt.status === "CANCELLED";
  const completed = appt.status === "COMPLETED";
  const confirmed = appt.status === "CONFIRMED";

  // Cancellation policy: at least 24h before
  const msUntil = new Date(appt.startTime).getTime() - Date.now();
  const canCancel = confirmed && msUntil >= 24 * 60 * 60 * 1000;
  const canReview = completed && !appt.review;

  return (
    <div className="flex-1 overflow-y-auto slim-scrollbar pb-6">
      {/* Status banner */}
      <div
        className={cn(
          "px-5 py-4 text-center",
          cancelled
            ? "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300"
            : completed
            ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
            : "bg-primary/10 text-primary"
        )}
      >
        {cancelled ? (
          <p className="font-semibold flex items-center justify-center gap-2">
            <XCircle className="size-5" /> RDV annule
          </p>
        ) : completed ? (
          <p className="font-semibold flex items-center justify-center gap-2">
            <CheckCircle2 className="size-5" /> RDV termine
          </p>
        ) : (
          <p className="font-semibold flex items-center justify-center gap-2">
            <CalendarDays className="size-5" /> RDV confirme
          </p>
        )}
        {cancelled && appt.cancelReason && (
          <p className="text-xs mt-1 opacity-80">Motif: {appt.cancelReason}</p>
        )}
      </div>

      {/* Provider card */}
      <button
        onClick={() => {
          useApp.getState().setSelectedProviderId(appt.provider.id);
          navigate("client-provider");
        }}
        className="w-full text-left px-4 py-3 flex items-center gap-3 border-b border-border hover:bg-accent/50"
      >
        <div className="size-12 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
          <Icon className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{appt.provider.businessName}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="size-3" /> {appt.provider.address}, {appt.provider.city}
          </p>
        </div>
      </button>

      {/* Appointment details */}
      <div className="px-4 py-4 space-y-3">
        <div className="rounded-xl border border-border bg-card divide-y divide-border">
          <DetailRow
            icon={<CalendarDays className="size-4 text-primary" />}
            label="Date"
            value={formatLocalDate(appt.startTime)}
          />
          <DetailRow
            icon={<Clock className="size-4 text-primary" />}
            label="Heure"
            value={`${formatLocalTime(appt.startTime)} - ${formatLocalTime(appt.endTime)}`}
          />
          <DetailRow
            icon={<Star className="size-4 text-primary" />}
            label="Service"
            value={appt.service.name}
          />
          <DetailRow
            icon={<Clock className="size-4 text-primary" />}
            label="Duree"
            value={formatDuration(appt.service.durationMin)}
          />
          <DetailRow
            icon={<Banknote className="size-4 text-primary" />}
            label="Prix"
            value={formatPrice(appt.service.price)}
            bold
          />
          {appt.depositPaid > 0 && (
            <DetailRow
              icon={<Banknote className="size-4 text-primary" />}
              label="Acompte verse"
              value={formatPrice(appt.depositPaid)}
            />
          )}
          {appt.notes && (
            <div className="px-3 py-2.5">
              <p className="text-xs text-muted-foreground mb-0.5">Vos notes</p>
              <p className="text-sm">{appt.notes}</p>
            </div>
          )}
        </div>

        {/* Review section */}
        {appt.review && (
          <div className="rounded-xl border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground mb-1">Votre avis</p>
            <div className="flex items-center gap-1 mb-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={cn(
                    "size-4",
                    i <= appt.review!.rating
                      ? "fill-amber-400 text-amber-400"
                      : "fill-zinc-200 text-zinc-200"
                  )}
                />
              ))}
            </div>
            {appt.review.comment && (
              <p className="text-sm text-foreground/90">{appt.review.comment}</p>
            )}
          </div>
        )}

        {canReview && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-3">
            <p className="font-semibold text-sm">Laisser un avis</p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  onMouseEnter={() => setHoverRating(i)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(i)}
                >
                  <Star
                    className={cn(
                      "size-7 transition-colors",
                      i <= (hoverRating || rating)
                        ? "fill-amber-400 text-amber-400"
                        : "fill-zinc-200 text-zinc-200"
                    )}
                  />
                </button>
              ))}
            </div>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              placeholder="Partagez votre experience..."
            />
            <Button
              className="w-full"
              disabled={rating < 1 || submittingReview}
              onClick={submitReview}
            >
              {submittingReview ? "Envoi..." : "Publier mon avis"}
            </Button>
          </div>
        )}

        {/* Cancel button */}
        {confirmed && (
          <>
            {canCancel ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
                  >
                    Annuler le RDV
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Annuler ce rendez-vous ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      L'annulation est possible jusqu'a J-1. Le prestataire sera
                      notifie.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <Textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    rows={2}
                    placeholder="Motif (optionnel)"
                  />
                  <AlertDialogFooter>
                    <AlertDialogCancel>Retour</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={cancel}
                      disabled={cancelling}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {cancelling ? "Annulation..." : "Confirmer l'annulation"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-3 text-xs text-amber-800 dark:text-amber-300">
                L'annulation n'est plus possible a moins de 24h du RDV.
                Contactez directement le prestataire si besoin.
              </div>
            )}
          </>
        )}

        <Button
          variant="ghost"
          className="w-full"
          onClick={() => resetTo("client-appointments")}
        >
          Retour a la liste
        </Button>
      </div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
  bold,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="px-3 py-2.5 flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon} {label}
      </span>
      <span className={cn("text-sm text-right", bold && "font-bold text-primary text-base")}>
        {value}
      </span>
    </div>
  );
}
