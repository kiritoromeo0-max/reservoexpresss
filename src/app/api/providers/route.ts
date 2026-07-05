import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { jsonResponse, errorResponse } from "@/lib/session";
import { mapProvider } from "@/lib/mappers";
import { haversineKm } from "@/lib/slots";

export const runtime = "nodejs";

// GET /api/providers?category=&q=&lat=&lng=&maxDistance=&sort=
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || undefined;
    const q = searchParams.get("q")?.trim().toLowerCase() || undefined;
    const lat = searchParams.get("lat") ? Number(searchParams.get("lat")) : undefined;
    const lng = searchParams.get("lng") ? Number(searchParams.get("lng")) : undefined;
    const maxDistance = searchParams.get("maxDistance")
      ? Number(searchParams.get("maxDistance"))
      : undefined;
    const sort = searchParams.get("sort") || "distance"; // distance | rating | name

    const providers = await db.provider.findMany({
      where: {
        isActive: true,
        ...(category && category !== "all" ? { category } : {}),
        ...(q
          ? {
              OR: [
                { businessName: { contains: q } },
                { description: { contains: q } },
                { city: { contains: q } },
                { address: { contains: q } },
              ],
            }
          : {}),
      },
      include: { services: true },
    });

    let mapped = providers.map((p) => {
      const distanceKm =
        lat != null && lng != null ? haversineKm(lat, lng, p.lat, p.lng) : undefined;
      return { ...mapProvider(p), distanceKm };
    });

    // Filter by distance
    if (maxDistance && lat != null && lng != null) {
      mapped = mapped.filter(
        (p) => p.distanceKm != null && p.distanceKm <= maxDistance
      );
    }

    // Sort
    if (sort === "rating") {
      mapped.sort((a, b) => b.rating - a.rating);
    } else if (sort === "name") {
      mapped.sort((a, b) => a.businessName.localeCompare(b.businessName));
    } else {
      // distance: undefined distances go last
      mapped.sort((a, b) => {
        if (a.distanceKm == null) return 1;
        if (b.distanceKm == null) return -1;
        return a.distanceKm - b.distanceKm;
      });
    }

    return jsonResponse({ providers: mapped });
  } catch (e) {
    console.error("providers list error", e);
    return errorResponse("Erreur serveur.", 500);
  }
}
