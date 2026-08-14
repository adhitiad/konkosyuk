import { db } from "@/db";
import { bookings, units } from "@/db/schema";
import { eq, sql, desc, lt, and, inArray } from "drizzle-orm";
import {
  createNotification,
  sendWebPushNotification,
} from "@/lib/notifications";

export interface CleanupResult {
  cancelledCount: number;
  unitReleasedCount: number;
  cancelledBookings: Array<{
    id: string;
    unitId: string;
    propertyId: string;
    userId: string;
    createdAt: string;
  }>;
}

export async function cleanupExpiredBookings(): Promise<CleanupResult> {
  const now = new Date();
  const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);

  const expiredBookings = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.status, "pending_dp"),
        lt(bookings.createdAt, sixHoursAgo),
      ),
    )
    .orderBy(desc(bookings.createdAt));

  if (expiredBookings.length === 0) {
    return {
      cancelledCount: 0,
      unitReleasedCount: 0,
      cancelledBookings: [],
    };
  }

  const bookingIds = expiredBookings.map((b) => b.id);
  const unitIds = expiredBookings.map((b) => b.unitId);

  await db.transaction(async (tx) => {
    await tx
      .update(bookings)
      .set({
        status: "cancelled",
        updatedAt: now,
      })
      .where(
        and(
          eq(bookings.status, "pending_dp"),
          inArray(bookings.id, bookingIds),
        ),
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
  });

  const notificationPromises = expiredBookings.map((booking) => {
    const title = "Booking Dibatalkan";
    const message =
      "Booking Anda dibatalkan otomatis karena DP tidak dibayar dalam 6 jam.";

    return Promise.all([
      createNotification(booking.userId, "booking", title, message),
      sendWebPushNotification(booking.userId, title, message),
    ]);
  });

  await Promise.allSettled(notificationPromises);

  return {
    cancelledCount: expiredBookings.length,
    unitReleasedCount: unitIds.length,
    cancelledBookings: expiredBookings.map((b) => ({
      id: b.id,
      unitId: b.unitId,
      propertyId: b.propertyId,
      userId: b.userId,
      createdAt: b.createdAt.toISOString(),
    })),
  };
}
