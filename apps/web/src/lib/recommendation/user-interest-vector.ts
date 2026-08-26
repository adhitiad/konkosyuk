import { db } from "@/db";
import {
  analyticsEvents,
  favorites,
  bookings,
  properties,
  userInterestVectors,
} from "@/db/schema";
import { eq, sql, and, desc, inArray } from "drizzle-orm";
import { getRedis } from "@/lib/redis";

export interface UserInterestVector {
  typeWeights: Record<string, number>;
  cityWeights: Record<string, number>;
  priceBucketWeights: Record<number, number>;
  amenitySet: string[];
  areaWeights: Record<string, number>;
}

const REDIS_KEY_PREFIX = "user:vector:";
const CACHE_TTL = 86400;

function getPriceBucket(price: number | null | undefined): number {
  if (!price) return -1;
  if (price < 500000) return 0;
  if (price < 1000000) return 1;
  if (price < 2000000) return 2;
  return 3;
}

export async function getUserInterestVector(
  userId: string,
): Promise<UserInterestVector | null> {
  const redis = await getRedis();
  const cacheKey = `${REDIS_KEY_PREFIX}${userId}`;

  const cached = await redis.get<string>(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached) as UserInterestVector;
    } catch {
      // ignore parse error
    }
  }

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const [views, userFavorites, userBookings] = await Promise.all([
    db
      .select()
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.userId, userId),
          eq(analyticsEvents.event, "property_viewed"),
          sql`${analyticsEvents.createdAt} > ${ninetyDaysAgo.toISOString()}`,
        ),
      )
      .orderBy(desc(analyticsEvents.createdAt))
      .limit(200),

    db
      .select()
      .from(favorites)
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.createdAt))
      .limit(100),

    db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.userId, userId),
          sql`${bookings.createdAt} > ${ninetyDaysAgo.toISOString()}`,
        ),
      )
      .orderBy(desc(bookings.createdAt))
      .limit(50),
  ]);

  const favoritePropertyIds = userFavorites.map((f) => f.propertyId);
  const bookedPropertyIds = userBookings.map((b) => b.propertyId);

interface PropertyViewEvent {
  properties?: {
    propertyId?: string;
  };
}

  const allPropertyIds = [
    ...new Set([
      ...views
        .map((v) => (v.properties as PropertyViewEvent | undefined)?.properties?.propertyId)
        .filter((id): id is string => Boolean(id)),
      ...favoritePropertyIds,
      ...bookedPropertyIds,
    ]),
  ];

  const propertyMap = new Map<string, {
    type?: string;
    city?: string;
    basePrice?: number;
    amenities?: string[];
    area?: string;
  }>();

  if (allPropertyIds.length > 0) {
    const propertyRows = await db
      .select({
        id: properties.id,
        type: properties.type,
        city: properties.city,
        basePrice: properties.basePrice,
        amenities: properties.amenities,
        metadata: properties.metadata,
      })
      .from(properties)
      .where(inArray(properties.id, allPropertyIds));

    for (const row of propertyRows) {
      propertyMap.set(row.id, {
        type: row.type,
        city: row.city ?? undefined,
        basePrice: row.basePrice ? Number(row.basePrice) : undefined,
        amenities: row.amenities ?? undefined,
        area: (row.metadata as Record<string, unknown> | undefined)?.area as string | undefined,
      });
    }
  }

  const typeWeights: Record<string, number> = {};
  const cityWeights: Record<string, number> = {};
  const priceBucketWeights: Record<number, number> = {};
  const amenitySet = new Set<string>();
  const areaWeights: Record<string, number> = {};

  for (const view of views) {
    const props = view.properties as PropertyViewEvent | undefined;
    const propertyId = props?.properties?.propertyId;
    const property = propertyId ? propertyMap.get(propertyId) : undefined;

    if (property?.type) {
      typeWeights[property.type] = (typeWeights[property.type] || 0) + 0.4;
    }
    if (property?.city) {
      cityWeights[property.city] = (cityWeights[property.city] || 0) + 0.4;
    }
    if (property?.basePrice) {
      const bucket = getPriceBucket(property.basePrice);
      if (bucket >= 0) {
        priceBucketWeights[bucket] = (priceBucketWeights[bucket] || 0) + 0.4;
      }
    }
    property?.amenities?.forEach((a) => amenitySet.add(a));
    if (property?.area) {
      areaWeights[property.area] = (areaWeights[property.area] || 0) + 0.4;
    }
  }

  for (const fav of userFavorites) {
    const property = propertyMap.get(fav.propertyId);
    if (property?.type) {
      typeWeights[property.type] = (typeWeights[property.type] || 0) + 0.4;
    }
    if (property?.city) {
      cityWeights[property.city] = (cityWeights[property.city] || 0) + 0.4;
    }
    if (property?.basePrice) {
      const bucket = getPriceBucket(property.basePrice);
      if (bucket >= 0) {
        priceBucketWeights[bucket] = (priceBucketWeights[bucket] || 0) + 0.4;
      }
    }
    property?.amenities?.forEach((a) => amenitySet.add(a));
    if (property?.area) {
      areaWeights[property.area] = (areaWeights[property.area] || 0) + 0.4;
    }
  }

  for (const booking of userBookings) {
    const property = propertyMap.get(booking.propertyId);
    if (property?.type) {
      typeWeights[property.type] = (typeWeights[property.type] || 0) + 1.0;
    }
    if (property?.city) {
      cityWeights[property.city] = (cityWeights[property.city] || 0) + 1.0;
    }
    if (property?.basePrice) {
      const bucket = getPriceBucket(property.basePrice);
      if (bucket >= 0) {
        priceBucketWeights[bucket] = (priceBucketWeights[bucket] || 0) + 1.0;
      }
    }
    property?.amenities?.forEach((a) => amenitySet.add(a));
    if (property?.area) {
      areaWeights[property.area] = (areaWeights[property.area] || 0) + 1.0;
    }
  }

  const vector: UserInterestVector = {
    typeWeights,
    cityWeights,
    priceBucketWeights,
    amenitySet: Array.from(amenitySet),
    areaWeights,
  };

  try {
    await redis.set(cacheKey, JSON.stringify(vector), CACHE_TTL);
  } catch {
    // Redis failure should not break the flow
  }

  try {
    await db
      .insert(userInterestVectors)
      .values({
        userId,
        typeWeights: vector.typeWeights,
        cityWeights: vector.cityWeights,
        priceBucketWeights: vector.priceBucketWeights,
        amenitySet: vector.amenitySet,
        areaWeights: vector.areaWeights,
      })
      .onConflictDoUpdate({
        target: userInterestVectors.userId,
        set: {
          typeWeights: vector.typeWeights,
          cityWeights: vector.cityWeights,
          priceBucketWeights: vector.priceBucketWeights,
          amenitySet: vector.amenitySet,
          areaWeights: vector.areaWeights,
          updatedAt: new Date(),
        },
      });
  } catch {
    // DB persistence failure should not break the flow
  }

  return vector;
}
