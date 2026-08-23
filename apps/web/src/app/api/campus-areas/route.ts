import { db } from "@/db";
import { campusAreas } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ok, handleApiError } from "@/lib/api";
import { logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const areas = await db
      .select({
        id: campusAreas.id,
        slug: campusAreas.slug,
        name: campusAreas.name,
        imageKey: campusAreas.imageKey,
        propertyCount: campusAreas.propertyCount,
      })
      .from(campusAreas)
      .where(eq(campusAreas.isActive, true))
      .orderBy(campusAreas.sortOrder, campusAreas.name);

    return ok({ areas });
  } catch (error) {
    logError(error, "GET /api/campus-areas");
    return handleApiError(error, "GET /api/campus-areas");
  }
}
