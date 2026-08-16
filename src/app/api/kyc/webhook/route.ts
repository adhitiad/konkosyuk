import { NextResponse } from "next/server";
import { kycVerifications, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ok, fail, handleApiError } from "@/lib/api";
import { getSettingRequired } from "@/lib/settings";

export async function POST(req: Request) {
  try {
    const signature = req.headers.get("x-didit-signature");
    const session_id = req.headers.get("x-session-id");

    if (!signature || !session_id) {
      console.error("KYC webhook misconfigured: missing signature or session ID");
      return fail("Missing signature or session ID", 400);
    }

    let webhookSecret: string;
    try {
      webhookSecret = await getSettingRequired("DIDIT_WEBHOOK_SECRET");
    } catch {
      console.error("KYC webhook misconfigured: missing webhook secret");
      return fail("Webhook secret not configured", 500);
    }

    const body = await req.text();
    const encoder = new TextEncoder();
    const key = encoder.encode(webhookSecret);
    const message = encoder.encode(body + session_id);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      key,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, message);
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (signature !== expectedSignature) {
      console.error("KYC webhook invalid signature");
      return fail("Invalid signature", 401);
    }

    const data = JSON.parse(body);

    const [verification] = await db
      .select()
      .from(kycVerifications)
      .where(eq(kycVerifications.diditSessionId, session_id))
      .limit(1);

    if (!verification) {
      console.error("KYC webhook session not found:", session_id);
      return fail("Session not found", 404);
    }

    const status = data.status?.toLowerCase();
    let newKycStatus: "verified" | "rejected" = "verified";

    if (status === "approved" || status === "completed") {
      newKycStatus = "verified";
    } else if (status === "rejected" || status === "failed") {
      newKycStatus = "rejected";
    } else {
      return ok({ received: true });
    }

    await db
      .update(kycVerifications)
      .set({
        status: newKycStatus as any,
        rejectionReason: data.rejection_reason || data.rejectionReason || null,
        faceMatchScore: data.face_match_score || data.faceMatchScore || null,
        livenessPassed: data.liveness_passed ?? data.livenessPassed ?? null,
        updatedAt: new Date(),
      })
      .where(eq(kycVerifications.id, verification.id));

    await db
      .update(users)
      .set({ kycStatus: newKycStatus as any })
      .where(eq(users.id, verification.userId));

    return ok({ received: true });
  } catch (error) {
    console.error("KYC webhook error:", error);
    return handleApiError(error, "KYC webhook");
  }
}
