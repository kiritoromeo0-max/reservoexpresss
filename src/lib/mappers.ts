// ReservoExpress - DB <-> public type mappers

import type {
  Appointment,
  Provider,
  Service,
  Review,
  Unavailability,
  Notification,
  User,
} from "@prisma/client";
import type {
  AppointmentPublic,
  OpeningHoursMap,
  ProviderPublic,
  ServicePublic,
  SlotPublic,
  UnavailabilityPublic,
  NotificationPublic,
  ReviewPublic,
} from "./types";

export function parseOpeningHours(raw: string): OpeningHoursMap {
  try {
    const obj = JSON.parse(raw);
    return obj as OpeningHoursMap;
  } catch {
    return {} as OpeningHoursMap;
  }
}

export function parsePhotos(raw: string): string[] {
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function mapService(s: Service): ServicePublic {
  return {
    id: s.id,
    name: s.name,
    description: s.description,
    durationMin: s.durationMin,
    price: s.price,
  };
}

export function mapProvider(
  p: Provider & { services: Service[] },
  distanceKm?: number
): ProviderPublic {
  return {
    id: p.id,
    businessName: p.businessName,
    category: p.category,
    description: p.description,
    address: p.address,
    city: p.city,
    lat: p.lat,
    lng: p.lng,
    photos: parsePhotos(p.photos),
    openingHours: parseOpeningHours(p.openingHours),
    rating: p.rating,
    reviewCount: p.reviewCount,
    isActive: p.isActive,
    distanceKm,
    services: p.services.map(mapService),
  };
}

export function mapAppointment(
  a: Appointment & {
    service: Service;
    provider: Provider;
    client?: User | null;
    review?: Review | null;
  }
): AppointmentPublic {
  return {
    id: a.id,
    startTime: a.startTime.toISOString(),
    endTime: a.endTime.toISOString(),
    status: a.status as AppointmentPublic["status"],
    notes: a.notes,
    depositPaid: a.depositPaid,
    cancelReason: a.cancelReason,
    createdAt: a.createdAt.toISOString(),
    service: mapService(a.service),
    provider: {
      id: a.provider.id,
      businessName: a.provider.businessName,
      address: a.provider.address,
      city: a.provider.city,
      category: a.provider.category,
    },
    client: a.client
      ? {
          id: a.client.id,
          name: a.client.name,
          phone: a.client.phone,
          avatarColor: a.client.avatarColor,
        }
      : undefined,
    review: a.review
      ? {
          id: a.review.id,
          rating: a.review.rating,
          comment: a.review.comment,
        }
      : null,
  };
}

export function mapUnavailability(u: Unavailability): UnavailabilityPublic {
  return {
    id: u.id,
    startDate: u.startDate.toISOString(),
    endDate: u.endDate.toISOString(),
    reason: u.reason,
  };
}

export function mapNotification(n: Notification): NotificationPublic {
  return {
    id: n.id,
    type: n.type as NotificationPublic["type"],
    title: n.title,
    message: n.message,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  };
}

export function mapReview(
  r: Review & { client?: User | null; appointment?: { service?: Service | null } | null }
): ReviewPublic {
  return {
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt.toISOString(),
    clientName: r.client?.name ?? "Client",
    serviceName: r.appointment?.service?.name ?? "",
  };
}

export type { SlotPublic };
