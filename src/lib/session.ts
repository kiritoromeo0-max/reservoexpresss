// ReservoExpress - server-side auth context for API routes

import { cookies } from "next/headers";
import { db } from "./db";
import { AUTH_COOKIE, verifySessionToken } from "./auth";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "CLIENT" | "PROVIDER";
  phone: string | null;
  avatarColor: string;
  providerId: string | null;
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value ?? null;
  if (!token) return null;
  const userId = verifySessionToken(token);
  if (!userId) return null;
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { provider: { select: { id: true } } },
  });
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as "CLIENT" | "PROVIDER",
    phone: user.phone,
    avatarColor: user.avatarColor,
    providerId: user.provider?.id ?? null,
  };
}

export async function requireSession(): Promise<SessionUser> {
  const s = await getSession();
  if (!s) throw new AuthError("Non authentifie", 401);
  return s;
}

export async function requireClient(): Promise<SessionUser> {
  const s = await requireSession();
  if (s.role !== "CLIENT") throw new AuthError("Acces client requis", 403);
  return s;
}

export async function requireProvider(): Promise<SessionUser> {
  const s = await requireSession();
  if (s.role !== "PROVIDER" || !s.providerId)
    throw new AuthError("Acces prestataire requis", 403);
  return s;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number = 400) {
    super(message);
    this.status = status;
  }
}

// Standard JSON error response helper
export function errorResponse(message: string, status: number = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function jsonResponse(data: unknown, status: number = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
