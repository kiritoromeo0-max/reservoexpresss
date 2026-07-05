import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  requireClient,
  jsonResponse,
  errorResponse,
  AuthError,
} from "@/lib/session";
import { mapReview } from "@/lib/mappers";

export const runtime = "nodejs";

// POST /api/appointments/[id]/review
// Body: { rating: 1..5, comment: string }
// Client reviews a COMPLETED appointment. Only one review per appointment.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireClient();
    const { id } = await params;
    const body = await req.json();
    const rating = Math.round(Number(body.rating));
    const comment = body.comment ? String(body.comment) : "";

    if (!rating || rating < 1 || rating > 5) {
      return errorResponse("Note invalide (1 a 5).", 400);
    }

    const appt = await db.appointment.findUnique({
      where: { id },
      include: { provider: true, review: true },
    });
    if (!appt) return errorResponse("RDV introuvable.", 404);
    if (appt.clientId !== session.id) {
      return errorResponse("Acces refuse.", 403);
    }
    if (appt.status !== "COMPLETED") {
      return errorResponse(
        "Vous ne pouvez noter qu'un RDV termine.",
        400
      );
    }
    if (appt.review) {
      return errorResponse("Vous avez deja note ce RDV.", 400);
    }

    const review = await db.$transaction(async (tx) => {
      const r = await tx.review.create({
        data: {
          appointmentId: appt.id,
          clientId: session.id,
          providerId: appt.providerId,
          rating,
          comment,
        },
        include: { client: true, appointment: { include: { service: true } } },
      });

      // Recompute provider rating + count
      const agg = await tx.review.aggregate({
        where: { providerId: appt.providerId },
        _avg: { rating: true },
        _count: { rating: true },
      });
      await tx.provider.update({
        where: { id: appt.providerId },
        data: {
          rating: Math.round((agg._avg.rating ?? 0) * 10) / 10,
          reviewCount: agg._count.rating,
        },
      });

      // Notify provider
      await tx.notification.create({
        data: {
          userId: appt.provider.userId,
          type: "NEW_REVIEW",
          title: "Nouvel avis",
          message: `${session.name} a laisse un avis de ${rating}/5.`,
        },
      });

      return r;
    });

    return jsonResponse({ review: mapReview(review) }, 201);
  } catch (e) {
    if (e instanceof AuthError) return errorResponse(e.message, e.status);
    console.error("review error", e);
    return errorResponse("Erreur serveur.", 500);
  }
}
