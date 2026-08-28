import { NextRequest } from "next/server";
import { db } from "@/db";
import { propertyAds } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { validateMutationCsrf } from "@/lib/api-auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireSession(["admin", "staff"]);

    const csrfError = validateMutationCsrf(req);
    if (csrfError) return csrfError;

    const { id } = await params;
    const [ad] = await db
      .select()
      .from(propertyAds)
      .where(eq(propertyAds.id, id))
      .limit(1);

    if (!ad) {
      return fail("Iklan tidak ditemukan", 404);
    }

    await db
      .update(propertyAds)
      .set({
        paymentStatus: "cancelled",
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(propertyAds.id, id));

    return ok({ success: true, message: "Iklan berhasil dibatalkan" });
  } catch (error) {
    logError(error, "POST /api/admin/ads/[id]/cancel");
    return handleApiError(error, "POST /api/admin/ads/[id]/cancel");
  }
}
