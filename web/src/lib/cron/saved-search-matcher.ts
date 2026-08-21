import { db } from "@/db";
import { savedSearches, properties } from "@/db/schema";
import { eq, and, gte, desc, sql, SQLWrapper } from "drizzle-orm";
import { createNotification, sendWebPushNotification } from "@/lib/notifications";

const NOTIFICATION_INTERVAL_HOURS = 24;

export interface SavedSearchMatchResult {
  matched: number;
  notified: number;
  errors: number;
}

function buildPropertyQuery(filters: Record<string, unknown>): SQLWrapper[] {
  const conditions: SQLWrapper[] = [];

  if (filters.type) {
    conditions.push(eq(properties.type, filters.type as "kost" | "kontrakan" | "ruko"));
  }

  if (filters.minPrice || filters.maxPrice) {
    const min = filters.minPrice ? Number(filters.minPrice) : 0;
    const max = filters.maxPrice ? Number(filters.maxPrice) : Number.MAX_SAFE_INTEGER;
    conditions.push(
      sql`CAST(${properties.basePrice} AS NUMERIC) BETWEEN ${min} AND ${max}`,
    );
  }

  if (filters.location) {
    conditions.push(
      sql`${properties.address} ILIKE ${`%${filters.location}%`}`,
    );
  }

  if (filters.city) {
    conditions.push(sql`${properties.city} ILIKE ${`%${filters.city}%`}`);
  }

  if (filters.amenities && Array.isArray(filters.amenities) && filters.amenities.length > 0) {
    conditions.push(
      sql`${properties.amenities} @> ${JSON.stringify(filters.amenities)}::jsonb`,
    );
  }

  return conditions;
}

export async function matchAndNotifySavedSearches(): Promise<SavedSearchMatchResult> {
  const now = new Date();
  const result: SavedSearchMatchResult = {
    matched: 0,
    notified: 0,
    errors: 0,
  };

  const activeSearches = await db
    .select()
    .from(savedSearches)
    .where(eq(savedSearches.isActive, true))
    .orderBy(desc(savedSearches.createdAt))
    .limit(100);

  for (const search of activeSearches) {
    try {
      const lastNotifiedAt = search.lastNotifiedAt
        ? new Date(search.lastNotifiedAt)
        : null;

      if (lastNotifiedAt) {
        const hoursSinceLastNotification =
          (now.getTime() - lastNotifiedAt.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastNotification < NOTIFICATION_INTERVAL_HOURS) {
          continue;
        }
      }

      const lastMatchedAt = search.lastMatchedAt
        ? new Date(search.lastMatchedAt)
        : new Date(0);

      const filters = search.filters as Record<string, unknown>;
      const conditions = buildPropertyQuery(filters);

      conditions.push(gte(properties.createdAt, lastMatchedAt));
      conditions.push(eq(properties.status, "aktif"));
      conditions.push(eq(properties.isActive, true));

      const matchedProperties = await db
        .select({ id: properties.id })
        .from(properties)
        .where(and(...conditions))
        .limit(50);

      const matchCount = matchedProperties.length;

      if (matchCount > 0) {
        result.matched++;

        const searchName = search.name || "Pencarian tersimpan";
        const title = `${matchCount} properti baru sesuai pencarian "${searchName}"`;
        const message = "Lihat properti baru yang cocok dengan kriteria Anda.";

        await Promise.allSettled([
          createNotification(search.userId, "system", title, message),
          sendWebPushNotification(search.userId, title, message),
        ]);

        result.notified++;
      }

      await db
        .update(savedSearches)
        .set({
          lastMatchedAt: now,
          lastNotifiedAt: matchCount > 0 ? now : search.lastNotifiedAt,
          updatedAt: now,
        })
        .where(eq(savedSearches.id, search.id));
    } catch {
      result.errors++;
    }
  }

  return result;
}
