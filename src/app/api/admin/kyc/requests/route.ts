import { NextRequest } from "next/server";
import { db } from "@/db";
import { users, kycVerifications } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { eq, desc, sql } from "drizzle-orm";
import type { Role } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession(["admin", "staff"] as Role[]);

    const verifications = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        ktpNumber: users.ktpNumber,
        ktpImageUrl: users.ktpImageUrl,
        kycStatus: users.kycStatus,
        updatedAt: users.updatedAt,
        createdAt: users.createdAt,
        verificationId: kycVerifications.id,
        diditSessionId: kycVerifications.diditSessionId,
        verificationStatus: kycVerifications.status,
        documentType: kycVerifications.documentType,
        faceMatchScore: kycVerifications.faceMatchScore,
        livenessPassed: kycVerifications.livenessPassed,
        rejectionReason: kycVerifications.rejectionReason,
        verificationCreatedAt: kycVerifications.createdAt,
        verificationUpdatedAt: kycVerifications.updatedAt,
      })
      .from(users)
      .leftJoin(
        kycVerifications,
        eq(users.id, kycVerifications.userId)
      )
      .where(
        sql`${users.kycStatus} = 'pending' OR ${users.kycStatus} = 'none'`
      )
      .orderBy(desc(users.updatedAt));

    return ok({ data: verifications });
  } catch (error) {
    return handleApiError(error);
  }
}
