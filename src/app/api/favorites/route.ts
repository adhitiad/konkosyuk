import { NextRequest } from "next/server";
import { db } from "@/db";
import { favorites, properties } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { validateMutationCsrf } from "@/lib/api-auth";
import { ok, fail, handleApiError } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();

    const data = await db
      .select({
        id: favorites.id,
        propertyId: favorites.propertyId,
        createdAt: favorites.createdAt,
        propertyName: properties.name,
        propertyAddress: properties.address,
        propertyType: properties.type,
        propertyBasePrice: properties.basePrice,
      })
      .from(favorites)
      .leftJoin(properties, eq(favorites.propertyId, properties.id))
      .where(eq(favorites.userId, session.user.id))
      .orderBy(desc(favorites.createdAt));

    return ok({ data, meta: { total: data.length } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const csrfError = validateMutationCsrf(req);
    if (csrfError) return csrfError;
    const session = await requireSession();
    const body = await req.json();
    const { propertyId } = body;

    if (!propertyId) {
      return fail("propertyId is required", 400);
    }

    const [favorite] = await db
      .insert(favorites)
      .values({
        userId: session.user.id,
        propertyId,
      })
      .returning();

    return ok(favorite, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
