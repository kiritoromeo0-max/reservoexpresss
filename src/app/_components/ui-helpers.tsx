"use client";

import {
  Scissors,
  Stethoscope,
  Wrench,
  Sparkles,
  Dumbbell,
  MoreHorizontal,
  Star,
  MapPin,
  Clock,
  type LucideIcon,
} from "lucide-react";

export const CATEGORIES = [
  { id: "coiffeur", label: "Coiffeur", icon: Scissors },
  { id: "medecin", label: "Medecin", icon: Stethoscope },
  { id: "garagiste", label: "Garagiste", icon: Wrench },
  { id: "esthetique", label: "Esthetique", icon: Sparkles },
  { id: "sport", label: "Sport", icon: Dumbbell },
  { id: "autre", label: "Autre", icon: MoreHorizontal },
] as const;

export function categoryIcon(cat: string): LucideIcon {
  return CATEGORIES.find((c) => c.id === cat)?.icon ?? MoreHorizontal;
}

export function categoryLabel(cat: string): string {
  return CATEGORIES.find((c) => c.id === cat)?.label ?? "Autre";
}

export { Star, MapPin, Clock };

// Format a price in West African CFA franc (XOF / FCFA).
export function formatPrice(p: number): string {
  const n = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(p));
  return `${n} FCFA`;
}

export function formatDuration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h${m.toString().padStart(2, "0")}`;
}

// Convert a UTC ISO to a local-time display string.
export function formatLocalDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatLocalDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatLocalTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "a l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `il y a ${d} j`;
  return formatLocalDate(iso);
}

// YYYY-MM-DD in local time
export function toLocalDateInput(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={
            i <= Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "fill-zinc-200 text-zinc-200"
          }
        />
      ))}
    </div>
  );
}

export function Avatar({
  name,
  color,
  size = 40,
}: {
  name: string;
  color?: string;
  size?: number;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className="rounded-full grid place-items-center font-semibold text-white shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: color || "#f59e0b",
        fontSize: size * 0.4,
      }}
    >
      {initials || "?"}
    </div>
  );
}
