import { NextRequest } from "next/server";
import { db } from "@/db";
import { refundRequests, bookings, users, properties } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { ok, handleApiError } from "@/lib/api";
import { refundRequestStatus } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireSession(["admin", "staff"]);

    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status");
    const limit = Math.min(Number(searchParams.get("limit") || 50), 100);
    const offset = Number(searchParams.get("offset") || 0);

    const conditions = [];
    if (status) {
      conditions.push(eq(refundRequests.status, status as typeof refundRequestStatus[number]));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, [{ count }]] = await Promise.all([
      db
        .select({
          id: refundRequests.id,
          bookingId: refundRequests.bookingId,
          paymentId: refundRequests.paymentId,
          userId: refundRequests.userId,
          amount: refundRequests.amount,
          reason: refundRequests.reason,
          status: refundRequests.status,
          reviewedBy: refundRequests.reviewedBy,
          reviewedAt: refundRequests.reviewedAt,
          reviewNote: refundRequests.reviewNote,
          createdAt: refundRequests.createdAt,
          updatedAt: refundRequests.updatedAt,
          userName: users.name,
          userEmail: users.email,
          bookingCode: sql`${bookings.id}`,
          propertyName: properties.name,
        })
        .from(refundRequests)
        .leftJoin(users, eq(refundRequests.userId, users.id))
        .leftJoin(bookings, eq(refundRequests.bookingId, bookings.id))
        .leftJoin(properties, eq(bookings.propertyId, properties.id))
        .where(where)
        .orderBy(desc(refundRequests.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(refundRequests).where(where),
    ]);

    return ok({ items, total: Number(count), limit, offset });
  } catch (error) {
    return handleApiError(error, "GET /api/admin/refund-requests");
  }
}
