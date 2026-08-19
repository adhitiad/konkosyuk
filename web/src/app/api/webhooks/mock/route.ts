import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { handleWebhookRequest } from "@/lib/payments/webhook";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (env.PAYMENT_MODE !== "mock") {
    return NextResponse.json(
      {
        success: false,
        error: "Mock webhooks are only available in mock mode",
      },
      { status: 403 },
    );
  }

  const raw = await req.text();

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response("Invalid JSON payload", { status: 400 });
  }

  const invoiceNumber = (body as Record<string, unknown>)?.invoiceNumber;
  const status = (body as Record<string, unknown>)?.status;

  if (!invoiceNumber || !status) {
    return new Response("Missing invoiceNumber or status", { status: 400 });
  }

  const ctx = {
    provider: "mock" as const,
    headers: new Headers(req.headers),
    rawBody: raw,
    eventId: `mock-event-${Date.now()}`,
  };

  return handleWebhookRequest("mock", ctx);
}
