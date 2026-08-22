import { db } from "@/db";
import { popularAreas } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ok, handleApiError } from "@/lib/api";
import { logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const areas = await db
      .select({
        id: popularAreas.id,
        slug: popularAreas.slug,
        name: popularAreas.name,
        imageKey: popularAreas.imageKey,
        propertyCount: popularAreas.propertyCount,
      })
      .from(popularAreas)
      .where(eq(popularAreas.isActive, true))
      .orderBy(popularAreas.sortOrder, popularAreas.name);

    return ok({ areas });
  } catch (error) {
    logError(error, "GET /api/popular-areas");
    return handleApiError(error, "GET /api/popular-areas");
  }
}
