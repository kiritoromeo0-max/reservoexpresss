import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  requireProvider,
  jsonResponse,
  errorResponse,
  AuthError,
} from "@/lib/session";

export const runtime = "nodejs";

// DELETE /api/provider/unavailabilities/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireProvider();
    const providerId = session.providerId!;
    const { id } = await params;
    const item = await db.unavailability.findUnique({ where: { id } });
    if (!item || item.providerId !== providerId) {
      return errorResponse("Indisponibilite introuvable.", 404);
    }
    await db.unavailability.delete({ where: { id } });
    return jsonResponse({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) return errorResponse(e.message, e.status);
    console.error("delete unavail error", e);
    return errorResponse("Erreur serveur.", 500);
  }
}
