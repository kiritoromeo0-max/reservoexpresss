import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { jsonResponse, errorResponse } from "@/lib/session";
import { mapReview } from "@/lib/mappers";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reviews = await db.review.findMany({
      where: { providerId: id },
      include: { client: true, appointment: { include: { service: true } } },
      orderBy: { createdAt: "desc" },
    });
    return jsonResponse({ reviews: reviews.map(mapReview) });
  } catch (e) {
    console.error("reviews error", e);
    return errorResponse("Erreur serveur.", 500);
  }
}
