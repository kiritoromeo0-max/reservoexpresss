import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { jsonResponse, errorResponse } from "@/lib/session";
import { computeAvailableSlots } from "@/lib/slots";
import { parseOpeningHours } from "@/lib/mappers";

export const runtime = "nodejs";

// GET /api/providers/[id]/slots?serviceId=&date=YYYY-MM-DD
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const serviceId = searchParams.get("serviceId");
    const dateStr = searchParams.get("date"); // YYYY-MM-DD

    if (!serviceId || !dateStr) {
      return errorResponse("serviceId et date requis.", 400);
    }

    const provider = await db.provider.findUnique({
      where: { id },
      include: { services: true },
    });
    if (!provider) return errorResponse("Prestataire introuvable.", 404);

    const service = provider.services.find((s) => s.id === serviceId);
    if (!service) return errorResponse("Service introuvable.", 404);

    // Parse date as local day (YYYY-MM-DD) -> Date at local midnight
    const [y, m, d] = dateStr.split("-").map(Number);
    if (!y || !m || !d) return errorResponse("Date invalide.", 400);
    const date = new Date(y, m - 1, d);

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const [appointments, unavailabilities] = await Promise.all([
      db.appointment.findMany({
        where: {
          providerId: provider.id,
          status: { in: ["CONFIRMED", "COMPLETED"] },
          startTime: { gte: dayStart, lte: dayEnd },
        },
        select: { startTime: true, endTime: true },
      }),
      db.unavailability.findMany({
        where: {
          providerId: provider.id,
          startDate: { lte: dayEnd },
          endDate: { gte: dayStart },
        },
        select: { startDate: true, endDate: true },
      }),
    ]);

    const slots = computeAvailableSlots({
      date,
      openingHours: parseOpeningHours(provider.openingHours),
      durationMin: service.durationMin,
      appointments: appointments.map((a) => ({
        startTime: a.startTime.toISOString(),
        endTime: a.endTime.toISOString(),
      })),
      unavailabilities: unavailabilities.map((u) => ({
        startDate: u.startDate.toISOString(),
        endDate: u.endDate.toISOString(),
      })),
    });

    return jsonResponse({ slots, serviceDurationMin: service.durationMin });
  } catch (e) {
    console.error("slots error", e);
    return errorResponse("Erreur serveur.", 500);
  }
}
