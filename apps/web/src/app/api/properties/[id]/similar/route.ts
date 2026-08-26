import { NextRequest } from "next/server";
import { db } from "@/db";
import { properties } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { ok, fail, handleApiError } from "@/lib/api";
import { calculateDistance } from "@/lib/geolocation";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: propertyId } = await params;
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "8"), 20);

    const currentProperty = await db
      .select()
      .from(properties)
      .where(eq(properties.id, propertyId))
      .limit(1);

    if (!currentProperty.length) {
      return fail("Property not found", 404);
    }

    const current = currentProperty[0];

    const candidates = await db
      .select()
      .from(properties)
      .where(
        and(
          eq(properties.isActive, true),
          eq(properties.status, "aktif"),
          ne(properties.id, propertyId),
        ),
      )
      .limit(200);

    const currentAmenities = new Set(current.amenities || []);
    const currentLat = current.latitude ? Number(current.latitude) : null;
    const currentLng = current.longitude ? Number(current.longitude) : null;

    const scored = candidates
      .map((p) => {
        const pAmenities = new Set(p.amenities || []);
        const intersection = [...currentAmenities].filter((a) => pAmenities.has(a)).length;
        const union = new Set([...currentAmenities, ...pAmenities]).size;
        const amenityJaccard = union > 0 ? intersection / union : 0;

        const typeMatch = p.type === current.type ? 1 : 0;
        const currentPrice = current.basePrice ? Number(current.basePrice) : 0;
        const pPrice = p.basePrice ? Number(p.basePrice) : 0;
        const priceSim =
          currentPrice && pPrice
            ? 1 - Math.abs(pPrice - currentPrice) / Math.max(pPrice, currentPrice)
            : 0;

        const contentSim = 0.4 * typeMatch + 0.35 * priceSim + 0.25 * amenityJaccard;

        let geoScore = 0;
        if (currentLat && currentLng && p.latitude && p.longitude) {
          const distance = calculateDistance(
            currentLat,
            currentLng,
            Number(p.latitude),
            Number(p.longitude),
          );
          geoScore = 1 / (1 + distance / 5);
        } else {
          geoScore = current.city === p.city ? 0.5 : 0;
        }

        return {
          property: p,
          score: 0.6 * contentSim + 0.4 * geoScore,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((s) => s.property);

    return ok({ data: scored });
  } catch (error) {
    return handleApiError(error, "GET /api/properties/[id]/similar");
  }
}
