"use client";

import { ReactNode } from "react";

// A phone-frame wrapper: on mobile it fills the screen, on desktop it shows
// a centered phone mockup. max-w to keep the "mobile app" feel.
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative w-full h-[100dvh] md:h-[860px] md:max-w-[420px] bg-background md:rounded-[2.5rem] md:border-[10px] md:border-zinc-900 md:phone-shadow overflow-hidden flex flex-col">
      {/* Status bar (desktop only, decorative) */}
      <div className="hidden md:flex items-center justify-between px-6 py-2 text-[11px] font-medium text-zinc-600 dark:text-zinc-300 bg-background border-b border-border/50">
        <span>9:41</span>
        <div className="flex items-center gap-1">
          <span className="text-[10px]">●●●●</span>
          <span>📶</span>
          <span>🔋</span>
        </div>
      </div>
      {children}
    </div>
  );
}
