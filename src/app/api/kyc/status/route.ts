import { kycVerifications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ok, fail, handleApiError } from "@/lib/api";
import type { SessionUserWithRole } from "@/lib/auth-client";

export async function GET(req: Request) {
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
      .orderBy(desc(kycVerifications.createdAt));

    return ok({
      kycStatus: user.kycStatus,
      verifications: userVerifications,
    });
  } catch (error) {
    return handleApiError(error, "GET /api/kyc/status");
  }
}
