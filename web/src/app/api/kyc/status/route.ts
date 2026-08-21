import { kycVerifications, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ok, fail, handleApiError } from "@/lib/api";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return fail("Unauthorized", 401);
    }

    const userId = session.user.id;

    const userVerifications = await db
      .select()
      .from(kycVerifications)
      .where(eq(kycVerifications.userId, userId))
      .orderBy(desc(kycVerifications.createdAt));

    const dbUser = await db
      .select({ kycStatus: users.kycStatus })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const kycStatus = dbUser?.[0]?.kycStatus ?? "none";

    return ok({
      kycStatus,
      verifications: userVerifications,
    });
  } catch (error) {
    return handleApiError(error, "GET /api/kyc/status");
  }
}
