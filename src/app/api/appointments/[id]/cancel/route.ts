import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  getSession,
  jsonResponse,
  errorResponse,
  AuthError,
} from "@/lib/session";
import { mapAppointment } from "@/lib/mappers";

export const runtime = "nodejs";

// POST /api/appointments/[id]/cancel
// Client can cancel up to J-1 (24h before startTime).
// Provider can cancel anytime.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) throw new AuthError("Non authentifie.", 401);
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const reason = body.reason ? String(body.reason) : null;

    const appt = await db.appointment.findUnique({
      where: { id },
      include: { service: true, provider: true, client: true, review: true },
    });
    if (!appt) return errorResponse("RDV introuvable.", 404);

    const isClient = appt.clientId === session.id;
    const isProvider = appt.provider.userId === session.id;
    if (!isClient && !isProvider) {
      return errorResponse("Acces refuse.", 403);
    }
    if (appt.status === "CANCELLED") {
      return errorResponse("RDV deja annule.", 400);
    }
    if (appt.status === "COMPLETED") {
      return errorResponse("RDV deja termine.", 400);
    }

    // Cancellation policy: clients must cancel at least 24h before
    if (isClient && !isProvider) {
      const msUntil = appt.startTime.getTime() - Date.now();
      if (msUntil < 24 * 60 * 60 * 1000) {
        return errorResponse(
          "Annulation impossible a moins de 24h du RDV.",
          400
        );
      }
    }

    const updated = await db.appointment.update({
      where: { id },
      data: { status: "CANCELLED", cancelReason: reason },
      include: { service: true, provider: true, client: true, review: true },
    });

    // Notify the other party
    const notifyUserId = isClient ? appt.provider.userId : appt.clientId;
    const canceler = isClient ? "Le client" : "Le prestataire";
    await db.notification.create({
      data: {
        userId: notifyUserId,
        type: "BOOKING_CANCELLED",
        title: "RDV annule",
        message: `${canceler} a annule le RDV du ${appt.startTime.toLocaleDateString("fr-FR")}.${reason ? ` Motif: ${reason}` : ""}`,
      },
    });

    return jsonResponse({ appointment: mapAppointment(updated) });
  } catch (e) {
    if (e instanceof AuthError) return errorResponse(e.message, e.status);
    console.error("cancel appointment error", e);
    return errorResponse("Erreur serveur.", 500);
  }
}
