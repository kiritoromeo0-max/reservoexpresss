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

// GET a single appointment (client or provider)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) throw new AuthError("Non authentifie.", 401);
    const { id } = await params;
    const appt = await db.appointment.findUnique({
      where: { id },
      include: { service: true, provider: true, client: true, review: true },
    });
    if (!appt) return errorResponse("RDV introuvable.", 404);
    // access control
    if (appt.clientId !== session.id && appt.provider.userId !== session.id) {
      return errorResponse("Acces refuse.", 403);
    }
    return jsonResponse({ appointment: mapAppointment(appt) });
  } catch (e) {
    if (e instanceof AuthError) return errorResponse(e.message, e.status);
    console.error("get appointment error", e);
    return errorResponse("Erreur serveur.", 500);
  }
}
