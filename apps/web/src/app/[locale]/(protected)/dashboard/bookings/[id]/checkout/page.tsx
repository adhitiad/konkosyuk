import { redirect } from "next/navigation";
import { db } from "@/db";
import { bookings, payments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getPaymentProvider } from "@/lib/payments";
import { generateInvoiceNumber, money } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { localeHref } from "@/lib/i18n";

export default async function BookingCheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; locale: string }>;
  searchParams: Promise<{ purpose?: string }>;
}): Promise<React.ReactNode> {
  const { id, locale } = await params;
  const bookingId = id;
  const { purpose } = await searchParams;

  if (!purpose || !["dp", "full_payment"].includes(purpose)) {
    redirect(localeHref(locale, "/dashboard/bookings?error=invalid_purpose"));
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect(localeHref(locale, "/login"));
  }

  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!booking || booking.userId !== session.user.id) {
    redirect(localeHref(locale, "/dashboard/bookings?error=booking_not_found"));
  }

  let amount: number;
  const totalPrice = booking.metadata?.totalPrice
    ? Number(booking.metadata.totalPrice)
    : 0;

  if (purpose === "dp") {
    amount = booking.metadata?.dpAmount
      ? Number(booking.metadata.dpAmount)
      : totalPrice * 0.35;
  } else {
    amount = booking.metadata?.remainingAmount
      ? Number(booking.metadata.remainingAmount)
      : totalPrice;
  }

  if (amount <= 0) {
    redirect(localeHref(locale, "/dashboard/bookings?error=invalid_amount"));
  }

  const adapter = getPaymentProvider("mock");
  if (!adapter) {
    redirect(localeHref(locale, "/dashboard/bookings?error=invalid_provider"));
  }

  const invoiceNumber = generateInvoiceNumber(
    purpose === "dp" ? "DP" : "FULL",
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
      const target =
        result.redirectUrl.startsWith("http://") ||
        result.redirectUrl.startsWith("https://")
          ? result.redirectUrl
          : localeHref(locale, result.redirectUrl);

      redirect(target);
    }

    redirect(localeHref(locale, `/mock-checkout/${invoiceNumber}`));
  } catch {
    await db
      .update(payments)
      .set({ status: "failed", updatedAt: new Date() })
      .where(eq(payments.id, payment.id));

    redirect(localeHref(locale, "/dashboard/bookings?error=payment_failed"));
  }
}
