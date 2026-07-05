"use client";

import { useEffect } from "react";
import { useApp, homeScreenForRole } from "@/lib/store";
import { api } from "@/lib/api";
import { Toaster } from "@/components/ui/toaster";
import { PhoneFrame } from "./_components/phone-frame";
import { ScreenRouter } from "./_components/screen-router";
import { ToastBubble } from "./_components/toast-bubble";
import { AuthGate } from "./_components/auth-gate";
import { ServiceWorkerRegister } from "./_components/sw-register";
import { InstallPrompt } from "./_components/install-prompt";

export default function Home() {
  const user = useApp((s) => s.user);
  const loadingSession = useApp((s) => s.loadingSession);
  const setUser = useApp((s) => s.setUser);
  const setLoadingSession = useApp((s) => s.setLoadingSession);
  const resetTo = useApp((s) => s.resetTo);

  // Bootstrap session on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { user } = await api.me();
        if (!mounted) return;
        if (user) {
          setUser(user);
          resetTo(homeScreenForRole(user.role));
        }
      } catch {
        // ignore
      } finally {
        if (mounted) setLoadingSession(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [setUser, setLoadingSession, resetTo]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start bg-gradient-to-b from-amber-50 via-orange-50 to-amber-100/40 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      {/* Top brand bar (desktop only decoration) */}
      <div className="hidden md:flex w-full items-center justify-between px-8 py-4">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-xl bg-primary text-primary-foreground grid place-items-center font-bold">
            R
          </div>
          <span className="font-semibold text-lg">ReservoExpress</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Reservez un creneau chez un prestataire local en 3 taps
        </p>
      </div>

      <div className="flex-1 w-full flex items-center justify-center py-4 md:py-8">
        <PhoneFrame>
          {loadingSession ? (
            <div className="flex-1 grid place-items-center">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <div className="size-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <p className="text-sm">Chargement...</p>
              </div>
            </div>
          ) : !user ? (
            <AuthGate />
          ) : (
            <ScreenRouter />
          )}
        </PhoneFrame>
      </div>

      <ToastBubble />
      <InstallPrompt />
      <ServiceWorkerRegister />
      <Toaster />
    </div>
  );
}
