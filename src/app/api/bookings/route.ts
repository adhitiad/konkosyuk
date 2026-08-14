import { NextRequest } from "next/server";
import { db } from "@/db";
import { bookings, units, properties, payments, users } from "@/db/schema";
import { eq, and, or, gte, lte, sql, desc, inArray } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { bookingRateLimit, enforceRateLimit } from "@/lib/rate-limit";
import { validateMutationCsrf } from "@/lib/api-auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { createBookingSchema, bookingQuerySchema } from "@/lib/zod";
import type { Role } from "@/lib/auth";
import { logError, logApiRequest } from "@/lib/logger";
import {
  getPackageById,
  calculatePackageEndDate,
  calculatePackageFinalPrice,
  validateBookingPackage,
  calculateCustomPrice,
} from "@/lib/packages/calculator";
import { getCachedData, buildCacheKey, invalidateCacheByTag } from "@/lib/cache";

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);
    const rawParams = Object.fromEntries(searchParams);
    const query = bookingQuerySchema.parse(rawParams);
    const { page, limit, status } = query;

    const statusValue = typeof status === "string" ? status : undefined;
    let where;

    if (session.user.role === "owner") {
      const ownerProperties = await db
        .select({ id: properties.id })
        .from(properties)
        .where(eq(properties.ownerId, session.user.id));

      const propertyIds = ownerProperties.map((p) => p.id);
      if (propertyIds.length === 0) {
        return ok({ data: [], meta: { total: 0, page, limit, totalPages: 0 } });
      }

      const baseWhere = inArray(bookings.propertyId, propertyIds);
      where = statusValue
        ? and(baseWhere, eq(bookings.status, statusValue as any))
        : baseWhere;
    } else if (session.user.role === "admin" || session.user.role === "staff") {
      where = statusValue ? eq(bookings.status, statusValue as any) : undefined;
    } else {
      where = statusValue
        ? and(
            eq(bookings.userId, session.user.id),
            eq(bookings.status, statusValue as any),
          )
        : eq(bookings.userId, session.user.id);
    }

    const cacheKey = buildCacheKey("bookings", {
      userId: session.user.id,
      role: session.user.role,
      status: statusValue ?? "all",
      page,
      limit,
    });

    const result = await getCachedData(
      cacheKey,
      async () => {
        const offset = (page - 1) * limit;

        const [data, [{ count: totalCount }]] = await Promise.all([
          db
            .select({
              id: bookings.id,
              propertyId: bookings.propertyId,
              unitId: bookings.unitId,
              bookingType: bookings.bookingType,
              status: bookings.status,
              startDate: bookings.startDate,
              endDate: bookings.endDate,
              metadata: bookings.metadata,
              rejectionReason: bookings.rejectionReason,
              createdAt: bookings.createdAt,
              updatedAt: bookings.updatedAt,
              propertyName: properties.name,
              propertyAddress: properties.address,
              unitName: units.name,
              unitPrice: units.price,
              userName: users.name,
              userEmail: users.email,
            })
            .from(bookings)
            .leftJoin(properties, eq(bookings.propertyId, properties.id))
            .leftJoin(units, eq(bookings.unitId, units.id))
            .leftJoin(users, eq(bookings.userId, users.id))
            .where(where)
            .orderBy(desc(bookings.createdAt))
            .limit(limit)
            .offset(offset),
          db
            .select({ count: sql<number>`count(*)` })
            .from(bookings)
            .where(where),
        ]);

        const total = Number(totalCount);
        const totalPages = Math.ceil(total / limit);

        return { data, meta: { total, page, limit, totalPages } };
      },
      { ttlSeconds: 30, tags: ["bookings"] }
    );

    const duration = Date.now() - startTime;
    logApiRequest("GET", "/api/bookings", 200, duration);

    return ok(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    const statusCode =
      error instanceof Error && "statusCode" in error
        ? (error as any).statusCode
        : 500;
    logApiRequest("GET", "/api/bookings", statusCode, duration);
    logError(error, "GET /api/bookings");
    return handleApiError(error, "GET /api/bookings");
  }
}

export async function POST(req: NextRequest) {
  try {
    const csrfError = validateMutationCsrf(req);
    if (csrfError) return csrfError;
    const limited = await enforceRateLimit(req, bookingRateLimit);
    if (limited) return limited;
    const session = await requireSession(["cust"] as Role[]);
    const body = createBookingSchema.parse(await req.json());

    const [unit] = await db
      .select()
      .from(units)
      .where(eq(units.id, body.unitId))
      .limit(1);

    if (!unit) {
      return fail("Unit not found", 404);
    }

    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, body.propertyId))
      .limit(1);

    if (!property) {
      return fail("Property not found", 404);
    }

    if (unit.propertyId !== property.id) {
      return fail("Unit does not belong to property", 400);
    }

    if (unit.status !== "available") {
      return fail("Unit is not available", 400);
    }

    const packageValidation = validateBookingPackage(
      property.packages,
      body.packageId,
      body.customDuration,
    );
    if (!packageValidation.valid) {
      return fail(packageValidation.error || "Paket tidak valid", 400);
    }

    const pkg = getPackageById(property.packages, body.packageId);
    if (!pkg) {
      return fail("Paket tidak ditemukan", 404);
    }

    let totalPrice: number;
    let endDate: Date;

    if (body.packageId === "custom" && property.packages.custom.enabled) {
      const customResult = calculateCustomPrice(
        property.packages,
        body.customDuration!,
      );
      totalPrice = customResult.finalPrice;
      endDate = calculatePackageEndDate(
        body.startDate,
        property.packages.custom.unit,
        body.customDuration!,
      );
    } else {
      totalPrice = calculatePackageFinalPrice(
        pkg.basePrice,
        pkg.discountPercent,
        pkg.ppnPercent,
        pkg.appFeePercent,
      );
      endDate = calculatePackageEndDate(body.startDate, pkg.unit, pkg.value);
    }

    const dpAmount = Math.round(totalPrice * 0.35);
    const remainingAmount = totalPrice - dpAmount;

    const bookingType = unit.status === "available" ? "instant" : "request";

    const overlapping = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.unitId, body.unitId),
          or(
            and(
              gte(bookings.startDate, new Date(body.startDate)),
              lte(bookings.startDate, endDate),
            ),
            and(
              gte(bookings.endDate, new Date(body.startDate)),
              lte(bookings.endDate, endDate),
            ),
            and(
              lte(bookings.startDate, new Date(body.startDate)),
              gte(bookings.endDate, endDate),
            ),
          ),
        ),
      )
      .limit(1);

    if (overlapping.length > 0) {
      return fail("Unit is already booked for the selected dates", 400);
    }

    const [booking] = await db
      .insert(bookings)
      .values({
        userId: session.user.id,
        propertyId: property.id,
        unitId: unit.id,
        bookingType,
        status: "pending_dp",
        startDate: new Date(body.startDate),
        endDate: endDate,
        metadata: {
          ...body.metadata,
          packageId: body.packageId,
          customDuration: body.customDuration,
          totalPrice,
          dpAmount,
          remainingAmount,
          basePrice: pkg.basePrice,
          discountPercent: pkg.discountPercent,
          ppnPercent: pkg.ppnPercent,
          appFeePercent: pkg.appFeePercent,
        },
      })
      .returning();

    await invalidateCacheByTag("bookings");

    return ok(
      {
        ...booking,
        payment: {
          totalPrice,
          dpAmount,
          remainingAmount,
        },
      },
      201,
    );
  } catch (error) {
    logError(error, "POST /api/bookings");
    return handleApiError(error, "POST /api/bookings");
  }
}
