import { db } from "@/db";
import { bookings, units, inspections, properties } from "@/db/schema";
import { eq, lt, and, inArray, desc } from "drizzle-orm";

export interface CompleteBookingsResult {
  completedCount: number;
  inspectionCreatedCount: number;
  unitReleasedCount: number;
  completedBookings: Array<{
    id: string;
    unitId: string;
    propertyId: string;
    userId: string;
    endDate: string;
  }>;
}

export async function completeExpiredBookings(): Promise<CompleteBookingsResult> {
  const now = new Date();

  const expiredBookings = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.status, "confirmed"), lt(bookings.endDate, now)))
    .orderBy(desc(bookings.createdAt));

  if (expiredBookings.length === 0) {
    return {
      completedCount: 0,
      inspectionCreatedCount: 0,
      unitReleasedCount: 0,
      completedBookings: [],
    };
  }

  const completedBookings: CompleteBookingsResult["completedBookings"] = [];
  let inspectionCreatedCount = 0;
  let unitReleasedCount = 0;

  await db.transaction(async (tx) => {
    const bookingIds = expiredBookings.map((b) => b.id);
    const unitIds = expiredBookings.map((b) => b.unitId);

    await tx
      .update(bookings)
      .set({
        status: "completed",
        updatedAt: now,
      })
      .where(
        and(eq(bookings.status, "confirmed"), inArray(bookings.id, bookingIds)),
      );

    if (unitIds.length > 0) {
      await tx
        .update(units)
        .set({
          status: "available",
          updatedAt: now,
        })
        .where(and(eq(units.status, "booked"), inArray(units.id, unitIds)));
    }

    const propertyIds = Array.from(
      new Set(expiredBookings.map((b) => b.propertyId)),
    );
    const propertiesMap = new Map();

    if (propertyIds.length > 0) {
      const propertiesList = await tx
        .select()
        .from(properties)
        .where(inArray(properties.id, propertyIds));

      for (const p of propertiesList) {
        propertiesMap.set(p.id, p);
      }
    }

    for (const booking of expiredBookings) {
      completedBookings.push({
        id: booking.id,
        unitId: booking.unitId,
        propertyId: booking.propertyId,
        userId: booking.userId,
        endDate: booking.endDate.toISOString(),
      });

      const property = propertiesMap.get(booking.propertyId);

      try {
        await tx.insert(inspections).values({
          bookingId: booking.id,
          propertyId: booking.propertyId,
          unitId: booking.unitId,
          type: "move_out",
          performedBy: booking.userId,
          witnessId: property?.ownerId || null,
          notes: `Auto-created move-out inspection for booking ${booking.id.slice(0, 8)}`,
        });
        inspectionCreatedCount++;
      } catch (error) {
        console.error(
          `Failed to create move-out inspection for booking ${booking.id}:`,
          error,
        );
      }
    }
  });

  unitReleasedCount = expiredBookings.length;

  return {
    completedCount: expiredBookings.length,
    inspectionCreatedCount,
    unitReleasedCount,
    completedBookings,
  };
}
