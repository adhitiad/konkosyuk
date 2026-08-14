import { NextResponse } from "next/server";
import { db } from "@/db";
import { kycVerifications, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logSecurityEvent, logInfo } from "@/lib/logger";

export const runtime = "nodejs";

function verifyDiditSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const expectedSignature = Buffer.from(
    require("node:crypto").createHmac("sha256", secret).update(payload).digest("hex"),
  );

  return (
    Buffer.from(signature).length === expectedSignature.length &&
    Buffer.from(signature).every((val, i) => val === expectedSignature[i])
  );
}

export async function POST(req: Request) {
  try {
    const webhookSecret = process.env.DIDIT_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logSecurityEvent("kyc_webhook_misconfigured", {});
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }

    const rawBody = await req.text();
    const signature = req.headers.get("x-didit-signature") || "";

    if (!verifyDiditSignature(rawBody, signature, webhookSecret)) {
      logSecurityEvent("kyc_webhook_invalid_signature", { signature });
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    logInfo("[Didit Webhook] Received payload", { session_id: payload.session_id, status: payload.status });

    const { session_id, status, result, reason } = payload;

    if (!session_id) {
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
    }

    const [verification] = await db
      .select()
      .from(kycVerifications)
      .where(eq(kycVerifications.diditSessionId, session_id))
      .limit(1);

    if (!verification) {
      logSecurityEvent("kyc_webhook_session_not_found", { session_id });
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    let newStatus: "pending" | "approved" | "rejected" | "expired" = "pending";

    switch (status) {
      case "approved":
      case "completed":
        newStatus = "approved";
        break;
      case "rejected":
      case "failed":
        newStatus = "rejected";
        break;
      case "expired":
        newStatus = "expired";
        break;
      default:
        newStatus = "pending";
    }

    const updateData: any = {
      status: newStatus,
      updatedAt: new Date(),
    };

    if (result) {
      if (result.face_match_score !== undefined) {
        updateData.faceMatchScore = String(result.face_match_score);
      }
      if (result.liveness_passed !== undefined) {
        updateData.livenessPassed = result.liveness_passed;
      }
    }

    if (newStatus === "rejected" && reason) {
      updateData.rejectionReason = reason;
    }

    const [updatedVerification] = await db
      .update(kycVerifications)
      .set(updateData)
      .where(eq(kycVerifications.id, verification.id))
      .returning();

    if (newStatus === "approved") {
      await db
        .update(users)
        .set({ kycStatus: "verified" })
        .where(eq(users.id, verification.userId));
    } else if (newStatus === "rejected") {
      await db
        .update(users)
        .set({ kycStatus: "rejected" })
        .where(eq(users.id, verification.userId));
    }

    logInfo("[Didit Webhook] Verification updated", {
      verificationId: updatedVerification.id,
      userId: verification.userId,
      status: newStatus,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Didit Webhook] Error:", error);
    logSecurityEvent("kyc_webhook_error", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
