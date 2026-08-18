"use server";

import { db } from "@/db";
import {
  refundRequests,
  bookings,
  users,
  payments,
  balanceLogs,
} from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { createAuditLog } from "@/lib/audit-log";
import { sendBookingRejectionEmail } from "@/lib/notifications/email";

const reviewRefundSchema = z.object({
  refundRequestId: z.string().uuid(),
  action: z.enum(["approve", "reject"]),
  note: z.string().optional(),
});

export type ReviewRefundState = {
  success?: boolean;
  error?: string;
};

export async function reviewRefundAction(
  prevState: ReviewRefundState | undefined,
  formData: FormData,
): Promise<ReviewRefundState> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { error: "Tidak terotorisasi", success: false };
    }

    if (!["admin", "staff"].includes(session.user.role as string)) {
      return { error: "Dilarang - hanya admin/staff", success: false };
    }

    const validated = reviewRefundSchema.parse({
      refundRequestId: formData.get("refundRequestId"),
      action: formData.get("action"),
      note: formData.get("note"),
    });

    const [refundRequest] = await db
      .select()
      .from(refundRequests)
      .where(eq(refundRequests.id, validated.refundRequestId))
      .limit(1);

    if (!refundRequest) {
      return { error: "Pengajuan refund tidak ditemukan", success: false };
    }

    if (refundRequest.status !== "pending") {
      return {
        error: "Pengajuan refund sudah diproses",
        success: false,
      };
    }

    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, refundRequest.paymentId))
      .limit(1);

    if (!payment) {
      return { error: "Pembayaran tidak ditemukan", success: false };
    }

    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, refundRequest.bookingId))
      .limit(1);

    const now = new Date();

    if (validated.action === "approve") {
      await db.transaction(async (tx) => {
        await tx
          .update(payments)
          .set({
            status: "refunded",
            updatedAt: now,
          })
          .where(eq(payments.id, payment.id));

        await tx
          .update(refundRequests)
          .set({
            status: "approved",
            reviewedBy: session.user.id,
            reviewedAt: now,
            reviewNote: validated.note,
            updatedAt: now,
          })
          .where(eq(refundRequests.id, refundRequest.id));

        if (booking) {
          await tx
            .update(bookings)
            .set({
              status: "cancelled",
              updatedAt: now,
            })
            .where(eq(bookings.id, booking.id));
        }

        const amount = Number(payment.amount);
        await tx
          .update(users)
          .set({
            balance: sql`${users.balance} + ${amount}`,
            updatedAt: now,
          })
          .where(eq(users.id, refundRequest.userId));

        await tx.insert(balanceLogs).values({
          userId: refundRequest.userId,
          amount: amount.toFixed(2),
          type: "refund",
          description: `Refund disetujui - Booking #${refundRequest.bookingId.slice(0, 8)} - ${validated.note ?? "Refund disetujui admin"}`,
          relatedId: refundRequest.id,
        });
      });

      const [tenant] = await db
        .select({ email: users.email, name: users.name })
        .from(users)
        .where(eq(users.id, refundRequest.userId))
        .limit(1);

      if (tenant?.email && booking) {
        sendBookingRejectionEmail(
          tenant.email,
          tenant.name,
          booking.propertyId,
          validated.note ?? "Booking dibatalkan karena refund disetujui",
        ).catch((err) =>
          console.error("Failed to send refund approval email:", err),
        );
      }

      await createAuditLog({
        action: "refund",
        targetType: "refund_request",
        targetId: refundRequest.id,
        adminId: session.user.id,
        details: {
          bookingId: refundRequest.bookingId,
          paymentId: refundRequest.paymentId,
          amount: payment.amount,
          note: validated.note,
        },
      });
    } else {
      await db
        .update(refundRequests)
        .set({
          status: "rejected",
          reviewedBy: session.user.id,
          reviewedAt: now,
          reviewNote: validated.note,
          updatedAt: now,
        })
        .where(eq(refundRequests.id, refundRequest.id));

      await createAuditLog({
        action: "refund_rejected",
        targetType: "refund_request",
        targetId: refundRequest.id,
        adminId: session.user.id,
        details: {
          bookingId: refundRequest.bookingId,
          paymentId: refundRequest.paymentId,
          amount: payment.amount,
          note: validated.note,
        },
      });
    }

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: error.issues[0]?.message || "Input tidak valid",
        success: false,
      };
    }
    console.error("reviewRefundAction error:", error);
    return { error: "Gagal memproses refund", success: false };
  }
}
