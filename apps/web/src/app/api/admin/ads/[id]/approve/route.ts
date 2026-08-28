import { NextRequest } from "next/server";
import { db } from "@/db";
import { propertyAds, adPackages } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { validateAdminRequest } from "@/lib/api-auth";
import { validateMutationCsrf } from "@/lib/api-auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { logError, logSecurityEvent } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await validateAdminRequest(req);
    if (authResult instanceof Response) return authResult;

    const csrfError = validateMutationCsrf(req);
    if (csrfError) return csrfError;

    const { id } = await params;
    const now = new Date();

    const result = await db.transaction(async (tx) => {
      const [ad] = await tx
        .select()
        .from(propertyAds)
        .where(
          and(eq(propertyAds.id, id), eq(propertyAds.paymentStatus, "pending")),
        )
        .for("update")
        .limit(1);

      if (!ad) {
        return fail("Iklan tidak ditemukan atau sudah diproses", 400);
      }

      if (!ad.packageId) {
        return fail("Paket iklan tidak ditemukan", 400);
      }

      const [pkg] = await tx
        .select()
        .from(adPackages)
        .where(eq(adPackages.id, ad.packageId))
        .limit(1);

      if (!pkg) {
        return fail("Paket iklan tidak ditemukan", 400);
      }

      const endDate = new Date(
        now.getTime() + pkg.duration * 24 * 60 * 60 * 1000,
      );

      const [updated] = await tx
        .update(propertyAds)
        .set({
          paymentStatus: "paid",
          paidAt: now,
          isActive: true,
          endDate,
          updatedAt: now,
        })
        .where(
          and(eq(propertyAds.id, id), eq(propertyAds.paymentStatus, "pending")),
        )
        .returning();

      if (!updated) {
        logSecurityEvent("ad_approve_race_condition", { adId: id });
        return fail("Iklan tidak ditemukan atau sudah diproses", 400);
      }

      return ok({ success: true, message: "Iklan berhasil disetujui" });
    });

    return result;
  } catch (error) {
    logError(error, "POST /api/admin/ads/[id]/approve");
    return handleApiError(error, "POST /api/admin/ads/[id]/approve");
  }
}
