"use server";

import { logPaymentEvent, logError } from "@/lib/logger";

export async function simulasiPembayaranGagal(
  bookingId: string,
  provider: string
) {
  try {
    throw new Error(
      "Gateway timeout: Payment provider tidak merespons dalam 30 detik"
    );
  } catch (error) {
    logPaymentEvent("failed", provider, bookingId, {
      errorMessage: error instanceof Error ? error.message : String(error),
      bookingId,
      provider,
    });

    logError(error, "payment_gateway_timeout", {
      bookingId,
      provider,
      action: "process_payment",
    });

    throw error;
  }
}
