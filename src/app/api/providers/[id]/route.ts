import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { jsonResponse, errorResponse } from "@/lib/session";
import { mapProvider } from "@/lib/mappers";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const provider = await db.provider.findUnique({
      where: { id },
      include: { services: true },
    });
    if (!provider || !provider.isActive) {
      return errorResponse("Prestataire introuvable.", 404);
    }
    return jsonResponse({ provider: mapProvider(provider) });
  } catch (e) {
    console.error("provider detail error", e);
    return errorResponse("Erreur serveur.", 500);
  }
}
