import { NextRequest } from "next/server";
import { db } from "@/db";
import {
  bookings,
  units,
  properties,
  payments,
  refundRequests,
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { ok, fail, handleApiError } from "@/lib/api";
import type { Role } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> },
) {
  try {
    const session = await requireSession(["cust"] as Role[]);
    const { bookingId } = await params;

    const [booking] = await db
      .select({
        id: bookings.id,
        userId: bookings.userId,
        propertyId: bookings.propertyId,
        unitId: bookings.unitId,
        bookingType: bookings.bookingType,
        status: bookings.status,
        startDate: bookings.startDate,
        endDate: bookings.endDate,
        metadata: bookings.metadata,
        createdAt: bookings.createdAt,
        updatedAt: bookings.updatedAt,
        propertyName: properties.name,
        propertyAddress: properties.address,
        unitName: units.name,
        unitPrice: units.price,
      })
      .from(bookings)
      .leftJoin(properties, eq(bookings.propertyId, properties.id))
      .leftJoin(units, eq(bookings.unitId, units.id))
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!booking) {
      return fail("Booking not found", 404);
    }

    if (booking.userId !== session.user.id) {
      return fail("Forbidden", 403);
    }

    const bookingPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.bookingId, bookingId))
      .orderBy(desc(payments.createdAt));

    const bookingRefundRequests = await db
      .select()
      .from(refundRequests)
      .where(eq(refundRequests.bookingId, bookingId))
      .orderBy(desc(refundRequests.createdAt));

    return ok({
      ...booking,
      payments: bookingPayments,
      refundRequests: bookingRefundRequests,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
