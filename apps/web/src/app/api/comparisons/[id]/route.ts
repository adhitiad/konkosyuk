import { NextRequest } from "next/server";
import { db } from "@/db";
import { propertyComparisons } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const [comparison] = await db
      .select()
      .from(propertyComparisons)
      .where(eq(propertyComparisons.id, id))
      .limit(1);

    if (!comparison) {
      return fail("Perbandingan tidak ditemukan", 404);
    }

    if (comparison.userId !== session.user.id) {
      return fail("Tidak berwenang", 403);
    }

    return ok(comparison);
  } catch (error) {
    return handleApiError(error, "GET /api/comparisons/[id]");
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const [comparison] = await db
      .select()
      .from(propertyComparisons)
      .where(eq(propertyComparisons.id, id))
      .limit(1);

    if (!comparison) {
      return fail("Perbandingan tidak ditemukan", 404);
    }

    if (comparison.userId !== session.user.id) {
      return fail("Tidak berwenang", 403);
    }

    await db.delete(propertyComparisons).where(eq(propertyComparisons.id, id));

    return ok({ success: true });
  } catch (error) {
    return handleApiError(error, "DELETE /api/comparisons/[id]");
  }
}
