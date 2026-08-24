import { NextRequest } from "next/server";
import { db } from "@/db";
import { propertyAds } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { validateAdminRequest } from "@/lib/api-auth";
import { validateMutationCsrf } from "@/lib/api-auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { z } from "zod";
import { logError, logSecurityEvent } from "@/lib/logger";

export const dynamic = "force-dynamic";

const rejectSchema = z.object({
  adminNote: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await validateAdminRequest(req);
    if (authResult instanceof Response) return authResult;

    const csrfError = validateMutationCsrf(req);
    if (csrfError) return csrfError;

    const { id } = await params;
    const body = await req.json();
    const { adminNote } = rejectSchema.parse(body);

    const result = await db.transaction(async (tx) => {
      const [ad] = await tx
        .select()
        .from(propertyAds)
        .where(
          and(
            eq(propertyAds.id, id),
            eq(propertyAds.paymentStatus, "pending"),
          ),
        )
        .for("update")
        .limit(1);

      if (!ad) {
        return fail("Iklan tidak ditemukan atau sudah diproses", 400);
      }

      const [updated] = await tx
        .update(propertyAds)
        .set({
          paymentStatus: "rejected",
          adminNote: adminNote || null,
          isActive: false,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(propertyAds.id, id),
            eq(propertyAds.paymentStatus, "pending"),
          ),
        )
        .returning();

      if (!updated) {
        logSecurityEvent("ad_reject_race_condition", { adId: id });
        return fail("Iklan tidak ditemukan atau sudah diproses", 400);
      }

      return ok({ success: true, message: "Iklan berhasil ditolak" });
    });

    return result;
  } catch (error) {
    logError(error, "POST /api/admin/ads/[id]/reject");
    return handleApiError(error, "POST /api/admin/ads/[id]/reject");
  }
}
