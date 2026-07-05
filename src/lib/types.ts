// ReservoExpress - shared types

export type Role = "CLIENT" | "PROVIDER";

export type AppointmentStatus =
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW";

export type NotificationType =
  | "BOOKING_CONFIRMED"
  | "REMINDER_D1"
  | "BOOKING_CANCELLED"
  | "NEW_REVIEW"
  | "NEW_BOOKING";

export interface OpeningHoursDay {
  open: string; // "09:00"
  close: string; // "18:00"
  closed?: boolean;
}

// 0 = Sunday ... 6 = Saturday
export type OpeningHoursMap = Record<number, OpeningHoursDay>;

export interface ProviderPublic {
  id: string;
  businessName: string;
  category: string;
  description: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  photos: string[];
  openingHours: OpeningHoursMap;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  distanceKm?: number;
  services: ServicePublic[];
}

export interface ServicePublic {
  id: string;
  name: string;
  description: string;
  durationMin: number;
  price: number;
}

export interface AppointmentPublic {
  id: string;
  startTime: string; // ISO UTC
  endTime: string; // ISO UTC
  status: AppointmentStatus;
  notes: string | null;
  depositPaid: number;
  cancelReason: string | null;
  createdAt: string;
  service: ServicePublic;
  provider: {
    id: string;
    businessName: string;
    address: string;
    city: string;
    category: string;
  };
  client?: {
    id: string;
    name: string;
    phone: string | null;
    avatarColor: string;
  };
  review?: {
    id: string;
    rating: number;
    comment: string;
  } | null;
}

export interface SlotPublic {
  start: string; // ISO UTC
  end: string; // ISO UTC
  label: string; // local display label
}

export interface UnavailabilityPublic {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface NotificationPublic {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface ReviewPublic {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  clientName: string;
  serviceName: string;
}
