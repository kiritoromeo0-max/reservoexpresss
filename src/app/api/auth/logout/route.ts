import { clearSessionCookie } from "@/lib/auth";
import { jsonResponse } from "@/lib/session";

export const runtime = "nodejs";

export async function POST() {
  const res = jsonResponse({ ok: true });
  res.headers.set("Set-Cookie", clearSessionCookie());
  return res;
}
