import { NextResponse } from "next/server";
import { getAblyRest } from "@/lib/ably/server";
import { requireSession } from "@/lib/auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { db } from "@/db";
import { kycVerifications, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const initiateKycSchema = z.object({
  documentType: z.enum(["ktp", "passport", "driving_license"]),
  ktpImageUrl: z.string().url().optional(),
  selfieImageUrl: z.string().url().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await requireSession(["owner"] as const);

    if (session.user.kycStatus === "verified") {
      return fail("KYC sudah terverifikasi", 400);
    }

    if (session.user.kycStatus === "pending") {
      return fail("KYC sedang dalam proses verifikasi", 400);
    }

    const body = await req.json();
    const { documentType, ktpImageUrl, selfieImageUrl } = initiateKycSchema.parse(body);

    if (documentType === "ktp" && !ktpImageUrl) {
      return fail("Foto KTP wajib diupload untuk verifikasi KTP", 400);
    }

    if (!selfieImageUrl) {
      return fail("Foto selfie wajib diupload untuk liveness detection", 400);
    }

    const apiKey = process.env.DIDIT_API_KEY;
    if (!apiKey) {
      return fail("Konfigurasi KYC tidak ditemukan", 500);
    }

    const apiUrl = process.env.NEXT_PUBLIC_DIDIT_API_URL || "https://api.didit.me";

    const diditResponse = await fetch(`${apiUrl}/api/v1/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        customer_id: session.user.id,
        document_type: documentType,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/kyc/webhook`,
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/owner/kyc/result`,
        metadata: {
          user_id: session.user.id,
          email: session.user.email,
          name: session.user.name,
        },
      }),
    });

    if (!diditResponse.ok) {
      const errorData = await diditResponse.json().catch(() => ({}));
      return fail(
        errorData.message || "Gagal memulai sesi verifikasi Didit",
        diditResponse.status,
      );
    }

    const diditData = await diditResponse.json();

    const [verification] = await db
      .insert(kycVerifications)
      .values({
        userId: session.user.id,
        diditSessionId: diditData.session_id,
        status: "pending",
        documentType,
        ktpImageUrl: ktpImageUrl || null,
        selfieImageUrl,
        faceMatchScore: null,
        livenessPassed: null,
        rejectionReason: null,
      })
      .returning();

    await db
      .update(users)
      .set({ kycStatus: "pending" })
      .where(eq(users.id, session.user.id));

    return ok({
      sessionId: diditData.session_id,
      verificationId: verification.id,
      redirectUrl: diditData.redirect_url || `${apiUrl}/verify/${diditData.session_id}`,
    });
  } catch (error) {
    return handleApiError(error, "POST /api/kyc/session");
  }
}

export async function GET(req: Request) {
  try {
    const session = await requireSession(["owner"] as const);

    const [verification] = await db
      .select()
      .from(kycVerifications)
      .where(eq(kycVerifications.userId, session.user.id))
      .orderBy(kycVerifications.createdAt)
      .limit(1);

    return ok({
      kycStatus: session.user.kycStatus,
      verification: verification || null,
    });
  } catch (error) {
    return handleApiError(error, "GET /api/kyc/status");
  }
}
