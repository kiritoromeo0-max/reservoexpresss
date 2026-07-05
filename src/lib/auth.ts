// ReservoExpress - auth helpers
//
// Lightweight session management using signed cookies (no external dep).
// Passwords are hashed with PBKDF2 via node:crypto.

import { createHmac, pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";

const SESSION_SECRET =
  process.env.SESSION_SECRET || "reservoexpress-dev-secret-change-me";
const COOKIE_NAME = "rx_session";
const PBKDF2_ITER = 100_000;
const PBKDF2_KEYLEN = 32;
const SALT_LEN = 16;

// ---- Password hashing ----
export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LEN).toString("hex");
  const derived = pbkdf2Sync(
    password,
    salt,
    PBKDF2_ITER,
    PBKDF2_KEYLEN,
    "sha256"
  ).toString("hex");
  return `pbkdf2$${PBKDF2_ITER}$${salt}$${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const parts = stored.split("$");
    if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
    const iter = parseInt(parts[1], 10);
    const salt = parts[2];
    const expected = parts[3];
    const derived = pbkdf2Sync(
      password,
      salt,
      iter,
      PBKDF2_KEYLEN,
      "sha256"
    ).toString("hex");
    const a = Buffer.from(derived, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// ---- Session token ----
// Format: userId.timestamp.signature
export function createSessionToken(userId: string): string {
  const payload = `${userId}.${Date.now()}`;
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [userId, ts, sig] = parts;
    const payload = `${userId}.${ts}`;
    if (!timingSafeEqualStr(sig, sign(payload))) return null;
    // Optional: expire after 30 days
    const issued = parseInt(ts, 10);
    if (Date.now() - issued > 30 * 24 * 60 * 60 * 1000) return null;
    return userId;
  } catch {
    return null;
  }
}

function sign(payload: string): string {
  return createHmac("sha256", SESSION_SECRET)
    .update(payload)
    .digest("hex")
    .slice(0, 32);
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export const AUTH_COOKIE = COOKIE_NAME;

// ---- Cookie helpers (for API routes) ----
export function setSessionCookie(token: string): string {
  const maxAge = 30 * 24 * 60 * 60; // 30 days
  return `${AUTH_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearSessionCookie(): string {
  return `${AUTH_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function readCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return null;
}
