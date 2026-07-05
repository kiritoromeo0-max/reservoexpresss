import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  hashPassword,
  createSessionToken,
  setSessionCookie,
} from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/session";

export const runtime = "nodejs";

const CATEGORIES = ["coiffeur", "medecin", "garagiste", "esthetique", "sport", "autre"];
const DEFAULT_HOURS = {
  0: { open: "09:00", close: "18:00", closed: true },
  1: { open: "09:00", close: "18:00" },
  2: { open: "09:00", close: "18:00" },
  3: { open: "09:00", close: "18:00" },
  4: { open: "09:00", close: "18:00" },
  5: { open: "09:00", close: "18:00" },
  6: { open: "09:00", close: "13:00" },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const name = String(body.name || "").trim();
    const role = String(body.role || "CLIENT").toUpperCase() as "CLIENT" | "PROVIDER";
    const phone = body.phone ? String(body.phone) : null;

    if (!email || !password || !name) {
      return errorResponse("Email, mot de passe et nom requis.", 400);
    }
    if (password.length < 6) {
      return errorResponse("Le mot de passe doit faire au moins 6 caracteres.", 400);
    }
    if (role !== "CLIENT" && role !== "PROVIDER") {
      return errorResponse("Role invalide.", 400);
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return errorResponse("Un compte existe deja avec cet email.", 409);
    }

    const avatarColors = ["#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];
    const user = await db.user.create({
      data: {
        email,
        passwordHash: hashPassword(password),
        name,
        role,
        phone,
        avatarColor: avatarColors[Math.floor(Math.random() * avatarColors.length)],
      },
    });

    // If provider, create a provider profile from the registration fields
    if (role === "PROVIDER") {
      const businessName = String(body.businessName || name);
      const category = CATEGORIES.includes(body.category)
        ? body.category
        : "autre";
      const address = String(body.address || "");
      const city = String(body.city || "");
      const description = String(body.description || "");
      const lat = Number(body.lat ?? 48.8566);
      const lng = Number(body.lng ?? 2.3522);

      if (!businessName || !address || !city) {
        // rollback user
        await db.user.delete({ where: { id: user.id } });
        return errorResponse(
          "Nom commercial, adresse et ville requis pour un prestataire.",
          400
        );
      }

      await db.provider.create({
        data: {
          userId: user.id,
          businessName,
          category,
          description,
          address,
          city,
          lat,
          lng,
          photos: "[]",
          openingHours: JSON.stringify(DEFAULT_HOURS),
        },
      });
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
    console.error("register error", e);
    return errorResponse("Erreur serveur.", 500);
  }
}
