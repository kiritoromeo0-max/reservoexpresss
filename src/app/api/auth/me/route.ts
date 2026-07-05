import { db } from "@/lib/db";
import { getSession, jsonResponse, errorResponse } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  try {
    const s = await getSession();
    if (!s) return jsonResponse({ user: null });
    const provider = s.providerId
      ? await db.provider.findUnique({
          where: { id: s.providerId },
          select: { id: true, businessName: true, category: true },
        })
      : null;
    return jsonResponse({ user: { ...s, provider } });
  } catch (e) {
    console.error("me error", e);
    return errorResponse("Erreur serveur.", 500);
  }
}
