import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  requireProvider,
  jsonResponse,
  errorResponse,
  AuthError,
} from "@/lib/session";
import { mapAppointment } from "@/lib/mappers";

export const runtime = "nodejs";

// GET /api/provider/appointments?scope=upcoming|past|all
export async function GET(req: NextRequest) {
  try {
    const session = await requireProvider();
    const providerId = session.providerId!;
    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope") || "upcoming";
    const now = new Date();

    const where =
      scope === "past"
        ? { providerId, startTime: { lt: now } }
        : scope === "all"
        ? { providerId }
        : { providerId, startTime: { gte: now } };

    const appointments = await db.appointment.findMany({
      where,
      include: { service: true, provider: true, client: true, review: true },
      orderBy: { startTime: scope === "past" ? "desc" : "asc" },
    });

    return jsonResponse({ appointments: appointments.map(mapAppointment) });
  } catch (e) {
    if (e instanceof AuthError) return errorResponse(e.message, e.status);
    console.error("provider appointments error", e);
    return errorResponse("Erreur serveur.", 500);
  }
}
