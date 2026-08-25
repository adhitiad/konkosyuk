"use server";

import { db } from "@/db";
import { payments, bookings, units } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import type { Role } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit-log";
import { logError } from "@/lib/logger";
import { validateActionCsrf } from "@/lib/api-auth";
import { handleReferralFailureOnRefund } from "@/lib/referrals/verification";

const createManualPaymentSchema = z.object({
  userId: z.string().uuid(),
  bookingId: z.string().uuid(),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .refine(
      (val) => {
        const num = Number(val);
        return num > 0 && num < 1e12;
      },
      {
        message: "Amount harus angka positif",
      },
    ),
  provider: z.enum(["doku", "ipaymu", "nicepay"]),
  purpose: z.enum(["dp", "full_payment"]),
  status: z
    .enum(["pending", "success", "failed", "expired", "refunded"])
    .default("pending"),
});

export type CreateManualPaymentState = {
  success?: boolean;
  error?: string;
  data?: unknown;
};

export async function createManualPaymentAction(
  prevState: CreateManualPaymentState | undefined,
  formData: FormData,
): Promise<CreateManualPaymentState> {
  const csrfError = await validateActionCsrf(formData);
  if (csrfError) {
    return { error: csrfError, success: false };
  }

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { error: "Tidak terotorisasi", success: false };
    }

    if (!["admin", "staff"].includes(session.user.role as Role)) {
      return { error: "Dilarang", success: false };
    }

    const validated = createManualPaymentSchema.parse({
      userId: formData.get("userId"),
      bookingId: formData.get("bookingId"),
      amount: formData.get("amount"),
      provider: formData.get("provider"),
      purpose: formData.get("purpose"),
      status: formData.get("status") || "pending",
    });

    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, validated.bookingId))
      .limit(1);

    if (!booking) {
      return { error: "Booking tidak ditemukan", success: false };
    }

    if (booking.userId !== validated.userId) {
      return { error: "User tidak sesuai dengan booking", success: false };
    }

    const [payment] = await db
      .insert(payments)
      .values({
        bookingId: validated.bookingId,
        provider: validated.provider,
        purpose: validated.purpose,
        amount: validated.amount,
        currency: "IDR",
        status: validated.status,
        paidAt: validated.status === "success" ? new Date() : null,
        metadata: {
          manual: true,
          createdBy: session.user.id,
        },
      })
      .returning();

    if (validated.status === "success") {
      if (validated.purpose === "dp") {
        const nextStatus =
          booking.bookingType === "request"
            ? "awaiting_owner_approval"
            : "awaiting_full_payment";

        await db
          .update(bookings)
          .set({ status: nextStatus, updatedAt: new Date() })
          .where(eq(bookings.id, booking.id));
      } else if (validated.purpose === "full_payment") {
        await db.transaction(async (tx) => {
          await tx
            .update(bookings)
            .set({ status: "confirmed", updatedAt: new Date() })
            .where(eq(bookings.id, booking.id));

          await tx
            .update(units)
            .set({ status: "booked", updatedAt: new Date() })
            .where(eq(units.id, booking.unitId));
        });
      }
    }

    await createAuditLog({
      action: "create",
      targetType: "payment",
      targetId: payment.id,
      adminId: session.user.id,
      details: {
        bookingId: validated.bookingId,
        amount: validated.amount,
        provider: validated.provider,
        purpose: validated.purpose,
        status: validated.status,
      },
    });

    return { success: true, data: payment };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: error.issues[0]?.message || "Input tidak valid",
        success: false,
      };
    }
    logError(error, "createManualPaymentAction error");
    return { error: "Gagal membuat payment manual", success: false };
  }
}

const cancelPaymentSchema = z.object({
  paymentId: z.string().uuid(),
  reason: z.string().min(1, "Alasan pembatalan wajib diisi"),
});

export type CancelPaymentState = {
  success?: boolean;
  error?: string;
};

export async function cancelPaymentAction(
  prevState: CancelPaymentState | undefined,
  formData: FormData,
): Promise<CancelPaymentState> {
  const csrfError = await validateActionCsrf(formData);
  if (csrfError) {
    return { error: csrfError, success: false };
  }

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { error: "Tidak terotorisasi", success: false };
    }

    if (session.user.role !== "admin") {
      return { error: "Dilarang - hanya admin", success: false };
    }

    const validated = cancelPaymentSchema.parse({
      paymentId: formData.get("paymentId"),
      reason: formData.get("reason"),
    });

    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, validated.paymentId))
      .limit(1);

    if (!payment) {
      return { error: "Payment tidak ditemukan", success: false };
    }

    const terminalStatuses = ["refunded", "cancelled", "success"] as const;
    if (
      terminalStatuses.includes(
        payment.status as (typeof terminalStatuses)[number],
      )
    ) {
      return { error: "Payment sudah dalam status terminal", success: false };
    }

    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, payment.bookingId))
      .limit(1);

    const terminalBookingStatuses = [
      "completed",
      "cancelled",
      "rejected",
    ] as const;
    if (
      booking &&
      terminalBookingStatuses.includes(
        booking.status as (typeof terminalBookingStatuses)[number],
      )
    ) {
      return {
        error: `Tidak dapat memodifikasi payment untuk booking dalam status ${booking.status}`,
        success: false,
      };
    }

    const updatedMetadata = {
      ...payment.metadata,
      cancelledBy: session.user.id,
      cancelledAt: new Date().toISOString(),
      cancelReason: validated.reason,
    };

    await db.transaction(async (tx) => {
      await tx
        .update(payments)
        .set({
          status: "cancelled",
          metadata: updatedMetadata,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, validated.paymentId));

      await handleReferralFailureOnRefund(tx, validated.paymentId);

      if (
        booking &&
        (payment.purpose === "dp" || payment.purpose === "full_payment")
      ) {
        await tx
          .update(bookings)
          .set({
            status: "cancelled",
            updatedAt: new Date(),
          })
          .where(eq(bookings.id, booking.id));
      }
    });

    await createAuditLog({
      action: "cancel",
      targetType: "payment",
      targetId: validated.paymentId,
      adminId: session.user.id,
      details: {
        bookingId: payment.bookingId,
        amount: payment.amount,
        reason: validated.reason,
        previousStatus: payment.status,
      },
    });

    return { success: true };
  } catch (error) {
    logError(error, "cancelPaymentAction error");
    return { error: "Gagal membatalkan payment", success: false };
  }
}

const reconcilePaymentSchema = z.object({
  paymentId: z.string().uuid(),
  transactionId: z.string().optional(),
  reason: z.string().min(1, "Alasan rekonsiliasi wajib diisi"),
});

export type ReconcilePaymentState = {
  success?: boolean;
  error?: string;
};

export async function reconcilePaymentAction(
  prevState: ReconcilePaymentState | undefined,
  formData: FormData,
): Promise<ReconcilePaymentState> {
  const csrfError = await validateActionCsrf(formData);
  if (csrfError) {
    return { error: csrfError, success: false };
  }

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { error: "Tidak terotorisasi", success: false };
    }

    if (!["admin", "staff"].includes(session.user.role as Role)) {
      return { error: "Dilarang", success: false };
    }

    const validated = reconcilePaymentSchema.parse({
      paymentId: formData.get("paymentId"),
      transactionId: formData.get("transactionId"),
      reason: formData.get("reason"),
    });

    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, validated.paymentId))
      .limit(1);

    if (!payment) {
      return { error: "Payment tidak ditemukan", success: false };
    }

    await db
      .update(payments)
      .set({
        status: "success",
        transactionId: validated.transactionId || payment.transactionId,
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(payments.id, validated.paymentId));

    await createAuditLog({
      action: "reconcile",
      targetType: "payment",
      targetId: validated.paymentId,
      adminId: session.user.id,
      details: {
        transactionId: validated.transactionId,
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
    logError(error, "reconcilePaymentAction error");
    return { error: "Gagal merekonsiliasi payment", success: false };
  }
}
