import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments, bookings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { ok, fail, handleApiError } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();

    const { searchParams } = new URL(req.url);
    const invoiceNumber = searchParams.get("invoiceNumber");

    if (!invoiceNumber) {
      return fail("invoiceNumber is required", 400);
    }

    const [payment] = await db
      .select({
        id: payments.id,
        bookingId: payments.bookingId,
        provider: payments.provider,
        purpose: payments.purpose,
        amount: payments.amount,
        currency: payments.currency,
        status: payments.status,
        transactionId: payments.transactionId,
        paidAt: payments.paidAt,
        createdAt: payments.createdAt,
        bookingUserId: bookings.userId,
      })
      .from(payments)
      .leftJoin(bookings, eq(payments.bookingId, bookings.id))
      .where(eq(payments.transactionId, invoiceNumber))
      .limit(1);

    if (!payment) {
      return fail("Payment not found", 404);
    }

    if (payment.bookingUserId !== session.user.id) {
      return fail("Payment not found", 404);
    }

    return ok(payment);
  } catch (error) {
    return handleApiError(error);
  }
}
