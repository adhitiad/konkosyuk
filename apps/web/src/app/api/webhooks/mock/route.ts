import { NextRequest } from "next/server";
import { env } from "@/lib/env";
import { handleWebhookRequest } from "@/lib/payments/webhook";
import { enforceRateLimit, webhookRateLimit } from "@/lib/rate-limit";
import { fail } from "@/lib/api";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const limited = await enforceRateLimit(req, webhookRateLimit);
  if (limited) return limited;

  if (env.PAYMENT_MODE !== "mock") {
    return fail("Mock webhooks are only available in mock mode", 403, "FORBIDDEN");
  }

  const raw = await req.text();

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return fail("Invalid JSON payload", 400);
  }

  const invoiceNumber = (body as Record<string, unknown>)?.invoiceNumber;
  const status = (body as Record<string, unknown>)?.status;

  if (!invoiceNumber || !status) {
    return fail("Missing invoiceNumber or status", 400);
  }

  const ctx = {
    provider: "mock" as const,
    headers: new Headers(req.headers),
    rawBody: raw,
    eventId: `mock-event-${Date.now()}`,
  };

  return handleWebhookRequest("mock", ctx);
}
