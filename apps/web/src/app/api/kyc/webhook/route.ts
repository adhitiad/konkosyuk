import { NextRequest } from "next/server";
import { db } from "@/db";
import {
  kycVerifications,
  users,
  kycVerificationStatus,
  kycStatus,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { ok, fail, handleApiError } from "@/lib/api";
import { getSettingRequired } from "@/lib/settings";
import { enforceRateLimit, webhookRateLimit } from "@/lib/rate-limit";
import { logError, logSecurityEvent } from "@/lib/logger";
import crypto from "node:crypto";

function shortenFloats(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(shortenFloats);
  if (v && typeof v === "object") {
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>).map(([k, x]) => [
        k,
        shortenFloats(x),
      ]),
    );
  }
  if (typeof v === "number" && !Number.isInteger(v) && v % 1 === 0)
    return Math.trunc(v);
  return v;
}

function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === "object") {
    return Object.keys(v as object)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = sortKeys((v as Record<string, unknown>)[k]);
        return acc;
      }, {});
  }
  return v;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("verificationSessionId");
  if (sessionId) {
    return ok({ sessionId, message: "Redirect to KYC page for status polling" });
  }
  return ok({ received: true });
}

export async function POST(req: NextRequest) {
  try {
    const limited = await enforceRateLimit(req, webhookRateLimit);
    if (limited) return limited;

    const raw = await req.text();
    const sig = req.headers.get("x-signature-v2") ?? "";
    const ts = Number(req.headers.get("x-timestamp"));

    if (!ts || Math.abs(Date.now() / 1000 - ts) > 300) {
      logSecurityEvent("kyc_webhook_stale_timestamp", {});
      return fail("Stale timestamp", 401);
    }

    let webhookSecret: string;
    try {
      webhookSecret = await getSettingRequired("DIDIT_WEBHOOK_SECRET");
    } catch {
      logSecurityEvent("kyc_webhook_misconfigured", {});
      return fail("Webhook secret not configured", 500);
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return fail("Invalid JSON body", 400);
    }

    const canonical = JSON.stringify(sortKeys(shortenFloats(parsed)));

    const expected = crypto
      .createHmac("sha256", webhookSecret)
      .update(canonical, "utf8")
      .digest("hex");

    if (
      sig.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
    ) {
      logSecurityEvent("kyc_webhook_invalid_signature", {});
      return fail("Invalid signature", 401);
    }

    const { status, vendor_data, session_id, decision } =
      parsed as {
        event_id?: string;
        status?: string;
        vendor_data?: string;
        session_id?: string;
        decision?: unknown;
      };

    const lookupKey = (vendor_data || session_id) as string | undefined;
    if (!lookupKey) {
      logSecurityEvent("kyc_webhook_missing_identifier", {});
      return fail("Missing identifier", 400);
    }

    const [verification] = await db
      .select()
      .from(kycVerifications)
      .where(
        vendor_data
          ? eq(kycVerifications.userId, vendor_data)
          : eq(kycVerifications.diditSessionId, session_id!),
      )
      .orderBy(kycVerifications.createdAt)
      .limit(1);

    if (!verification) {
      logSecurityEvent("kyc_webhook_verification_not_found", { lookupKey: lookupKey || "" });
      return fail("Session not found", 404);
    }

    const statusLower = (status ?? "").toLowerCase();
    let newKycVerificationStatus: (typeof kycVerificationStatus)[number] =
      "approved";
    let newUserKycStatus: (typeof kycStatus)[number] = "verified";

    if (statusLower === "approved" || statusLower === "completed") {
      newKycVerificationStatus = "approved";
      newUserKycStatus = "verified";
    } else if (
      statusLower === "rejected" ||
      statusLower === "declined" ||
      statusLower === "failed"
    ) {
      newKycVerificationStatus = "rejected";
      newUserKycStatus = "rejected";
    } else {
      return ok({ received: true });
    }

    await db
      .update(kycVerifications)
      .set({
        status: newKycVerificationStatus,
        rejectionReason: (
          (decision as Record<string, unknown> | undefined)?.rejection_reason ??
          (decision as Record<string, unknown> | undefined)?.rejectionReason ??
          null
        ) as string | null,
        updatedAt: new Date(),
      })
      .where(eq(kycVerifications.id, verification.id));

    await db
      .update(users)
      .set({ kycStatus: newUserKycStatus })
      .where(eq(users.id, verification.userId));

    return ok({ received: true });
  } catch (error) {
    logError(error, "KYC_WEBHOOK_ERROR");
    return handleApiError(error, "KYC webhook");
  }
}
