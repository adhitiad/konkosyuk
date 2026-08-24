import { kycVerifications, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ok, fail, handleApiError } from "@/lib/api";
import { getSettingRequired, getSetting } from "@/lib/settings";
import { z } from "zod";
import { logError } from "@/lib/logger";

const DIDIT_WORKFLOW_ID = "584faed8-a928-4f49-8d9e-d1f2b106035a";

const DIDIT_ALLOWED_HOSTS = [
  "verification.didit.me",
  "didit-api.example.com",
];

const createKycSessionSchema = z.object({
  documentType: z.enum(["ktp", "driving_license", "passport"]).default("ktp"),
  ktpImageUrl: z.string().url("URL KTP tidak valid"),
  selfieImageUrl: z.string().url().optional().nullable(),
});

function isAllowedDiditUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    return DIDIT_ALLOWED_HOSTS.includes(url.hostname);
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  let session: Awaited<ReturnType<typeof auth.api.getSession>> | null = null;
  try {
    session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return fail("Unauthorized", 401);
    }

    const body = await req.json();
    const parsed = createKycSessionSchema.parse(body);

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

    if (!isAllowedDiditUrl(diditApiUrl)) {
      return fail("KYC service URL tidak diizinkan", 500);
    }

    if (!diditApiKey) {
      return fail("KYC service not configured", 500);
    }

    const [verification] = await db
      .insert(kycVerifications)
      .values({
        userId: session.user.id,
        documentType: parsed.documentType,
        ktpImageUrl: parsed.ktpImageUrl || null,
        selfieImageUrl: parsed.selfieImageUrl || null,
        status: "pending",
      })
      .returning();

    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/owner/kyc`;

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
      logError(new Error(`Didit API error: ${errorText}`), "KYC_API_ERROR", {
        status: diditResponse.status,
      });
      return fail("KYC service unavailable", 502);
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
    });
  } catch (error) {
    logError(error, "POST /api/kyc/session", {
      userId: session?.user?.id,
    });
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
