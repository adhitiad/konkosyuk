import { db } from "@/db";
import { properties, popularAreas, campusAreas } from "@konkosyuk/shared/db/schema";
import { eq, sql } from "drizzle-orm";
import { logInfo, logError } from "@konkosyuk/shared/lib/logger";

export async function updateAreaCounts(): Promise<void> {
  // F-2 note: idempotent by design — menghitung ulang dari data listing,
  // bukan increment counter. Jika dijalankan berulang kali, hasilnya sama.
  logInfo("Running update area counts");

  try {
    const cityCounts = await db
      .select({
        city: properties.city,
        count: sql<number>`count(*)::int`,
      })
      .from(properties)
      .where(eq(properties.isActive, true))
      .groupBy(properties.city);

    const cityMap = new Map<string, number>();
    for (const row of cityCounts) {
      if (row.city) {
        cityMap.set(row.city.toLowerCase(), Number(row.count));
      }
    }

    const popularAreasList = await db.select().from(popularAreas);
    let updatedPopular = 0;

    for (const area of popularAreasList) {
      const cityKey = area.name.toLowerCase().replace("kos ", "").trim();
      const count = cityMap.get(cityKey) || 0;

      if (count !== area.propertyCount) {
        await db
          .update(popularAreas)
          .set({ propertyCount: count, updatedAt: new Date() })
          .where(eq(popularAreas.id, area.id));
        updatedPopular++;
      }
    }

    const campusList = await db.select().from(campusAreas);
    let updatedCampus = 0;

    for (const campus of campusList) {
      const campusName = campus.name.toLowerCase();
      let count = 0;

      for (const [city, cityCount] of cityMap) {
        if (campusName.includes(city) || city.includes(campusName)) {
          count += cityCount;
        }
      }

      if (count !== campus.propertyCount) {
        await db
          .update(campusAreas)
          .set({ propertyCount: count, updatedAt: new Date() })
          .where(eq(campusAreas.id, campus.id));
        updatedCampus++;
      }
    }

    logInfo("Update area counts completed", { updatedPopular, updatedCampus });
  } catch (error) {
    logError(error, "Update area counts failed");
  }
}
