import { NextRequest } from "next/server";
import { db } from "@/db";
import { propertyAds } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { z } from "zod";
import { logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

const rejectSchema = z.object({
  adminNote: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireSession(["admin", "staff"]);

    const { id } = await params;
    const body = await req.json();
    const { adminNote } = rejectSchema.parse(body);

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

    await db
      .update(propertyAds)
      .set({
        paymentStatus: "rejected",
        adminNote: adminNote || null,
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(propertyAds.id, id));

    return ok({ success: true, message: "Iklan berhasil ditolak" });
  } catch (error) {
    logError(error, "POST /api/admin/ads/[id]/reject");
    return handleApiError(error, "POST /api/admin/ads/[id]/reject");
  }
}
