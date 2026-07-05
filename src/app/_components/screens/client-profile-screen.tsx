"use client";

import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import { Avatar } from "../ui-helpers";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  ChevronRight,
  Mail,
  Phone,
  CalendarDays,
  Bell,
  Info,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function ClientProfileScreen() {
  const user = useApp((s) => s.user)!;
  const setUser = useApp((s) => s.setUser);
  const resetTo = useApp((s) => s.resetTo);
  const showToast = useApp((s) => s.showToast);

  async function logout() {
    await api.logout();
    setUser(null);
    resetTo("auth-login");
    showToast("Deconnecte.", "info");
  }

  return (
    <div className="flex-1 overflow-y-auto slim-scrollbar pb-6">
      <div className="mx-auto max-w-3xl">
      {/* Profile header */}
      <div className="bg-primary text-primary-foreground px-5 pt-6 pb-8 rounded-b-3xl md:rounded-none">
        <div className="flex flex-col items-center text-center">
          <Avatar name={user.name} color={user.avatarColor} size={72} />
          <h2 className="text-lg font-bold mt-3">{user.name}</h2>
          <span className="text-xs bg-white/15 px-2.5 py-0.5 rounded-full mt-1">
            Compte Client
          </span>
        </div>
      </div>

      {/* Info card */}
      <div className="px-4 md:px-0 -mt-4">
        <div className="rounded-xl border border-border bg-card divide-y divide-border shadow-sm">
          <InfoRow
            icon={<Mail className="size-4 text-primary" />}
            label="Email"
            value={user.email}
          />
          <InfoRow
            icon={<Phone className="size-4 text-primary" />}
            label="Telephone"
            value={user.phone || "Non renseigne"}
          />
        </div>
      </div>

      {/* Menu */}
      <div className="px-4 md:px-0 mt-4 space-y-3">
        <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
          <MenuItem
            icon={<CalendarDays className="size-4" />}
            label="Mes rendez-vous"
            onClick={() => resetTo("client-appointments")}
          />
          <MenuItem
            icon={<Bell className="size-4" />}
            label="Notifications"
            onClick={() => resetTo("client-notifications")}
          />
          <MenuItem
            icon={<Info className="size-4" />}
            label="A propos de ReservoExpress"
            onClick={() =>
              showToast("ReservoExpress - Reservez en 3 taps", "info")
            }
          />
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full text-destructive border-destructive/30 hover:bg-destructive/5"
            >
              <LogOut className="size-4 mr-2" /> Se deconnecter
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Deconnexion ?</AlertDialogTitle>
              <AlertDialogDescription>
                Vous devrez vous reconnecter pour acceder a vos rendez-vous.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={logout}>Deconnecter</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <p className="text-center text-xs text-muted-foreground pt-2">
          ReservoExpress v1.0 · Projet pedagogique
        </p>
      </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="px-3 py-2.5 flex items-center gap-3">
      <div className="size-8 rounded-lg bg-primary/10 grid place-items-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-3 hover:bg-accent/50 transition-colors text-left"
    >
      <div className="size-8 rounded-lg bg-muted grid place-items-center shrink-0">
        {icon}
      </div>
      <span className="flex-1 text-sm font-medium">{label}</span>
      <ChevronRight className="size-4 text-muted-foreground" />
    </button>
  );
}
