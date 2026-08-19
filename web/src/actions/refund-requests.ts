"use server";

import { db } from "@/db";
import {
  bookings,
  payments,
  refundRequests,
  users,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { createAuditLog } from "@/lib/audit-log";
import { createNotification } from "@/lib/notifications";
import { sendRefundApprovalWhatsApp } from "@/lib/notifications/whatsapp";

const requestRefundSchema = z.object({
  bookingId: z.string().uuid(),
  paymentId: z.string().uuid(),
  reason: z.string().min(10, "Alasan refund minimal 10 karakter"),
});

export type RequestRefundState = {
  success?: boolean;
  error?: string;
};

export async function requestRefundAction(
  prevState: RequestRefundState | undefined,
  formData: FormData,
): Promise<RequestRefundState> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { error: "Tidak terotorisasi", success: false };
    }

    const validated = requestRefundSchema.parse({
      bookingId: formData.get("bookingId"),
      paymentId: formData.get("paymentId"),
      reason: formData.get("reason"),
    });

    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, validated.bookingId))
      .limit(1);

    if (!booking) {
      return { error: "Booking tidak ditemukan", success: false };
    }

    if (booking.userId !== session.user.id) {
      return {
        error: "Anda tidak berhak mengajukan refund untuk booking ini",
        success: false,
      };
    }

    const terminalBookingStatuses = [
      "completed",
      "cancelled",
      "rejected",
    ] as const;
    if (
      terminalBookingStatuses.includes(
        booking.status as (typeof terminalBookingStatuses)[number],
      )
    ) {
      return {
        error: `Booking dalam status ${booking.status} tidak dapat diajukan refund`,
        success: false,
      };
    }

    if (booking.startDate < new Date()) {
      return {
        error: "Booking sudah dimulai, refund hanya bisa diajukan sebelum tanggal mulai",
        success: false,
      };
    }

    const [paymentWithBooking] = await db
      .select({
        payment: payments,
        booking: bookings,
      })
      .from(payments)
      .innerJoin(bookings, eq(payments.bookingId, bookings.id))
      .where(
        and(
          eq(payments.id, validated.paymentId),
          eq(payments.bookingId, validated.bookingId),
          eq(bookings.userId, session.user.id),
        ),
      )
      .limit(1);

    if (!paymentWithBooking) {
      return { error: "Pembayaran tidak ditemukan", success: false };
    }

    const payment = paymentWithBooking.payment;
    const paymentBooking = paymentWithBooking.booking;

    if (paymentBooking.status === "completed" || paymentBooking.status === "cancelled" || paymentBooking.status === "rejected") {
      return {
        error: `Booking dalam status ${paymentBooking.status} tidak dapat diajukan refund`,
        success: false,
      };
    }

    if (paymentBooking.startDate < new Date()) {
      return {
        error: "Booking sudah dimulai, refund hanya bisa diajukan sebelum tanggal mulai",
        success: false,
      };
    }

    if (payment.status !== "success") {
      return {
        error: "Hanya pembayaran berhasil yang dapat diajukan refund",
        success: false,
      };
    }

    if (payment.purpose !== "dp" && payment.purpose !== "full_payment") {
      return {
        error: "Tipe pembayaran tidak dapat di-refund",
        success: false,
      };
    }

    const existingPending = await db
      .select()
      .from(refundRequests)
      .where(
        and(
          eq(refundRequests.paymentId, validated.paymentId),
          eq(refundRequests.status, "pending"),
        ),
      )
      .limit(1);

    if (existingPending.length > 0) {
      return {
        error: "Pengajuan refund untuk pembayaran ini sedang dalam proses",
        success: false,
      };
    }

    const amount = Number(payment.amount);

    const [refundRequest] = await db
      .insert(refundRequests)
      .values({
        bookingId: validated.bookingId,
        paymentId: validated.paymentId,
        userId: session.user.id,
        amount: payment.amount,
        reason: validated.reason,
        status: "pending",
      })
      .returning();

    if (booking) {
      const [owner] = await db
        .select({ id: users.id, name: users.name, email: users.email, phone: users.phone })
        .from(users)
        .where(eq(users.id, booking.userId))
        .limit(1);

      if (owner) {
        await createNotification(
          owner.id,
          "booking",
          "Pengajuan Refund Baru",
          `Tenant mengajukan refund untuk booking #${booking.id.slice(0, 8)}. Silakan review di dashboard admin.`,
          refundRequest.id,
        );

        if (owner.phone) {
          sendRefundApprovalWhatsApp(
            owner.phone,
            owner.name,
            0,
            booking.id.slice(0, 8),
          ).catch((err) =>
            console.error("Failed to send refund request WhatsApp to owner:", err),
          );
        }
      }
    }

    await createAuditLog({
      action: "refund_request",
      targetType: "refund_request",
      targetId: refundRequest.id,
      adminId: session.user.id,
      details: {
        bookingId: validated.bookingId,
        paymentId: validated.paymentId,
        amount,
        reason: validated.reason,
      },
    });

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: error.issues[0]?.message || "Input tidak valid",
        success: false,
      };
    }
    console.error("requestRefundAction error:", error);
    return { error: "Gagal mengajukan refund", success: false };
  }
}
