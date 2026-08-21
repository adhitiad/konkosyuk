"use server";

import { db } from "@/db";
import { payments, bookings, properties, units, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { renderToBuffer } from "@react-pdf/renderer";
import { ReceiptTemplate, ReceiptData } from "@/lib/payments/receipt-template";

export async function generateReceiptPdf(paymentId: string): Promise<Blob | null> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return null;
    }

    const [paymentRow] = await db
      .select({
        payment: payments,
        booking: bookings,
      })
      .from(payments)
      .innerJoin(bookings, eq(payments.bookingId, bookings.id))
      .where(eq(payments.id, paymentId))
      .limit(1);

    if (!paymentRow) {
      return null;
    }

    const payment = paymentRow.payment;
    const booking = paymentRow.booking;

    if (booking.userId !== session.user.id && session.user.role !== "admin") {
      return null;
    }

    const [propertyRow] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, booking.propertyId))
      .limit(1);

    const [unitRow] = await db
      .select()
      .from(units)
      .where(eq(units.id, booking.unitId))
      .limit(1);

    const [tenantRow] = await db
      .select({
        name: users.name,
      })
      .from(users)
      .where(eq(users.id, booking.userId))
      .limit(1);

    const data: ReceiptData = {
      paymentId: payment.id,
      paidAt: payment.paidAt ? new Date(payment.paidAt).toISOString() : null,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      provider: payment.provider,
      purpose: payment.purpose,
      transactionId: payment.transactionId,
      tenantName: tenantRow?.name ?? session.user.name ?? "Tenant",
      propertyName: propertyRow?.name ?? "Properti",
      propertyAddress: propertyRow?.address ?? null,
      unitName: unitRow?.name ?? null,
      startDate: booking.startDate ? new Date(booking.startDate).toISOString() : null,
      endDate: booking.endDate ? new Date(booking.endDate).toISOString() : null,
    };

    const buffer = await renderToBuffer(
      <ReceiptTemplate data={data} />,
    );

    return new Blob([new Uint8Array(buffer)], { type: "application/pdf" });
  } catch {
    return null;
  }
}
