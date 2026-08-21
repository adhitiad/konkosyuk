import { db } from "@/db";
import { properties, popularAreas, campusAreas } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function updateAreaCounts(): Promise<void> {
  console.log(`[${new Date().toISOString()}] Running update area counts...`);

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

    console.log("Update area counts completed:", {
      updatedPopular,
      updatedCampus,
    });
  } catch (error) {
    console.error("Update area counts failed:", error);
  }
}
