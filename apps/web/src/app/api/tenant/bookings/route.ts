import { NextRequest } from "next/server";
import { db } from "@/db";
import { bookings, units, properties } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { ok, handleApiError } from "@/lib/api";
import { z } from "zod";
import type { Role } from "@/lib/auth";

const tenantBookingsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z
    .enum([
      "pending_dp",
      "awaiting_owner_approval",
      "awaiting_full_payment",
      "confirmed",
      "completed",
      "rejected",
      "cancelled",
    ])
    .optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession(["cust"] as Role[]);
    const url = new URL(req.url);
    const query = tenantBookingsQuerySchema.parse(Object.fromEntries(url.searchParams));
    const { page, limit, status } = query;

    const conditions = [eq(bookings.userId, session.user.id)];
    if (status) {
      conditions.push(eq(bookings.status, status));
    }

    const where = and(...conditions);

    const [data, [{ count: totalCount }]] = await Promise.all([
      db
        .select({
          id: bookings.id,
          propertyId: bookings.propertyId,
          unitId: bookings.unitId,
          bookingType: bookings.bookingType,
          status: bookings.status,
          startDate: bookings.startDate,
          endDate: bookings.endDate,
          metadata: bookings.metadata,
          createdAt: bookings.createdAt,
          propertyName: properties.name,
          propertyAddress: properties.address,
          unitName: units.name,
          unitPrice: units.price,
        })
        .from(bookings)
        .leftJoin(properties, eq(bookings.propertyId, properties.id))
        .leftJoin(units, eq(bookings.unitId, units.id))
        .where(where)
        .orderBy(desc(bookings.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      db
        .select({ count: sql<number>`count(*)` })
        .from(bookings)
        .where(where),
    ]);

    const total = Number(totalCount);
    const totalPages = Math.ceil(total / limit);

    return ok({ data, meta: { total, page, limit, totalPages } });
  } catch (error) {
    return handleApiError(error);
  }
}
