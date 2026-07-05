import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  requireProvider,
  jsonResponse,
  errorResponse,
  AuthError,
} from "@/lib/session";
import { mapUnavailability } from "@/lib/mappers";

export const runtime = "nodejs";

// GET /api/provider/unavailabilities
export async function GET() {
  try {
    const session = await requireProvider();
    const providerId = session.providerId!;
    const items = await db.unavailability.findMany({
      where: { providerId },
      orderBy: { startDate: "asc" },
    });
    return jsonResponse({ unavailabilities: items.map(mapUnavailability) });
  } catch (e) {
    if (e instanceof AuthError) return errorResponse(e.message, e.status);
    console.error("list unavail error", e);
    return errorResponse("Erreur serveur.", 500);
  }
}

// POST /api/provider/unavailabilities
// Body: { startDate: ISO, endDate: ISO, reason?: string }
export async function POST(req: NextRequest) {
  try {
    const session = await requireProvider();
    const providerId = session.providerId!;
    const body = await req.json();
    const startDateStr = body.startDate;
    const endDateStr = body.endDate;
    const reason = body.reason ? String(body.reason) : "Indisponible";

    if (!startDateStr || !endDateStr) {
      return errorResponse("Dates de debut et de fin requises.", 400);
    }
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return errorResponse("Dates invalides.", 400);
    }
    if (endDate <= startDate) {
      return errorResponse("La date de fin doit etre apres la date de debut.", 400);
    }

    const created = await db.unavailability.create({
      data: { providerId, startDate, endDate, reason },
    });

    // Auto-cancel conflicting CONFIRMED appointments within the block, notify clients.
    const conflicting = await db.appointment.findMany({
      where: {
        providerId,
        status: "CONFIRMED",
        startTime: { gte: startDate, lt: endDate },
      },
      include: { service: true, provider: true, client: true, review: true },
    });
    for (const appt of conflicting) {
      await db.appointment.update({
        where: { id: appt.id },
        data: {
          status: "CANCELLED",
          cancelReason: `Indisponibilite: ${reason}`,
        },
      });
      await db.notification.create({
        data: {
          userId: appt.clientId,
          type: "BOOKING_CANCELLED",
          title: "RDV annule par le prestataire",
          message: `Votre RDV chez ${appt.provider.businessName} du ${appt.startTime.toLocaleDateString("fr-FR")} a ete annule (indisponibilite).`,
        },
      });
    }

    return jsonResponse(
      {
        unavailability: mapUnavailability(created),
        cancelledAppointments: conflicting.length,
      },
      201
    );
  } catch (e) {
    if (e instanceof AuthError) return errorResponse(e.message, e.status);
    console.error("create unavail error", e);
    return errorResponse("Erreur serveur.", 500);
  }
}
