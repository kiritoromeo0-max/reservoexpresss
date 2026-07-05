// ReservoExpress - frontend API client

import type {
  ProviderPublic,
  ServicePublic,
  AppointmentPublic,
  SlotPublic,
  UnavailabilityPublic,
  NotificationPublic,
  ReviewPublic,
  Role,
} from "./types";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone: string | null;
  avatarColor: string;
  providerId: string | null;
  provider?: { id: string; businessName: string; category: string } | null;
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = `Erreur ${res.status}`;
    try {
      const data = await res.json();
      msg = data.error || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // ---- Auth ----
  me: () => fetch("/api/auth/me").then((r) => handle<{ user: SessionUser | null }>(r)),
  login: (email: string, password: string) =>
    fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }).then((r) => handle<{ user: SessionUser }>(r)),
  register: (data: {
    email: string;
    password: string;
    name: string;
    role: Role;
    phone?: string;
    businessName?: string;
    category?: string;
    address?: string;
    city?: string;
    description?: string;
    lat?: number;
    lng?: number;
  }) =>
    fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => handle<{ user: SessionUser }>(r)),
  logout: () => fetch("/api/auth/logout", { method: "POST" }).then((r) => handle(r)),

  // ---- Providers ----
  listProviders: (params: {
    category?: string;
    q?: string;
    lat?: number;
    lng?: number;
    maxDistance?: number;
    sort?: string;
  }) => {
    const sp = new URLSearchParams();
    if (params.category) sp.set("category", params.category);
    if (params.q) sp.set("q", params.q);
    if (params.lat != null) sp.set("lat", String(params.lat));
    if (params.lng != null) sp.set("lng", String(params.lng));
    if (params.maxDistance != null) sp.set("maxDistance", String(params.maxDistance));
    if (params.sort) sp.set("sort", params.sort);
    return fetch(`/api/providers?${sp.toString()}`).then((r) =>
      handle<{ providers: (ProviderPublic & { distanceKm?: number })[] }>(r)
    );
  },
  getProvider: (id: string) =>
    fetch(`/api/providers/${id}`).then((r) => handle<{ provider: ProviderPublic }>(r)),
  getSlots: (providerId: string, serviceId: string, date: string) =>
    fetch(
      `/api/providers/${providerId}/slots?serviceId=${serviceId}&date=${date}`
    ).then((r) => handle<{ slots: SlotPublic[]; serviceDurationMin: number }>(r)),
  getReviews: (providerId: string) =>
    fetch(`/api/providers/${providerId}/reviews`).then((r) =>
      handle<{ reviews: ReviewPublic[] }>(r)
    ),

  // ---- Appointments (client) ----
  createAppointment: (data: {
    providerId: string;
    serviceId: string;
    startTime: string;
    notes?: string;
    depositPaid?: number;
  }) =>
    fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => handle<{ appointment: AppointmentPublic }>(r)),
  listAppointments: (scope: "upcoming" | "past") =>
    fetch(`/api/appointments?scope=${scope}`).then((r) =>
      handle<{ appointments: AppointmentPublic[] }>(r)
    ),
  cancelAppointment: (id: string, reason?: string) =>
    fetch(`/api/appointments/${id}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    }).then((r) => handle<{ appointment: AppointmentPublic }>(r)),
  reviewAppointment: (id: string, rating: number, comment: string) =>
    fetch(`/api/appointments/${id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, comment }),
    }).then((r) => handle<{ review: ReviewPublic }>(r)),

  // ---- Provider ----
  providerDashboard: () =>
    fetch("/api/provider/dashboard").then((r) =>
      handle<{
        today: AppointmentPublic[];
        week: AppointmentPublic[];
        counts: { today: number; week: number; unavailabilities: number };
      }>(r)
    ),
  providerAppointments: (scope: "upcoming" | "past" | "all") =>
    fetch(`/api/provider/appointments?scope=${scope}`).then((r) =>
      handle<{ appointments: AppointmentPublic[] }>(r)
    ),
  listUnavailabilities: () =>
    fetch("/api/provider/unavailabilities").then((r) =>
      handle<{ unavailabilities: UnavailabilityPublic[] }>(r)
    ),
  createUnavailability: (data: {
    startDate: string;
    endDate: string;
    reason?: string;
  }) =>
    fetch("/api/provider/unavailabilities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) =>
      handle<{ unavailability: UnavailabilityPublic; cancelledAppointments: number }>(r)
    ),
  deleteUnavailability: (id: string) =>
    fetch(`/api/provider/unavailabilities/${id}`, { method: "DELETE" }).then((r) =>
      handle(r)
    ),
  providerStats: () =>
    fetch("/api/provider/stats").then((r) =>
      handle<{
        occupancyRate: number;
        bookedMinWeek: number;
        availableMinWeek: number;
        totalAppointments: number;
        totalRevenue: number;
        avgRating: number;
        reviewCount: number;
        popularServices: { name: string; count: number; revenue: number }[];
        revenueByDay: { day: string; revenue: number; count: number }[];
      }>(r)
    ),

  // ---- Notifications ----
  listNotifications: () =>
    fetch("/api/notifications").then((r) =>
      handle<{ notifications: NotificationPublic[]; unreadCount: number }>(r)
    ),
  markNotificationsRead: (id?: string, all?: boolean) =>
    fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, all }),
    }).then((r) => handle(r)),
};

export type { ServicePublic };
