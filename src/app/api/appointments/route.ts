import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  requireClient,
  jsonResponse,
  errorResponse,
  AuthError,
} from "@/lib/session";
import { isSlotBookable } from "@/lib/slots";
import { parseOpeningHours } from "@/lib/mappers";
import { mapAppointment } from "@/lib/mappers";

export const runtime = "nodejs";

// POST /api/appointments
// Body: { providerId, serviceId, startTime (ISO UTC), notes?, depositPaid? }
// Transactional: prevents double-booking.
export async function POST(req: NextRequest) {
  try {
    const session = await requireClient();
    const body = await req.json();
    const { providerId, serviceId, startTime } = body;
    const notes = body.notes ? String(body.notes) : null;
    const depositPaid = Number(body.depositPaid || 0);

    if (!providerId || !serviceId || !startTime) {
      return errorResponse("Champs manquants.", 400);
    }

    const start = new Date(startTime);
    if (isNaN(start.getTime())) {
      return errorResponse("Date de debut invalide.", 400);
    }

    // Past check
    if (start.getTime() <= Date.now()) {
      return errorResponse("Impossible de reserver dans le passe.", 400);
    }

    // Use a transaction to atomically verify + create
    const created = await db.$transaction(async (tx) => {
      const provider = await tx.provider.findUnique({
        where: { id: providerId },
        include: { services: true },
      });
      if (!provider || !provider.isActive) {
        throw new AuthError("Prestataire introuvable.", 404);
      }
      const service = provider.services.find((s) => s.id === serviceId);
      if (!service) {
        throw new AuthError("Service introuvable.", 404);
      }

      const end = new Date(start.getTime() + service.durationMin * 60 * 1000);

      // Fetch existing appointments overlapping [start, end]
      const dayStart = new Date(start);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(start);
      dayEnd.setHours(23, 59, 59, 999);

      const [appointments, unavailabilities] = await Promise.all([
        tx.appointment.findMany({
          where: {
            providerId: provider.id,
            status: { in: ["CONFIRMED", "COMPLETED"] },
            startTime: { gte: dayStart, lte: dayEnd },
          },
          select: { startTime: true, endTime: true },
        }),
        tx.unavailability.findMany({
          where: {
            providerId: provider.id,
            startDate: { lte: dayEnd },
            endDate: { gte: dayStart },
          },
          select: { startDate: true, endDate: true },
        }),
      ]);

      const check = isSlotBookable(
        start,
        end,
        service.durationMin,
        parseOpeningHours(provider.openingHours),
        appointments.map((a) => ({
          startTime: a.startTime.toISOString(),
          endTime: a.endTime.toISOString(),
        })),
        unavailabilities.map((u) => ({
          startDate: u.startDate.toISOString(),
          endDate: u.endDate.toISOString(),
        }))
      );
      if (!check.ok) {
        throw new AuthError(check.reason || "Creneau non disponible.", 409);
      }

      const appt = await tx.appointment.create({
        data: {
          clientId: session.id,
          providerId: provider.id,
          serviceId: service.id,
          startTime: start,
          endTime: end,
          status: "CONFIRMED",
          notes,
          depositPaid,
        },
        include: {
          service: true,
          provider: true,
          client: true,
          review: true,
        },
      });

      // Create notification for the client (confirmation)
      await tx.notification.create({
        data: {
          userId: session.id,
          type: "BOOKING_CONFIRMED",
          title: "Reservation confirmee",
          message: `Votre RDV chez ${provider.businessName} le ${start.toLocaleDateString("fr-FR")} est confirme.`,
        },
      });

      // Create notification for the provider
      await tx.notification.create({
        data: {
          userId: provider.userId,
          type: "NEW_BOOKING",
          title: "Nouvelle reservation",
          message: `${session.name} a reserve un ${service.name} le ${start.toLocaleDateString("fr-FR")}.`,
        },
      });

      return appt;
    });

    return jsonResponse({ appointment: mapAppointment(created) }, 201);
  } catch (e) {
    if (e instanceof AuthError) {
      return errorResponse(e.message, e.status);
    }
    console.error("create appointment error", e);
    return errorResponse("Erreur serveur.", 500);
  }
}

// GET /api/appointments?scope=upcoming|past
export async function GET(req: NextRequest) {
  try {
    const session = await requireClient();
    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope") || "upcoming"; // upcoming | past

    const now = new Date();
    const where =
      scope === "past"
        ? {
            clientId: session.id,
            OR: [
              { status: { in: ["COMPLETED", "CANCELLED", "NO_SHOW"] } },
              { startTime: { lt: now } },
            ],
          }
        : {
            clientId: session.id,
            status: "CONFIRMED",
            startTime: { gte: now },
          };

    const appointments = await db.appointment.findMany({
      where,
      include: {
        service: true,
        provider: true,
        client: true,
        review: true,
      },
      orderBy: { startTime: scope === "past" ? "desc" : "asc" },
    });

    return jsonResponse({ appointments: appointments.map(mapAppointment) });
  } catch (e) {
    if (e instanceof AuthError) {
      return errorResponse(e.message, e.status);
    }
    console.error("list appointments error", e);
    return errorResponse("Erreur serveur.", 500);
  }
}
