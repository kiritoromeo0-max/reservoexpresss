"use client";

import { create } from "zustand";
import type { Role } from "./types";
import type { SessionUser } from "./api";

// The app is a single / route that mimics a mobile app with in-app screens.
// We manage navigation via a simple stack in the store.

export type Screen =
  // auth
  | "auth-login"
  | "auth-register"
  // client
  | "client-home"
  | "client-search"
  | "client-map"
  | "client-provider"
  | "client-booking"
  | "client-appointments"
  | "client-appointment-detail"
  | "client-notifications"
  | "client-profile"
  // provider
  | "provider-dashboard"
  | "provider-appointments"
  | "provider-unavailabilities"
  | "provider-stats"
  | "provider-notifications"
  | "provider-profile";

interface AppState {
  // session
  user: SessionUser | null;
  loadingSession: boolean;
  setUser: (u: SessionUser | null) => void;
  setLoadingSession: (b: boolean) => void;

  // navigation
  screen: Screen;
  history: Screen[];
  navigate: (s: Screen) => void;
  back: () => void;
  resetTo: (s: Screen) => void;

  // context params for screens
  selectedProviderId: string | null;
  setSelectedProviderId: (id: string | null) => void;
  selectedServiceId: string | null;
  setSelectedServiceId: (id: string | null) => void;
  selectedAppointmentId: string | null;
  setSelectedAppointmentId: (id: string | null) => void;
  selectedDate: string | null; // YYYY-MM-DD
  setSelectedDate: (d: string | null) => void;

  // toast helper (simple)
  toast: { message: string; type: "success" | "error" | "info" } | null;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  clearToast: () => void;

  // unread notification count (for bottom nav badge)
  _unreadCount: number;
  setUnreadCount: (n: number) => void;
}

export const useApp = create<AppState>((set, get) => ({
  user: null,
  loadingSession: true,
  setUser: (u) => set({ user: u }),
  setLoadingSession: (b) => set({ loadingSession: b }),

  screen: "auth-login",
  history: [],
  navigate: (s) =>
    set((state) => ({
      screen: s,
      history: [...state.history, state.screen],
    })),
  back: () =>
    set((state) => {
      if (state.history.length === 0) return state;
      const history = [...state.history];
      const prev = history.pop()!;
      return { screen: prev, history };
    }),
  resetTo: (s) => set({ screen: s, history: [] }),

  selectedProviderId: null,
  setSelectedProviderId: (id) => set({ selectedProviderId: id }),
  selectedServiceId: null,
  setSelectedServiceId: (id) => set({ selectedServiceId: id }),
  selectedAppointmentId: null,
  setSelectedAppointmentId: (id) => set({ selectedAppointmentId: id }),
  selectedDate: null,
  setSelectedDate: (d) => set({ selectedDate: d }),

  toast: null,
  showToast: (message, type = "info") => {
    set({ toast: { message, type } });
    setTimeout(() => set({ toast: null }), 3500);
  },
  clearToast: () => set({ toast: null }),

  _unreadCount: 0,
  setUnreadCount: (n) => set({ _unreadCount: n }),
}));

// Helper to get the default home screen for a role
export function homeScreenForRole(role: Role): Screen {
  return role === "PROVIDER" ? "provider-dashboard" : "client-home";
}
