import { db } from "@/lib/db";
import {
  requireProvider,
  jsonResponse,
  errorResponse,
  AuthError,
} from "@/lib/session";
import { mapAppointment } from "@/lib/mappers";

export const runtime = "nodejs";

// GET /api/provider/dashboard
// Returns today's + this week's appointments for the logged-in provider.
export async function GET() {
  try {
    const session = await requireProvider();
    const providerId = session.providerId!;

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    // This week (Mon-Sun)
    const dayOfWeek = now.getDay(); // 0..6
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + mondayOffset);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const [todayAppts, weekAppts, unavailCount] = await Promise.all([
      db.appointment.findMany({
        where: {
          providerId,
          status: { in: ["CONFIRMED", "COMPLETED"] },
          startTime: { gte: todayStart, lte: todayEnd },
        },
        include: { service: true, provider: true, client: true, review: true },
        orderBy: { startTime: "asc" },
      }),
      db.appointment.findMany({
        where: {
          providerId,
          status: { in: ["CONFIRMED", "COMPLETED"] },
          startTime: { gte: weekStart, lte: weekEnd },
        },
        include: { service: true, provider: true, client: true, review: true },
        orderBy: { startTime: "asc" },
      }),
      db.unavailability.count({ where: { providerId } }),
    ]);

    return jsonResponse({
      today: todayAppts.map(mapAppointment),
      week: weekAppts.map(mapAppointment),
      counts: {
        today: todayAppts.length,
        week: weekAppts.length,
        unavailabilities: unavailCount,
      },
    });
  } catch (e) {
    if (e instanceof AuthError) return errorResponse(e.message, e.status);
    console.error("dashboard error", e);
    return errorResponse("Erreur serveur.", 500);
  }
}
