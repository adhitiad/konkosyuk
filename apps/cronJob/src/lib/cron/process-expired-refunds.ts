import { db } from "@/db";
import {
  payments,
  bookings,
  refundRequests,
  users,
  balanceLogs,
} from "@konkosyuk/shared/db/schema";
import { eq, sql, and, lt } from "drizzle-orm";
import { createAuditLog } from "@/lib/audit-log";
import { logError } from "@konkosyuk/shared/lib/logger";
import { handleReferralFailureOnRefund } from "@/lib/referrals/verification";

export async function processExpiredPaymentRefunds() {
  try {
    const now = new Date();

    const expiredPayments = await db
      .select({
        payment: payments,
        booking: bookings,
      })
      .from(payments)
      .innerJoin(bookings, eq(payments.bookingId, bookings.id))
      .where(
        and(
          eq(payments.status, "expired"),
          eq(payments.purpose, "dp"),
          lt(bookings.startDate, now),
        ),
      )
      .limit(100);

    const processed = [];

    for (const { payment, booking } of expiredPayments) {
      const existingRefund = await db
        .select()
        .from(refundRequests)
        .where(
          and(
            eq(refundRequests.paymentId, payment.id),
            eq(refundRequests.status, "pending"),
          ),
        )
        .limit(1);

      if (existingRefund.length > 0) {
        continue;
      }

      const amount = Number(payment.amount);
      const platformFeeRate = 0.022;
      const ownerFeeRate = 0.018;
      const platformFee = Math.round(amount * platformFeeRate);
      const ownerFee = Math.round(amount * ownerFeeRate);
      const userRefundAmount = amount - platformFee - ownerFee;

      await db.transaction(async (tx) => {
        await tx
          .update(payments)
          .set({ status: "refunded", updatedAt: now })
          .where(eq(payments.id, payment.id));

        await handleReferralFailureOnRefund(tx, payment.id);

        await tx
          .update(bookings)
          .set({ status: "cancelled", updatedAt: now })
          .where(eq(bookings.id, booking.id));

        await tx
          .update(users)
          .set({
            balance: sql`${users.balance} + ${userRefundAmount}`,
            updatedAt: now,
          })
          .where(eq(users.id, booking.userId));

        await tx.insert(balanceLogs).values({
          userId: booking.userId,
          amount: userRefundAmount.toFixed(2),
          type: "refund",
          description: `Auto-refund - Booking #${booking.id.slice(0, 8)} - Pembayaran expired sebelum booking dimulai`,
          relatedId: payment.id,
        });

        const [owner] = await tx
          .select()
          .from(users)
          .where(eq(users.id, booking.userId))
          .limit(1);

        if (owner) {
          await tx
            .update(users)
            .set({
              balance: sql`${users.balance} + ${ownerFee}`,
              updatedAt: now,
            })
            .where(eq(users.id, owner.id));

          await tx.insert(balanceLogs).values({
            userId: owner.id,
            amount: ownerFee.toFixed(2),
            type: "refund",
            description: `Fee refund auto - booking #${booking.id.slice(0, 8)} - 1.8% dari refund`,
            relatedId: payment.id,
          });
        }
      });

      await createAuditLog({
        action: "refund",
        targetType: "payment",
        targetId: payment.id,
        details: {
          bookingId: booking.id,
          paymentId: payment.id,
          amount: payment.amount,
          platformFee,
          ownerFee,
          userRefundAmount,
          reason: "Auto-refund: payment expired before booking start",
        },
      });

      processed.push({ paymentId: payment.id, bookingId: booking.id });
    }

    return { success: true, processedCount: processed.length, processed };
  } catch (error) {
    logError(error, "processExpiredPaymentRefunds error");
    return { success: false, error: "Gagal memproses refund otomatis" };
  }
}
