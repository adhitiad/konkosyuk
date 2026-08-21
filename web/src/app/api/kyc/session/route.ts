import { kycVerifications, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ok, fail, handleApiError } from "@/lib/api";
import { getSettingRequired, getSetting } from "@/lib/settings";

const DIDIT_WORKFLOW_ID = "584faed8-a928-4f49-8d9e-d1f2b106035a";

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

    try {
      diditApiKey = await getSettingRequired("DIDIT_API_KEY");
    } catch {
      diditApiKey = process.env.DIDIT_API_KEY || "";
    }

    const diditApiUrl =
      (await getSetting("NEXT_PUBLIC_DIDIT_API_URL")) ||
      process.env.NEXT_PUBLIC_DIDIT_API_URL ||
      "https://verification.didit.me";

    if (!diditApiKey) {
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

    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/owner/kyc`;;

    const diditResponse = await fetch(`${diditApiUrl}/v3/session/`, {
      method: "POST",
      headers: {
        "x-api-key": diditApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        workflow_id: DIDIT_WORKFLOW_ID,
        vendor_data: session.user.id,
        callback: callbackUrl,
      }),
    });

    if (!diditResponse.ok) {
      const errorText = await diditResponse.text();
      console.error("Didit API error:", errorText);
      let detail = "Failed to create KYC session";
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.detail) {
          detail = errorJson.detail;
        } else if (errorJson.message) {
          detail = errorJson.message;
        }
      } catch {}
      return fail(detail, 502);
    }

    const diditData = await diditResponse.json();

    await db
      .update(kycVerifications)
      .set({
        diditSessionId: diditData.session_id,
        diditRedirectUrl: diditData.url,
        status: "pending",
      })
      .where(eq(kycVerifications.id, verification.id));

    await db
      .update(users)
      .set({ kycStatus: "pending" })
      .where(eq(users.id, session.user.id));

    return ok({
      sessionId: diditData.session_id,
      redirectUrl: diditData.url,
      sessionToken: diditData.session_token,
    });
  } catch (error) {
    console.error(
      "KYC session error:",
      error instanceof Error ? error.stack : error,
    );
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

    const userId = session.user.id;

    const [userRecord] = await db
      .select({ kycStatus: users.kycStatus })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const userVerifications = await db
      .select()
      .from(kycVerifications)
      .where(eq(kycVerifications.userId, userId))
      .orderBy(kycVerifications.createdAt);

    return ok({
      kycStatus: userRecord?.kycStatus ?? "none",
      verifications: userVerifications,
    });
  } catch (error) {
    return handleApiError(error, "GET /api/kyc/status");
  }
}
