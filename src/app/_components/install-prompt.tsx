"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Shows an "Install the app" banner when the browser fires
// beforeinstallprompt (i.e. the PWA is installable).
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Respect previously dismissed sessions (per session storage)
    if (sessionStorage.getItem("rx-install-dismissed") === "1") return;

    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    }
    function onInstalled() {
      setVisible(false);
      setDeferred(null);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "dismissed") {
      setDismissed(true);
      sessionStorage.setItem("rx-install-dismissed", "1");
    }
    setVisible(false);
    setDeferred(null);
  }

  function dismiss() {
    setVisible(false);
    setDismissed(true);
    sessionStorage.setItem("rx-install-dismissed", "1");
  }

  if (!visible || dismissed) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[200] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pointer-events-none">
      <div className="mx-auto max-w-[420px] pointer-events-auto rounded-2xl bg-zinc-900 text-white shadow-2xl border border-white/10 p-3 flex items-center gap-3 animate-in slide-in-from-bottom-4">
        <div className="size-10 rounded-xl bg-amber-500 grid place-items-center shrink-0">
          <Download className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Installer ReservoExpress</p>
          <p className="text-xs text-white/70">
            Accedez-y comme une appli, meme hors-ligne.
          </p>
        </div>
        <Button
          size="sm"
          onClick={install}
          className="bg-amber-500 hover:bg-amber-600 text-white shrink-0"
        >
          Installer
        </Button>
        <button
          onClick={dismiss}
          className="size-7 rounded-full hover:bg-white/10 grid place-items-center shrink-0"
          aria-label="Fermer"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
