import { NextResponse } from "next/server";
import { db } from "@/db";
import { kycVerifications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { ok, fail, handleApiError } from "@/lib/api";

export async function GET(req: Request) {
  try {
    const session = await requireSession(["owner"] as const);

    const [verification] = await db
      .select()
      .from(kycVerifications)
      .where(eq(kycVerifications.userId, session.user.id))
      .orderBy(desc(kycVerifications.createdAt))
      .limit(1);

    return ok({
      kycStatus: session.user.kycStatus,
      verification: verification || null,
    });
  } catch (error) {
    return handleApiError(error, "GET /api/kyc/status");
  }
}
