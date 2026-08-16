import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments, bookings, properties } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { ok, fail, handleApiError } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();

    const { searchParams } = new URL(req.url);
    const invoiceNumber = searchParams.get("invoiceNumber");

    if (invoiceNumber) {
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
    }

    // List all payments for the logged in user
    const userPayments = await db
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
        propertyName: properties.name,
        propertyAddress: properties.address,
      })
      .from(payments)
      .innerJoin(bookings, eq(payments.bookingId, bookings.id))
      .leftJoin(properties, eq(bookings.propertyId, properties.id))
      .where(eq(bookings.userId, session.user.id))
      .orderBy(desc(payments.createdAt));

    return ok(userPayments);
  } catch (error) {
    return handleApiError(error);
  }
}

