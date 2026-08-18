import { db } from "@/db";
import { properties, units, users, propertyTags, payments } from "@/db/schema";
import { eq, and, sql, desc, inArray } from "drizzle-orm";

/**
 * Example: Eager Loading dengan Drizzle ORM `with`
 *
 * Ini adalah contoh query yang efisien untuk menghindari N+1 query.
 * Daripada melakukan query terpisah untuk setiap properti (N+1),
 * kita load semua relasi dalam satu query menggunakan `with`.
 */

// ❌ BURUK: N+1 Query
// Untuk setiap properti, kita query unitsnya secara terpisah
export async function getPropertiesWithNPlusOne() {
  const propertiesList = await db.select().from(properties).limit(10);

  for (const property of propertiesList) {
    // Query terpisah untuk SETIAP properti = N+1
    void (await db
      .select()
      .from(units)
      .where(eq(units.propertyId, property.id)));
    void (await db.select().from(users).where(eq(users.id, property.ownerId)));
  }
}

// ✅ BAIK: Eager Loading dengan `with`
// Semua relasi di-load dalam query yang sama
export async function getPropertiesEagerLoaded() {
  const propertiesList = await db
    .select()
    .from(properties)
    .leftJoin(units, eq(units.propertyId, properties.id))
    .leftJoin(users, eq(users.id, properties.ownerId))
    .limit(10);

  return propertiesList;
}

// ✅ LEBIH BAIK: Menggunakan Drizzle Relations dengan `with`
// Drizzle akan otomatis melakukan join yang efisien
export async function getPropertiesWithRelations() {
  const propertiesList = await db.query.properties.findMany({
    with: {
      owner: true,
      units: true,
      bookings: {
        where: (bookings, { eq, gte }) =>
          and(
            eq(bookings.status, "confirmed"),
            gte(bookings.startDate, new Date()),
          ),
        limit: 5,
      },
    },
    where: (properties, { eq }) =>
      and(eq(properties.isActive, true), eq(properties.status, "aktif")),
    orderBy: desc(properties.createdAt),
    limit: 20,
  });

  return propertiesList;
}

// ✅ CONTOH LAIN: Eager Loading untuk Booking dengan Payment
export async function getBookingWithPayment(bookingId: string) {
  const booking = await db.query.bookings.findFirst({
    where: (bookings, { eq }) => eq(bookings.id, bookingId),
    with: {
      property: {
        with: {
          owner: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      unit: true,
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
      payments: {
        orderBy: desc(payments.createdAt),
      },
    },
  });

  return booking;
}

// ✅ CONTOH LAIN: Batch Query untuk menghindari N+1
// Berguna ketika kita butuh data dari beberapa tabel yang berhubungan
export async function getPropertiesWithTagsAndUnits(propertyIds: string[]) {
  // 1 query untuk properties
  const propertiesList = await db
    .select()
    .from(properties)
    .where(inArray(properties.id, propertyIds));

  // 1 query untuk SEMUA units dari properties tersebut
  const allUnits = await db
    .select()
    .from(units)
    .where(inArray(units.propertyId, propertyIds));

  // 1 query untuk SEMUA tags dari properties tersebut
  const allPropertyTags = await db
    .select()
    .from(propertyTags)
    .where(inArray(propertyTags.propertyId, propertyIds));

  // Group data di memory (bukan di database)
  const unitsByProperty = new Map<string, typeof allUnits>();
  const tagsByProperty = new Map<string, typeof allPropertyTags>();

  for (const unit of allUnits) {
    const existing = unitsByProperty.get(unit.propertyId) ?? [];
    unitsByProperty.set(unit.propertyId, [...existing, unit]);
  }

  for (const pt of allPropertyTags) {
    const existing = tagsByProperty.get(pt.propertyId) ?? [];
    tagsByProperty.set(pt.propertyId, [...existing, pt]);
  }

  return propertiesList.map((property) => ({
    ...property,
    units: unitsByProperty.get(property.id) ?? [],
    tags: tagsByProperty.get(property.id) ?? [],
  }));
}

// ✅ TIPS: Gunakan `select` dengan eksplisit columns untuk menghindari over-fetching
export async function getPropertyListOptimized() {
  return db
    .select({
      id: properties.id,
      name: properties.name,
      type: properties.type,
      city: properties.city,
      basePrice: properties.basePrice,
      images: properties.images,
      isActive: properties.isActive,
      isFeatured: properties.isFeatured,
      createdAt: properties.createdAt,
      ownerName: users.name,
      unitCount: sql<number>`count(${units.id})`,
    })
    .from(properties)
    .leftJoin(users, eq(users.id, properties.ownerId))
    .leftJoin(units, eq(units.propertyId, properties.id))
    .where(and(eq(properties.isActive, true), eq(properties.status, "aktif")))
    .groupBy(properties.id, users.name)
    .orderBy(desc(properties.createdAt))
    .limit(20);
}
