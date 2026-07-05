import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  getSession,
  jsonResponse,
  errorResponse,
  AuthError,
} from "@/lib/session";
import { mapNotification } from "@/lib/mappers";

export const runtime = "nodejs";

// GET /api/notifications
// Also auto-generates D-1 reminders for confirmed appointments happening within 24-48h.
export async function GET() {
  try {
    const session = await getSession();
    if (!session) throw new AuthError("Non authentifie.", 401);

    // Auto-generate D-1 reminders (idempotent: we check if a reminder already exists
    // for the appointment within the past 48h)
    const now = new Date();
    const in24 = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in48 = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    if (session.role === "CLIENT") {
      const upcoming = await db.appointment.findMany({
        where: {
          clientId: session.id,
          status: "CONFIRMED",
          startTime: { gte: in24, lte: in48 },
        },
        include: { provider: true, service: true },
      });
      for (const appt of upcoming) {
        // Check if a reminder notification already exists for this appointment
        const existing = await db.notification.findFirst({
          where: {
            userId: session.id,
            type: "REMINDER_D1",
            message: { contains: appt.id },
          },
        });
        if (!existing) {
          await db.notification.create({
            data: {
              userId: session.id,
              type: "REMINDER_D1",
              title: "Rappel de RDV",
              message: `Rappel: RDV chez ${appt.provider.businessName} demain a ${appt.startTime.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}. [${appt.id}]`,
            },
          });
        }
      }
    }

    const notifications = await db.notification.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    const unreadCount = notifications.filter((n) => !n.read).length;
    return jsonResponse({
      notifications: notifications.map(mapNotification),
      unreadCount,
    });
  } catch (e) {
    if (e instanceof AuthError) return errorResponse(e.message, e.status);
    console.error("notifications error", e);
    return errorResponse("Erreur serveur.", 500);
  }
}

// PATCH /api/notifications  body: { id?: string, all?: bool } -> mark read
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) throw new AuthError("Non authentifie.", 401);
    const body = await req.json();
    if (body.all) {
      await db.notification.updateMany({
        where: { userId: session.id, read: false },
        data: { read: true },
      });
    } else if (body.id) {
      await db.notification.updateMany({
        where: { id: body.id, userId: session.id },
        data: { read: true },
      });
    }
    return jsonResponse({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return errorResponse(e.message, e.status);
    console.error("notifications patch error", e);
    return errorResponse("Erreur serveur.", 500);
  }
}
