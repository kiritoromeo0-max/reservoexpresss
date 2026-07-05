"use client";

import { useApp } from "@/lib/store";
import { CheckCircle2, XCircle, Info } from "lucide-react";

export function ToastBubble() {
  const toast = useApp((s) => s.toast);
  if (!toast) return null;
  const Icon =
    toast.type === "success" ? CheckCircle2 : toast.type === "error" ? XCircle : Info;
  const color =
    toast.type === "success"
      ? "bg-emerald-600 text-white"
      : toast.type === "error"
      ? "bg-red-600 text-white"
      : "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900";
  return (
    <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[100] px-4 w-full md:w-auto md:max-w-[380px]">
      <div
        className={`${color} rounded-xl shadow-lg px-4 py-3 flex items-center gap-3 text-sm font-medium animate-in slide-in-from-bottom-2`}
      >
        <Icon className="size-5 shrink-0" />
        <span className="flex-1">{toast.message}</span>
      </div>
    </div>
  );
}
