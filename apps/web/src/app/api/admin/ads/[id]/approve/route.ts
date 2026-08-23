import { NextRequest } from "next/server";
import { db } from "@/db";
import { propertyAds, adPackages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireSession(["admin", "staff"]);

    const { id } = await params;
    const [ad] = await db
      .select()
      .from(propertyAds)
      .where(eq(propertyAds.id, id))
      .limit(1);

    if (!ad) {
      return fail("Iklan tidak ditemukan", 404);
    }

    if (ad.paymentStatus !== "pending") {
      return fail("Iklan ini sudah diproses", 400);
    }

    if (!ad.packageId) {
      return fail("Paket iklan tidak ditemukan", 400);
    }

    const [pkg] = await db
      .select()
      .from(adPackages)
      .where(eq(adPackages.id, ad.packageId))
      .limit(1);

    if (!pkg) {
      return fail("Paket iklan tidak ditemukan", 400);
    }

    const now = new Date();
    const endDate = new Date(now.getTime() + pkg.duration * 24 * 60 * 60 * 1000);

    await db
      .update(propertyAds)
      .set({
        paymentStatus: "paid",
        paidAt: now,
        isActive: true,
        endDate,
        updatedAt: now,
      })
      .where(eq(propertyAds.id, id));

    return ok({ success: true, message: "Iklan berhasil disetujui" });
  } catch (error) {
    logError(error, "POST /api/admin/ads/[id]/approve");
    return handleApiError(error, "POST /api/admin/ads/[id]/approve");
  }
}
