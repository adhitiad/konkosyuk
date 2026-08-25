import { NextRequest } from "next/server";
import { getPaymentProvider } from "@/lib/payments";
import { handleWebhookRequest } from "@/lib/payments/webhook";
import { enforceRateLimit, webhookRateLimit } from "@/lib/rate-limit";
import { isWebhookIpAllowed, getClientIp } from "@/lib/webhook-ip-allowlist";
import { logSecurityEvent } from "@/lib/logger";
import { fail, handleApiError } from "@/lib/api";

export async function GET() {
  return fail("Method Not Allowed", 405, "METHOD_NOT_ALLOWED");
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  try {
    const { provider } = await params;
    const adapter = getPaymentProvider(provider);

    if (!adapter) {
      return fail("Unknown provider", 400);
    }

    const rawBody = await req.text();
    const ctx = {
      provider: provider as "ipaymu" | "doku" | "nicepay",
      headers: req.headers,
      rawBody,
    };

    const isValid = await adapter.verifyWebhookSignature(ctx);
    if (!isValid) {
      logSecurityEvent("webhook_invalid_signature", {
        provider,
        ip: getClientIp(req),
        userAgent: req.headers.get("user-agent") ?? undefined,
      });
      return fail("Invalid signature", 401, "UNAUTHORIZED");
    }

    const limited = await enforceRateLimit(req, webhookRateLimit);
    if (limited) return limited;

    const clientIp = getClientIp(req);
    if (!isWebhookIpAllowed(provider, req)) {
      logSecurityEvent("webhook_ip_blocked", {
        provider,
        ip: clientIp,
        userAgent: req.headers.get("user-agent") ?? undefined,
      });
      return fail("Unauthorized IP", 403, "FORBIDDEN");
    }

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
    return handleApiError(error, "POST /api/webhooks/[provider]");
  }
}
