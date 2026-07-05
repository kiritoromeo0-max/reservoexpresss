"use client";

import { useEffect } from "react";

// Registers the service worker for PWA installability + offline app shell.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") {
      // Still register in dev so the app is installable in the preview.
    }
    const onLoad = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((err) => {
          console.warn("SW registration failed:", err);
        });
    };
    window.addEventListener("load", onLoad);
    // Also try immediately in case load already fired.
    onLoad();
    return () => window.removeEventListener("load", onLoad);
  }, []);
  return null;
}
