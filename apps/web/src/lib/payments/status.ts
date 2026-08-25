import type { WebhookPaymentStatus } from "./types";

export function normalizeGatewayStatus(status: string): WebhookPaymentStatus {
  const normalized = status.toLowerCase().trim();

  if (
    normalized === "paid" ||
    normalized === "success" ||
    normalized === "settlement" ||
    normalized === "approved" ||
    normalized === "captured" ||
    normalized === "s"
  ) {
    return "success";
  }

  if (
    normalized === "failed" ||
    normalized === "deny" ||
    normalized === "cancel" ||
    normalized === "void" ||
    normalized === "fl"
  ) {
    return "failed";
  }

  if (
    normalized === "expired" ||
    normalized === "timeout" ||
    normalized === "ex"
  ) {
    return "expired";
  }

  if (normalized === "refund" || normalized === "r") {
    return "failed";
  }

  return "pending";
}
