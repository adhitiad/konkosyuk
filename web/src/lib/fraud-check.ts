import { db } from "@/db";
import { payments, bookings } from "@/db/schema";
import { eq, and, or, gte, sql } from "drizzle-orm";

export interface FraudCheckResult {
  isBlocked: boolean;
  reason?: string;
  requiresManualReview: boolean;
}

export async function checkFraudFlags(
  userId: string,
  amount: number,
): Promise<FraudCheckResult> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(payments)
    .innerJoin(bookings, eq(payments.bookingId, bookings.id))
    .where(
      and(
        eq(bookings.userId, userId),
        or(eq(payments.status, "failed"), eq(payments.status, "expired")),
        gte(payments.createdAt, twentyFourHoursAgo),
      ),
    );

  const failedCount = Number(count ?? 0);

  if (failedCount > 3) {
    return {
      isBlocked: true,
      reason: "Terlalu banyak percobaan gagal",
      requiresManualReview: false,
    };
  }

  return {
    isBlocked: false,
    requiresManualReview: amount > 10000000,
  };
}
