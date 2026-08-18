import { NextRequest } from "next/server";
import { db } from "@/db";
import { units, properties } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { validateMutationCsrf } from "@/lib/api-auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { createUnitSchema, unitQuerySchema } from "@/lib/zod";
import type { Role } from "@/lib/auth";
import { logError, logApiRequest } from "@/lib/logger";
import {
  getCachedData,
  buildCacheKey,
  invalidateCacheByTag,
} from "@/lib/cache";

export async function GET(req: NextRequest) {
  const startTime = Date.now();

  try {
    const query = unitQuerySchema.parse(
      Object.fromEntries(req.nextUrl.searchParams),
    );
    const { page, limit, propertyId, status } = query;

    const cacheKey = buildCacheKey("units", {
      propertyId: propertyId ?? "all",
      status: status ?? "all",
      page,
      limit,
    });

    const result = await getCachedData(
      cacheKey,
      async () => {
        const conditions = [];
        if (propertyId) {
          conditions.push(eq(units.propertyId, propertyId));
        }
        if (status) {
          conditions.push(eq(units.status, status));
        }

        const where = conditions.length > 0 ? and(...conditions) : undefined;
        const offset = (page - 1) * limit;

        const [data, [{ count }]] = await Promise.all([
          db
            .select()
            .from(units)
            .where(where)
            .orderBy(desc(units.createdAt))
            .limit(limit)
            .offset(offset),
          db
            .select({ count: sql<number>`count(*)` })
            .from(units)
            .where(where),
        ]);

        return {
          data,
          meta: {
            page,
            limit,
            total: Number(count),
            totalPages: Math.ceil(Number(count) / limit),
          },
        };
      },
      { ttlSeconds: 120, tags: ["units"] },
    );

    const duration = Date.now() - startTime;
    logApiRequest("GET", "/api/units", 200, duration);

    return ok(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    const statusCode =
      error instanceof Error && "statusCode" in error
        ? (error as { statusCode: number }).statusCode
        : 500;
    logApiRequest("GET", "/api/units", statusCode, duration);
    logError(error, "GET /api/units");
    return handleApiError(error, "GET /api/units");
  }
}

export async function POST(req: NextRequest) {
  try {
    const csrfError = validateMutationCsrf(req);
    if (csrfError) return csrfError;
    const session = await requireSession(["owner", "staff", "admin"] as Role[]);
    const body = createUnitSchema.parse(await req.json());

    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, body.propertyId))
      .limit(1);

    if (!property) {
      return fail("Property not found", 404);
    }

    if (session.user.role === "owner" && property.ownerId !== session.user.id) {
      return fail("Forbidden", 403);
    }

    const [existing] = await db
      .select()
      .from(units)
      .where(
        and(eq(units.propertyId, body.propertyId), eq(units.name, body.name)),
      )
      .limit(1);

    if (existing) {
      return fail("Unit name already exists in this property", 409);
    }

    const [unit] = await db.insert(units).values(body).returning();

    await invalidateCacheByTag("units");

    return ok(unit, 201);
  } catch (error) {
    logError(error, "POST /api/units");
    return handleApiError(error, "POST /api/units");
  }
}
