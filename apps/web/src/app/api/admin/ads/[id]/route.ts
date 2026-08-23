import { NextRequest } from "next/server";
import { db } from "@/db";
import { propertyAds } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { validateMutationCsrf } from "@/lib/api-auth";
import { logApiRequest, logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const startTime = Date.now();
  const { id } = await params;

  try {
    await requireSession(["admin", "staff"]);

    const [ad] = await db
      .select()
      .from(propertyAds)
      .where(eq(propertyAds.id, id))
      .limit(1);

    if (!ad) {
      return fail("Iklan tidak ditemukan", 404);
    }

    const duration = Date.now() - startTime;
    logApiRequest("GET", `/api/admin/ads/${id}`, 200, duration);

    return ok(ad);
  } catch (error) {
    const duration = Date.now() - startTime;
    const statusCode =
      error instanceof Error && "statusCode" in error
        ? (error as { statusCode: number }).statusCode
        : 500;
    logApiRequest("GET", `/api/admin/ads/${id}`, statusCode, duration);
    logError(error, "GET /api/admin/ads/[id]");
    return handleApiError(error, "GET /api/admin/ads/[id]");
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireSession(["admin", "staff"]);

    const csrfError = validateMutationCsrf(req);
    if (csrfError) return csrfError;

    const { id } = await params;
    const body = await req.json();

    const [ad] = await db
      .update(propertyAds)
      .set({
        propertyId: body.propertyId,
        advertiserName: body.advertiserName,
        advertiserPhone: body.advertiserPhone,
        advertiserWhatsApp: body.advertiserWhatsApp,
        title: body.title,
        description: body.description,
        imageUrl: body.imageUrl,
        targetUrl: body.targetUrl,
        location: body.location,
        price: body.price,
        type: body.type,
        position: body.position,
        isActive: body.isActive,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : null,
        updatedAt: new Date(),
      })
      .where(eq(propertyAds.id, id))
      .returning();

    if (!ad) {
      return fail("Iklan tidak ditemukan", 404);
    }

    return ok(ad);
  } catch (error) {
    logError(error, "PUT /api/admin/ads/[id]");
    return handleApiError(error, "PUT /api/admin/ads/[id]");
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireSession(["admin", "staff"]);

    const csrfError = validateMutationCsrf(req);
    if (csrfError) return csrfError;

    const { id } = await params;

    await db
      .update(propertyAds)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(propertyAds.id, id));

    return ok({ success: true });
  } catch (error) {
    logError(error, "DELETE /api/admin/ads/[id]");
    return handleApiError(error, "DELETE /api/admin/ads/[id]");
  }
}
