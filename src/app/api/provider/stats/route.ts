import { db } from "@/lib/db";
import {
  requireProvider,
  jsonResponse,
  errorResponse,
  AuthError,
} from "@/lib/session";

export const runtime = "nodejs";

// GET /api/provider/stats
// Computes: occupancy rate, total appointments, popular services, revenue, rating.
export async function GET() {
  try {
    const session = await requireProvider();
    const providerId = session.providerId!;

    const now = new Date();
    const weekStart = new Date(now);
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    weekStart.setDate(now.getDate() + mondayOffset);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const provider = await db.provider.findUnique({
      where: { id: providerId },
      include: { services: true },
    });
    if (!provider) return errorResponse("Prestataire introuvable.", 404);

    const [weekAppts, allAppts, reviews] = await Promise.all([
      db.appointment.findMany({
        where: {
          providerId,
          startTime: { gte: weekStart, lte: weekEnd },
        },
        include: { service: true },
      }),
      db.appointment.findMany({
        where: { providerId },
        include: { service: true },
      }),
      db.review.findMany({ where: { providerId } }),
    ]);

    // Occupancy rate this week: booked time / available time
    const openingHours = JSON.parse(provider.openingHours || "{}");
    let availableMinWeek = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const wd = d.getDay();
      const dayHours = openingHours[wd];
      if (!dayHours || dayHours.closed) continue;
      const [oh, om] = dayHours.open.split(":").map(Number);
      const [ch, cm] = dayHours.close.split(":").map(Number);
      availableMinWeek += ch * 60 + cm - (oh * 60 + om);
    }
    const bookedMinWeek = weekAppts
      .filter((a) => a.status !== "CANCELLED")
      .reduce((sum, a) => sum + a.service.durationMin, 0);
    const occupancyRate =
      availableMinWeek > 0
        ? Math.round((bookedMinWeek / availableMinWeek) * 100)
        : 0;

    // Popular services (count by service)
    const serviceCounts = new Map<string, { name: string; count: number; revenue: number }>();
    for (const a of allAppts) {
      if (a.status === "CANCELLED") continue;
      const cur = serviceCounts.get(a.serviceId) || {
        name: a.service.name,
        count: 0,
        revenue: 0,
      };
      cur.count += 1;
      cur.revenue += a.service.price;
      serviceCounts.set(a.serviceId, cur);
    }
    const popularServices = Array.from(serviceCounts.values()).sort(
      (a, b) => b.count - a.count
    );

    const totalRevenue = allAppts
      .filter((a) => a.status !== "CANCELLED")
      .reduce((s, a) => s + a.service.price, 0);

    const avgRating =
      reviews.length > 0
        ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
        : provider.rating;

    // Revenue by day for the week (for a mini chart)
    const revenueByDay: { day: string; revenue: number; count: number }[] = [];
    const dayLabels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
    for (let i = 0; i < 7; i++) {
      const dStart = new Date(weekStart);
      dStart.setDate(weekStart.getDate() + i);
      const dEnd = new Date(dStart);
      dEnd.setHours(23, 59, 59, 999);
      const dayAppts = weekAppts.filter(
        (a) => a.startTime >= dStart && a.startTime <= dEnd && a.status !== "CANCELLED"
      );
      revenueByDay.push({
        day: dayLabels[i],
        revenue: dayAppts.reduce((s, a) => s + a.service.price, 0),
        count: dayAppts.length,
      });
    }

    return jsonResponse({
      occupancyRate,
      bookedMinWeek,
      availableMinWeek,
      totalAppointments: allAppts.length,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      avgRating,
      reviewCount: reviews.length,
      popularServices,
      revenueByDay,
    });
  } catch (e) {
    if (e instanceof AuthError) return errorResponse(e.message, e.status);
    console.error("stats error", e);
    return errorResponse("Erreur serveur.", 500);
  }
}
