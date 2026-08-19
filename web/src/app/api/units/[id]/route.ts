import { NextRequest } from "next/server";
import { db } from "@/db";
import { units, properties } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { validateMutationCsrf } from "@/lib/api-auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { updateUnitSchema } from "@/lib/zod";
import type { Role } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const csrfError = validateMutationCsrf(req);
    if (csrfError) return csrfError;
    const session = await requireSession(["owner", "staff", "admin"] as Role[]);
    const { id: unitId } = await params;
    const body = updateUnitSchema.parse(await req.json());

    const [unit] = await db
      .select()
      .from(units)
      .where(eq(units.id, unitId))
      .limit(1);

    if (!unit) {
      return fail("Unit not found", 404);
    }

    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, unit.propertyId))
      .limit(1);

    if (!property) {
      return fail("Property not found", 404);
    }

    if (session.user.role !== "admin" && property.ownerId !== session.user.id) {
      return fail("Forbidden", 403);
    }

    const [updated] = await db
      .update(units)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(units.id, unitId))
      .returning();

    return ok(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const csrfError = validateMutationCsrf(req);
    if (csrfError) return csrfError;
    const session = await requireSession(["owner", "staff", "admin"] as Role[]);
    const { id: unitId } = await params;

    const [unit] = await db
      .select()
      .from(units)
      .where(eq(units.id, unitId))
      .limit(1);

    if (!unit) {
      return fail("Unit not found", 404);
    }

    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, unit.propertyId))
      .limit(1);

    if (!property) {
      return fail("Property not found", 404);
    }

    if (session.user.role !== "admin" && property.ownerId !== session.user.id) {
      return fail("Forbidden", 403);
    }

    await db.delete(units).where(eq(units.id, unitId));

    return ok({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
