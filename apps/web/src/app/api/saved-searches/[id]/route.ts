import { NextRequest } from "next/server";
import { db } from "@/db";
import { savedSearches } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { ok, fail, handleApiError } from "@/lib/api";

export async function DELETE(
  __req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession(["cust", "owner", "admin", "staff"]);
    const { id } = await params;

    const [existing] = await db
      .select()
      .from(savedSearches)
      .where(
        and(
          eq(savedSearches.id, id),
          eq(savedSearches.userId, session.user.id),
        ),
      )
      .limit(1);

    if (!existing) {
      return fail("Pencarian tidak ditemukan", 404);
    }

    await db
      .delete(savedSearches)
      .where(
        and(
          eq(savedSearches.id, id),
          eq(savedSearches.userId, session.user.id),
        ),
      );

    return ok({ success: true });
  } catch (error) {
    return handleApiError(error, "DELETE /api/saved-searches/[id]");
  }
}

export async function PATCH(
  __req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession(["cust", "owner", "admin", "staff"]);
    const { id } = await params;

    const [existing] = await db
      .select()
      .from(savedSearches)
      .where(
        and(
          eq(savedSearches.id, id),
          eq(savedSearches.userId, session.user.id),
        ),
      )
      .limit(1);

    if (!existing) {
      return fail("Pencarian tidak ditemukan", 404);
    }

    const [updated] = await db
      .update(savedSearches)
      .set({ isActive: !existing.isActive, updatedAt: new Date() })
      .where(
        and(
          eq(savedSearches.id, id),
          eq(savedSearches.userId, session.user.id),
        ),
      )
      .returning();

    return ok({ success: true, data: { isActive: updated.isActive } });
  } catch (error) {
    return handleApiError(error, "PATCH /api/saved-searches/[id]");
  }
}
