import { NextRequest } from "next/server";
import { db } from "@/db";
import { units, properties } from "@/db/schema";
import type { NewUnit } from "@/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { validateMutationCsrf } from "@/lib/api-auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { logError } from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession(["owner", "admin"]);
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId");

    let effectivePropertyIds: string[] | undefined;

    if (session.user.role === "owner") {
      const ownerProperties = await db
        .select({ id: properties.id })
        .from(properties)
        .where(eq(properties.ownerId, session.user.id));

      effectivePropertyIds = ownerProperties.map((p) => p.id);

      if (effectivePropertyIds.length === 0) {
        return ok({ data: [] });
      }

      if (propertyId && !effectivePropertyIds.includes(propertyId)) {
        return fail("Forbidden", 403);
      }
    }

    const conditions = [];
    if (propertyId) {
      conditions.push(eq(units.propertyId, propertyId));
    } else if (effectivePropertyIds) {
      conditions.push(inArray(units.propertyId, effectivePropertyIds));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const unitList = await db
      .select({
        id: units.id,
        name: units.name,
        description: units.description,
        price: units.price,
        capacity: units.capacity,
        size: units.size,
        status: units.status,
        metadata: units.metadata,
        createdAt: units.createdAt,
        updatedAt: units.updatedAt,
        propertyId: units.propertyId,
        propertyName: properties.name,
      })
      .from(units)
      .leftJoin(properties, eq(units.propertyId, properties.id))
      .where(whereClause)
      .orderBy(desc(units.createdAt))
      .limit(50);

    return ok({ data: unitList });
  } catch (error) {
    logError(error, "GET /api/owner/units");
    return handleApiError(error, "GET /api/owner/units");
  }
}

export async function POST(req: NextRequest) {
  try {
    const csrfError = validateMutationCsrf(req);
    if (csrfError) return csrfError;
    const session = await requireSession(["owner", "admin"]);
    const body = await req.json();

    const {
      propertyId,
      name,
      type,
      price,
      capacity,
      status,
      description,
      facilities,
    } = body as Record<string, unknown>;

    if (!propertyId || !name || !price) {
      return fail("propertyId, name, dan price wajib diisi", 400);
    }

    if (session.user.role === "owner") {
      const [property] = await db
        .select()
        .from(properties)
        .where(eq(properties.id, propertyId as string))
        .limit(1);

      if (!property || property.ownerId !== session.user.id) {
        return fail("Forbidden", 403);
      }
    }

    const metadata: Record<string, unknown> = {};
    if (type) metadata.unitType = type;
    if (Array.isArray(facilities)) metadata.facilities = facilities;

    // TypeScript narrowing for unit status
    const unitStatus =
      (status as "available" | "booked" | "maintenance" | null | undefined) ??
      "available";

    const unitValues: NewUnit = {
      propertyId: propertyId as string,
      name: name as string,
      description: (description as string | null) ?? null,
      price: String(price),
      capacity: capacity ? String(capacity) : null,
      status: unitStatus,
      metadata,
    };

    const [unit] = await db.insert(units).values(unitValues).returning();

    return ok(unit, 201);
  } catch (error) {
    logError(error, "POST /api/owner/units");
    return handleApiError(error, "POST /api/owner/units");
  }
}
