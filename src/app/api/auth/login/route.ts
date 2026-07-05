import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword, createSessionToken, setSessionCookie } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!email || !password) {
      return errorResponse("Email et mot de passe requis.", 400);
    }
    const user = await db.user.findUnique({ where: { email } });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return errorResponse("Email ou mot de passe incorrect.", 401);
    }
    const token = createSessionToken(user.id);
    const res = jsonResponse({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        avatarColor: user.avatarColor,
      },
    });
    res.headers.set("Set-Cookie", setSessionCookie(token));
    return res;
  } catch (e) {
    console.error("login error", e);
    return errorResponse("Erreur serveur.", 500);
  }
}
