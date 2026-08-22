import { redirect } from "next/navigation";
import { db } from "@/db";
import { bookings, payments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getPaymentProvider } from "@/lib/payments";
import { generateInvoiceNumber, money } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function BookingCheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ bookingId: string }>;
  searchParams: Promise<{ purpose?: string }>;
}): Promise<React.ReactNode> {
  const { bookingId } = await params;
  const { purpose } = await searchParams;

  if (!purpose || !["dp", "full_payment"].includes(purpose)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    redirect("/dashboard/bookings?error=invalid_purpose" as any);
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    redirect("/login" as any);
  }

  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!booking || booking.userId !== session.user.id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    redirect("/dashboard/bookings?error=booking_not_found" as any);
  }

  let amount: number;
  if (purpose === "dp") {
    amount = booking.metadata?.dpAmount ? Number(booking.metadata.dpAmount) : 0;
  } else {
    amount = booking.metadata?.remainingAmount
      ? Number(booking.metadata.remainingAmount)
      : 0;
  }

  if (amount <= 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    redirect("/dashboard/bookings?error=invalid_amount" as any);
  }

  const adapter = getPaymentProvider("mock");
  if (!adapter) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    redirect("/dashboard/bookings?error=invalid_provider" as any);
  }

  const invoiceNumber = generateInvoiceNumber(
    purpose.toUpperCase() as "DP" | "FULL",
  );

  const [payment] = await db
    .insert(payments)
    .values({
      bookingId: booking.id,
      provider: "mock",
      purpose: purpose as "dp" | "full_payment",
      amount: money(amount),
      currency: "IDR",
      status: "pending",
      transactionId: invoiceNumber,
      metadata: { invoiceNumber },
    })
    .returning();

  try {
    const result = await adapter.createPayment({
      bookingId: booking.id,
      provider: "mock",
      purpose: purpose as "dp" | "full_payment",
      amount,
      currency: "IDR",
      expiresIn: 21600,
      metadata: {
        invoiceNumber,
      },
    });

    await db
      .update(payments)
      .set({
        transactionId: result.transactionId,
        rawResponse: result.rawResponse,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id));

    if (result.redirectUrl) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      redirect(result.redirectUrl as any);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    redirect(`/mock-checkout/${invoiceNumber}` as any);
  } catch {
    await db
      .update(payments)
      .set({ status: "failed", updatedAt: new Date() })
      .where(eq(payments.id, payment.id));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    redirect("/dashboard/bookings?error=payment_failed" as any);
  }
}
