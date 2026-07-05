"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useApp, homeScreenForRole } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarCheck, Loader2 } from "lucide-react";

export function LoginScreen({ onSwitch }: { onSwitch: () => void }) {
  const [email, setEmail] = useState("client@demo.fr");
  const [password, setPassword] = useState("demo1234");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setUser = useApp((s) => s.setUser);
  const resetTo = useApp((s) => s.resetTo);
  const showToast = useApp((s) => s.showToast);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { user } = await api.login(email, password);
      setUser(user);
      resetTo(homeScreenForRole(user.role));
      showToast(`Bienvenue, ${user.name.split(" ")[0]} !`, "success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(role: "client" | "provider") {
    if (role === "client") {
      setEmail("client@demo.fr");
      setPassword("demo1234");
    } else {
      setEmail("provider1@demo.fr");
      setPassword("demo1234");
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto slim-scrollbar">
      <div className="flex-1 flex flex-col justify-center px-6 py-8 mx-auto w-full max-w-md">
        {/* Brand */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="size-16 rounded-2xl bg-primary text-primary-foreground grid place-items-center mb-4 shadow-lg shadow-primary/30">
            <CalendarCheck className="size-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">ReservoExpress</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Reservez un creneau en 3 taps
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.fr"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="w-full h-11 text-base">
            {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
            Se connecter
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">Pas encore de compte ? </span>
          <button
            onClick={onSwitch}
            className="text-primary font-semibold hover:underline"
          >
            Creer un compte
          </button>
        </div>

        {/* Demo accounts */}
        <div className="mt-8 border border-dashed border-border rounded-xl p-3 bg-muted/30">
          <p className="text-xs text-muted-foreground text-center mb-2 font-medium">
            Comptes de demonstration
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => fillDemo("client")}
              className="text-xs rounded-lg bg-background border border-border py-2 px-2 hover:bg-accent transition-colors"
            >
              <span className="block font-semibold">Client</span>
              <span className="text-muted-foreground">client@demo.fr</span>
            </button>
            <button
              onClick={() => fillDemo("provider")}
              className="text-xs rounded-lg bg-background border border-border py-2 px-2 hover:bg-accent transition-colors"
            >
              <span className="block font-semibold">Prestataire</span>
              <span className="text-muted-foreground">provider1@demo.fr</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
