import { NextRequest } from "next/server";
import { db } from "@/db";
import { favorites } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { validateMutationCsrf } from "@/lib/api-auth";
import { ok, fail, handleApiError } from "@/lib/api";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> },
) {
  try {
    const csrfError = validateMutationCsrf(req);
    if (csrfError) return csrfError;
    const session = await requireSession();
    const { propertyId } = await params;

    await db
      .delete(favorites)
      .where(
        and(
          eq(favorites.userId, session.user.id),
          eq(favorites.propertyId, propertyId),
        ),
      );

    return ok({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
