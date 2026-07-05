// ReservoExpress - Slot calculation algorithm
//
// Given a provider's opening hours, existing appointments, unavailabilities,
// and a service duration, compute the list of free time slots for a given date.
//
// All datetimes are handled in UTC internally; the algorithm operates on a
// given "local day" of the provider (defined by the provider's opening hours).
//
// Rules:
//  - A slot starts at or after opening time, ends at or before closing time.
//  - Slots are aligned to a fixed step (default 15 min) starting from open.
//  - A slot is blocked if it overlaps any existing appointment.
//  - A slot is blocked if it overlaps any unavailability.
//  - A slot is blocked if it is in the past (relative to "now").
//  - Slot end must not exceed closing time.
//
// This module is pure and unit-testable.

import type { OpeningHoursMap, AppointmentPublic, UnavailabilityPublic, SlotPublic } from "./types";

export interface SlotComputeInput {
  // The date to compute slots for, as a Date at local midnight (provider tz).
  // We accept a Date and use its year/month/day.
  date: Date;
  // Provider opening hours map (weekday 0..6).
  openingHours: OpeningHoursMap;
  // Service duration in minutes.
  durationMin: number;
  // Existing appointments (UTC ISO start/end).
  appointments: { startTime: string; endTime: string }[];
  // Provider unavailabilities (UTC ISO start/end).
  unavailabilities: { startDate: string; endDate: string }[];
  // Provider's UTC offset in minutes at the given date (for tz correctness).
  // If omitted, we treat the Date's wall-clock as the provider's local time.
  providerOffsetMin?: number;
  // Alignment step in minutes (default 15).
  stepMin?: number;
  // Reference "now" for past-slot filtering (default new Date()).
  now?: Date;
}

// Helper: parse "HH:MM" -> minutes since midnight
function parseHHMM(s: string): number {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
}

// Helper: build a UTC Date for a given local-day (year, month, day) and minute offset.
// We construct using Date.UTC so the algorithm is deterministic and tz-stable.
function makeUTC(year: number, month: number, day: number, minutes: number): Date {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return new Date(Date.UTC(year, month, day, h, m, 0, 0));
}

/**
 * Compute available slots for a provider on a given date.
 *
 * The algorithm:
 * 1. Determine the weekday (0..6) of the given date.
 * 2. Look up opening hours for that weekday; if closed, return [].
 * 3. Generate candidate slots from open -> close, stepping by stepMin,
 *    each slot lasting durationMin.
 * 4. Filter out slots that:
 *      - end after closing
 *      - are in the past (slot.start <= now)
 *      - overlap any existing appointment
 *      - overlap any unavailability
 * 5. Return the surviving slots.
 *
 * Overlap test: two intervals [a1,a2) and [b1,b2) overlap iff a1 < b2 && b1 < a2.
 */
export function computeAvailableSlots(input: SlotComputeInput): SlotPublic[] {
  const {
    date,
    openingHours,
    durationMin,
    appointments,
    unavailabilities,
    stepMin = 15,
    now = new Date(),
  } = input;

  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const weekday = date.getDay(); // 0..6 (0=Sun)

  const dayHours = openingHours[weekday];
  if (!dayHours || dayHours.closed || !dayHours.open || !dayHours.close) {
    return [];
  }

  const openMin = parseHHMM(dayHours.open);
  const closeMin = parseHHMM(dayHours.close);
  if (closeMin <= openMin) return [];

  // Build candidate slots
  const candidates: { start: Date; end: Date }[] = [];
  for (let t = openMin; t + durationMin <= closeMin; t += stepMin) {
    const start = makeUTC(year, month, day, t);
    const end = makeUTC(year, month, day, t + durationMin);
    candidates.push({ start, end });
  }

  // Normalize appointment & unavailability intervals to Date ranges
  const apptRanges = appointments.map((a) => ({
    start: new Date(a.startTime),
    end: new Date(a.endTime),
  }));
  const unavailRanges = unavailabilities.map((u) => ({
    start: new Date(u.startDate),
    end: new Date(u.endDate),
  }));

  const nowMs = now.getTime();

  const result: SlotPublic[] = [];
  for (const c of candidates) {
    // Past filter
    if (c.start.getTime() <= nowMs) continue;

    // Overlap with appointments
    if (apptRanges.some((r) => overlaps(c.start, c.end, r.start, r.end))) continue;
    // Overlap with unavailabilities
    if (unavailRanges.some((r) => overlaps(c.start, c.end, r.start, r.end))) continue;

    result.push({
      start: c.start.toISOString(),
      end: c.end.toISOString(),
      label: formatSlotLabel(c.start),
    });
  }
  return result;
}

// Half-open interval overlap test.
function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart.getTime() < bEnd.getTime() && bStart.getTime() < aEnd.getTime();
}

// Format a slot's start time for display: "HH:MM" in UTC (client converts to local).
// We keep the raw UTC hour:minute here; the client displays local time.
export function formatSlotLabel(d: Date): string {
  const h = d.getUTCHours().toString().padStart(2, "0");
  const m = d.getUTCMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Validate that a proposed booking does not conflict.
 * Used at booking time to prevent double-booking (server-side transactional check).
 */
export function isSlotBookable(
  start: Date,
  end: Date,
  durationMin: number,
  openingHours: OpeningHoursMap,
  appointments: { startTime: string; endTime: string }[],
  unavailabilities: { startDate: string; endDate: string }[],
  now: Date = new Date()
): { ok: boolean; reason?: string } {
  // Past check
  if (start.getTime() <= now.getTime()) {
    return { ok: false, reason: "Ce creneau est dans le passe." };
  }
  // Duration check
  const actualDur = (end.getTime() - start.getTime()) / 60000;
  if (Math.abs(actualDur - durationMin) > 1) {
    return { ok: false, reason: "Duree du creneau invalide." };
  }
  // Weekday + opening hours check
  const weekday = start.getDay();
  const dayHours = openingHours[weekday];
  if (!dayHours || dayHours.closed || !dayHours.open || !dayHours.close) {
    return { ok: false, reason: "Le prestataire est ferme ce jour." };
  }
  const openMin = parseHHMM(dayHours.open);
  const closeMin = parseHHMM(dayHours.close);
  const startMin = start.getHours() * 60 + start.getMinutes();
  const endMin = end.getHours() * 60 + end.getMinutes();
  if (startMin < openMin || endMin > closeMin) {
    return { ok: false, reason: "Le creneau est en dehors des horaires d'ouverture." };
  }
  // Conflict with appointments
  for (const a of appointments) {
    if (overlaps(start, end, new Date(a.startTime), new Date(a.endTime))) {
      return { ok: false, reason: "Ce creneau vient d'etre reserve." };
    }
  }
  // Conflict with unavailabilities
  for (const u of unavailabilities) {
    if (overlaps(start, end, new Date(u.startDate), new Date(u.endDate))) {
      return { ok: false, reason: "Le prestataire est indisponible a ce moment." };
    }
  }
  return { ok: true };
}

// Haversine distance in km between two lat/lng points.
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
