"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useApp } from "@/lib/store";
import type { UnavailabilityPublic } from "@/lib/types";
import { formatLocalDate, formatLocalDateTime } from "../ui-helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CalendarX2,
  Plus,
  Trash2,
  AlertTriangle,
  Loader2,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function ProviderUnavailabilitiesScreen() {
  const showToast = useApp((s) => s.showToast);
  const [items, setItems] = useState<UnavailabilityPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // form
  const todayStr = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [allDay, setAllDay] = useState(true);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch();
  }, []);

  async function fetch() {
    setLoading(true);
    try {
      const { unavailabilities } = await api.listUnavailabilities();
      setItems(unavailabilities);
    } finally {
      setLoading(false);
    }
  }

  async function create() {
    setSubmitting(true);
    try {
      let startISO: string;
      let endISO: string;
      if (allDay) {
        startISO = new Date(startDate + "T00:00:00").toISOString();
        endISO = new Date(endDate + "T23:59:59").toISOString();
      } else {
        startISO = new Date(startDate + "T" + startTime + ":00").toISOString();
        endISO = new Date(endDate + "T" + endTime + ":00").toISOString();
      }
      const { cancelledAppointments } = await api.createUnavailability({
        startDate: startISO,
        endDate: endISO,
        reason: reason || undefined,
      });
      showToast(
        cancelledAppointments > 0
          ? `Indisponibilite ajoutee. ${cancelledAppointments} RDV annule(s) automatiquement.`
          : "Indisponibilite ajoutee.",
        "success"
      );
      setOpen(false);
      setReason("");
      await fetch();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Erreur", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id: string) {
    try {
      await api.deleteUnavailability(id);
      showToast("Indisponibilite supprimee.", "success");
      await fetch();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Erreur", "error");
    }
  }

  const isPast = (iso: string) => new Date(iso).getTime() < Date.now();

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Indisponibilites</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Conges, pauses, fermetures exceptionnelles
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="size-4 mr-1" /> Ajouter
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[90%]">
            <DialogHeader>
              <DialogTitle>Nouvelle indisponibilite</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 px-1 pb-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="allday">Journee entiere</Label>
                <button
                  role="switch"
                  aria-checked={allDay}
                  onClick={() => setAllDay((v) => !v)}
                  className={cn(
                    "relative h-6 w-11 rounded-full transition-colors",
                    allDay ? "bg-primary" : "bg-muted"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 size-5 rounded-full bg-white transition-transform",
                      allDay ? "translate-x-5" : "translate-x-0.5"
                    )}
                  />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="sd">Du</Label>
                  <Input
                    id="sd"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ed">Au</Label>
                  <Input
                    id="ed"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
              {!allDay && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="st">Heure debut</Label>
                    <Input
                      id="st"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="et">Heure fin</Label>
                    <Input
                      id="et"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>
              )}
              <div className="space-y-1">
                <Label htmlFor="rsn">Motif (optionnel)</Label>
                <Input
                  id="rsn"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Conges, formation..."
                />
              </div>
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-2.5 text-xs text-amber-800 dark:text-amber-300 flex gap-2">
                <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                <span>
                  Les RDV confirmes chevauchant cette periode seront
                  automatiquement annules et les clients notifies.
                </span>
              </div>
              <Button
                className="w-full"
                onClick={create}
                disabled={submitting}
              >
                {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
                Confirmer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 overflow-y-auto slim-scrollbar px-4 py-2 pb-6">
        {loading ? (
          <div className="space-y-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CalendarX2 className="size-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Aucune indisponibilite</p>
            <p className="text-xs mt-1">
              Ajoutez vos conges et pauses ici.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((u) => {
              const past = isPast(u.endDate);
              return (
                <div
                  key={u.id}
                  className={cn(
                    "rounded-xl border bg-card p-3",
                    past
                      ? "border-border opacity-60"
                      : "border-amber-200 dark:border-amber-900/50"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="size-8 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 grid place-items-center shrink-0">
                          <CalendarX2 className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm">
                            {formatLocalDate(u.startDate)}
                            {u.startDate.slice(0, 10) !== u.endDate.slice(0, 10) &&
                              ` → ${formatLocalDate(u.endDate)}`}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {new Date(u.startDate).toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            -{" "}
                            {new Date(u.endDate).toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                      {u.reason && u.reason !== "Indisponible" && (
                        <p className="text-xs text-foreground/80 mt-1.5 ml-10">
                          {u.reason}
                        </p>
                      )}
                      {past && (
                        <span className="inline-block text-[10px] bg-muted text-muted-foreground rounded-full px-2 py-0.5 mt-1.5 ml-10">
                          Passé
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => remove(u.id)}
                      className="size-8 rounded-lg hover:bg-destructive/10 text-destructive grid place-items-center shrink-0"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
