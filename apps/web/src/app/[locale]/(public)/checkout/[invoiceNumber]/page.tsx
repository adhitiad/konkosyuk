import { db } from "@/db";
import { payments, bookings, properties } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { CheckoutClient } from "./checkout-client";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ invoiceNumber: string }>;
}) {
  const { invoiceNumber } = await params;

  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.transactionId, invoiceNumber))
    .limit(1);

  if (!payment) {
    notFound();
  }

  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, payment.bookingId))
    .limit(1);

  let property = null;
  if (booking) {
    const [p] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, booking.propertyId))
      .limit(1);
    property = p;
  }

  return (
    <CheckoutClient
      invoiceNumber={invoiceNumber}
      amount={Number(payment.amount)}
      purpose={payment.purpose}
      propertyName={property?.name ?? "Properti"}
      bookingId={payment.bookingId}
    />
  );
}
