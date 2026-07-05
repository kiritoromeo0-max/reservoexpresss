"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useApp, homeScreenForRole } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarCheck, Loader2, User, Store } from "lucide-react";
import { CATEGORIES } from "../ui-helpers";
import { cn } from "@/lib/utils";

export function RegisterScreen({ onSwitch }: { onSwitch: () => void }) {
  const [role, setRole] = useState<"CLIENT" | "PROVIDER">("CLIENT");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  // provider fields
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("coiffeur");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");

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
      const { user } = await api.register({
        email,
        password,
        name,
        role,
        phone: phone || undefined,
        businessName: role === "PROVIDER" ? businessName : undefined,
        category: role === "PROVIDER" ? category : undefined,
        address: role === "PROVIDER" ? address : undefined,
        city: role === "PROVIDER" ? city : undefined,
        description: role === "PROVIDER" ? description : undefined,
      });
      setUser(user);
      resetTo(homeScreenForRole(user.role));
      showToast("Compte cree avec succes !", "success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto slim-scrollbar">
      <div className="px-6 py-6">
        {/* Brand */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="size-12 rounded-2xl bg-primary text-primary-foreground grid place-items-center mb-3">
            <CalendarCheck className="size-6" />
          </div>
          <h1 className="text-xl font-bold">Creer un compte</h1>
        </div>

        {/* Role selector */}
        <div className="mb-5">
          <Label className="mb-2 block">Je suis...</Label>
          <div className="grid grid-cols-2 gap-2">
            <RoleCard
              active={role === "CLIENT"}
              onClick={() => setRole("CLIENT")}
              icon={<User className="size-5" />}
              title="Client"
              desc="Je reserve des RDV"
            />
            <RoleCard
              active={role === "PROVIDER"}
              onClick={() => setRole("PROVIDER")}
              icon={<Store className="size-5" />}
              title="Prestataire"
              desc="Je propose des services"
            />
          </div>
        </div>

        <form onSubmit={submit} className="space-y-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="r-name">{role === "CLIENT" ? "Nom complet" : "Votre nom"}</Label>
            <Input
              id="r-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="r-email">Email</Label>
            <Input
              id="r-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="r-password">Mot de passe</Label>
              <Input
                id="r-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="r-phone">Telephone</Label>
              <Input
                id="r-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Optionnel"
              />
            </div>
          </div>

          {role === "PROVIDER" && (
            <div className="space-y-3.5 pt-2 border-t border-border mt-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Informations professionnelles
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="r-bn">Nom commercial</Label>
                <Input
                  id="r-bn"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Salon Lumiere"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label>Categorie</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="r-city">Ville</Label>
                  <Input
                    id="r-city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Abidjan"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="r-addr">Adresse</Label>
                <Input
                  id="r-addr"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="12 rue de Rivoli"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="r-desc">Description (courte)</Label>
                <Textarea
                  id="r-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Decrivez votre activite..."
                />
              </div>
              <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
                La geolocalisation sera definie sur le centre de votre ville par defaut.
                Horaires: Lun-Ven 9h-18h, Sam 9h-13h (modifiables plus tard).
              </p>
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="w-full h-11">
            {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
            Creer mon compte
          </Button>
        </form>

        <div className="mt-5 text-center text-sm">
          <span className="text-muted-foreground">Deja un compte ? </span>
          <button
            onClick={onSwitch}
            className="text-primary font-semibold hover:underline"
          >
            Se connecter
          </button>
        </div>
      </div>
    </div>
  );
}

function RoleCard({
  active,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border-2 p-3 text-left transition-all",
        active
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "border-border hover:border-primary/40"
      )}
    >
      <div
        className={cn(
          "size-9 rounded-lg grid place-items-center mb-2",
          active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}
      >
        {icon}
      </div>
      <p className="font-semibold text-sm">{title}</p>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </button>
  );
}
