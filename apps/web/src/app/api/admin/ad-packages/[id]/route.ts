import { NextRequest } from "next/server";
import { db } from "@/db";
import { adPackages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { z } from "zod";
import { logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

const updatePackageSchema = z.object({
  label: z.string().min(1).optional(),
  tier: z.enum(["reguler", "utama", "premium"]).optional(),
  duration: z.coerce.number().int().positive().optional(),
  price: z.coerce.number().positive().optional(),
  positionType: z.enum(["rotation", "fixed_1", "fixed_2"]).optional(),
  sortOrder: z.coerce.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireSession(["admin"]);

    const { id } = await params;

    const [pkg] = await db
      .select()
      .from(adPackages)
      .where(eq(adPackages.id, id))
      .limit(1);

    if (!pkg) {
      return fail("Paket tidak ditemukan", 404);
    }

    return ok(pkg);
  } catch (error) {
    logError(error, "GET /api/admin/ad-packages/[id]");
    return handleApiError(error, "GET /api/admin/ad-packages/[id]");
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireSession(["admin"]);

    const { id } = await params;
    const body = await req.json();
    const validated = updatePackageSchema.parse(body);

    const updateData: Record<string, unknown> = { ...validated };
    if (validated.price !== undefined) {
      updateData.price = validated.price.toString();
    }

    const [pkg] = await db
      .update(adPackages)
      .set(updateData)
      .where(eq(adPackages.id, id))
      .returning();

    if (!pkg) {
      return fail("Paket tidak ditemukan", 404);
    }

    return ok(pkg);
  } catch (error) {
    logError(error, "PUT /api/admin/ad-packages/[id]");
    return handleApiError(error, "PUT /api/admin/ad-packages/[id]");
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireSession(["admin"]);

    const { id } = await params;

    await db
      .update(adPackages)
      .set({ isActive: false })
      .where(eq(adPackages.id, id));

    return ok({ success: true });
  } catch (error) {
    logError(error, "DELETE /api/admin/ad-packages/[id]");
    return handleApiError(error, "DELETE /api/admin/ad-packages/[id]");
  }
}
