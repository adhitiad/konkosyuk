import type { WebhookPaymentStatus } from "./types";

export function normalizeGatewayStatus(status: string): WebhookPaymentStatus {
  const normalized = status.toLowerCase().trim();

  if (
    normalized === "paid" ||
    normalized === "success" ||
    normalized === "settlement" ||
    normalized === "approved" ||
    normalized === "captured"
  ) {
    return "success";
  }

  if (
    normalized === "failed" ||
    normalized === "deny" ||
    normalized === "cancel" ||
    normalized === "void"
  ) {
    return "failed";
  }

  if (normalized === "expired" || normalized === "timeout") {
    return "expired";
  }

  return "pending";
}
