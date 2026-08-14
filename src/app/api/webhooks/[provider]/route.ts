import { NextRequest, NextResponse } from "next/server";
import { getPaymentProvider } from "@/lib/payments";
import { handleWebhookRequest } from "@/lib/payments/webhook";
import { enforceRateLimit, webhookRateLimit } from "@/lib/rate-limit";
import { isWebhookIpAllowed, getClientIp } from "@/lib/webhook-ip-allowlist";
import { logSecurityEvent } from "@/lib/logger";

export async function GET() {
  return NextResponse.json({ message: "Webhook endpoint" }, { status: 405 });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  try {
    const { provider } = await params;
    const adapter = getPaymentProvider(provider);

    if (!adapter) {
      return NextResponse.json(
        { success: false, error: "Unknown provider" },
        { status: 400 },
      );
    }

    const clientIp = getClientIp(req);
    if (!isWebhookIpAllowed(provider, req)) {
      logSecurityEvent("webhook_ip_blocked", {
        provider,
        ip: clientIp,
        userAgent: req.headers.get("user-agent"),
      });
      return NextResponse.json(
        { success: false, error: "Unauthorized IP" },
        { status: 403 },
      );
    }

    const limited = await enforceRateLimit(req, webhookRateLimit);
    if (limited) return limited;

    const rawBody = await req.text();
    const ctx = {
      provider: provider as "ipaymu" | "doku" | "nicepay",
      headers: req.headers,
      rawBody,
    };

    const result = await handleWebhookRequest(provider, ctx);

    if (result.status === 200) {
      logSecurityEvent("webhook_processed", {
        provider,
        ip: clientIp,
        status: "success",
      });
    }

    return result;
  } catch (error) {
    logSecurityEvent("webhook_failed", {
      provider: (await params).provider,
      ip: getClientIp(req),
      error: error instanceof Error ? error.message : "Unknown",
    });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Webhook failed",
      },
      { status: 500 },
    );
  }
}
