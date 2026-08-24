import { NextRequest } from "next/server";
import { db } from "@/db";
import { units, roomFacilities } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { ok, handleApiError } from "@/lib/api";
import { logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const propertyId = (await params).id;

    const unitsRows = await db
      .select({
        id: units.id,
        name: units.name,
        description: units.description,
        price: units.price,
        capacity: units.capacity,
        size: units.size,
        status: units.status,
        roomSize: units.roomSize,
        electricityIncluded: units.electricityIncluded,
        furnitureIncluded: units.furnitureIncluded,
      })
      .from(units)
      .where(eq(units.propertyId, propertyId))
      .orderBy(units.createdAt, units.name);

    const unitIds = unitsRows.map((u) => u.id);
    const facilitiesRows =
      unitIds.length > 0
        ? await db
            .select({
              unitId: roomFacilities.unitId,
              category: roomFacilities.category,
              name: roomFacilities.name,
              icon: roomFacilities.icon,
            })
            .from(roomFacilities)
            .where(inArray(roomFacilities.unitId, unitIds))
            .orderBy(roomFacilities.sortOrder, roomFacilities.name)
        : [];

    const facilitiesMap = new Map<string, {
      kamar: { name: string; icon: string }[];
      kamar_mandi: { name: string; icon: string }[];
      umum: { name: string; icon: string }[];
    }>();

    for (const unit of unitsRows) {
      facilitiesMap.set(unit.id, {
        kamar: [],
        kamar_mandi: [],
        umum: [],
      });
    }

    for (const f of facilitiesRows) {
      const unitFacilities = facilitiesMap.get(f.unitId);
      if (!unitFacilities) continue;

      const category = f.category as keyof typeof unitFacilities;
      if (category in unitFacilities) {
        (unitFacilities as Record<string, { name: string; icon: string }[]>)[category].push({
          name: f.name,
          icon: f.icon,
        });
      }
    }

    const result = unitsRows.map((unit) => ({
      ...unit,
      facilities: facilitiesMap.get(unit.id) ?? {
        kamar: [],
        kamar_mandi: [],
        umum: [],
      },
    }));

    return ok({ units: result });
  } catch (error) {
    logError(error, "GET /api/properties/[id]/units");
    return handleApiError(error, "GET /api/properties/[id]/units");
  }
}
