import { kycVerifications, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ok, fail, handleApiError } from "@/lib/api";
import type { SessionUserWithRole } from "@/lib/auth-client";
import { getSettingRequired, getSetting } from "@/lib/settings";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return fail("Unauthorized", 401);
    }

    const body = await req.json();
    const { documentType, ktpImageUrl, selfieImageUrl } = body;

    if (!ktpImageUrl) {
      return fail("KTP image is required", 400);
    }

    let diditApiKey: string;
    let diditApiUrl: string;

    try {
      diditApiKey = await getSettingRequired("DIDIT_API_KEY");
      diditApiUrl =
        (await getSetting("NEXT_PUBLIC_DIDIT_API_URL")) ||
        "https://api.didit.me";
    } catch {
      return fail("KYC service not configured", 500);
    }

    const [verification] = await db
      .insert(kycVerifications)
      .values({
        userId: session.user.id,
        documentType: documentType || "ktp",
        ktpImageUrl: ktpImageUrl || null,
        selfieImageUrl: selfieImageUrl || null,
        status: "pending",
      })
      .returning();

    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/kyc/webhook`;

    const diditResponse = await fetch(`${diditApiUrl}/v2/kyc/session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${diditApiKey}`,
      },
      body: JSON.stringify({
        callback_url: callbackUrl,
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/owner/kyc/result`,
        document_type: documentType || "ktp",
        front_image: ktpImageUrl,
        portrait_image: selfieImageUrl,
      }),
    });

    if (!diditResponse.ok) {
      const errorText = await diditResponse.text();
      console.error("Didit API error:", errorText);
      return fail("Failed to create KYC session", 500);
    }

    const diditData = await diditResponse.json();

    await db
      .update(kycVerifications)
      .set({
        diditSessionId: diditData.session_id || diditData.sessionId,
        diditRedirectUrl: diditData.redirect_url || diditData.redirectUrl,
        status: "pending",
      })
      .where(eq(kycVerifications.id, verification.id));

    const user = session.user as SessionUserWithRole;
    await db
      .update(users)
      .set({ kycStatus: "pending" })
      .where(eq(users.id, user.id));

    return ok({
      sessionId: diditData.session_id || diditData.sessionId,
      redirectUrl: diditData.redirect_url || diditData.redirectUrl,
    });
  } catch (error) {
    return handleApiError(error, "POST /api/kyc/session");
  }
}

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return fail("Unauthorized", 401);
    }

    const user = session.user as SessionUserWithRole;
    const userVerifications = await db
      .select()
      .from(kycVerifications)
      .where(eq(kycVerifications.userId, user.id))
      .orderBy(kycVerifications.createdAt);

    return ok({
      kycStatus: user.kycStatus,
      verifications: userVerifications,
    });
  } catch (error) {
    return handleApiError(error, "GET /api/kyc/status");
  }
}
