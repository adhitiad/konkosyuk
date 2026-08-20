import { NextRequest } from "next/server";
import { db } from "@/db";
import {
  bookings,
  units,
  properties,
  users,
  seasonalPricingRules,
} from "@/db/schema";
import { bookingStatus } from "@/db/schema";
import { eq, and, or, gte, lte, sql, desc, inArray } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { bookingRateLimit, enforceRateLimit } from "@/lib/rate-limit";
import { validateMutationCsrf } from "@/lib/api-auth";
import { ok, handleApiError } from "@/lib/api";
import { createBookingSchema, bookingQuerySchema } from "@/lib/zod";
import { logError, logApiRequest, logSecurityEvent } from "@/lib/logger";
import {
  getPackageById,
  calculatePackageEndDate,
  validateBookingPackage,
  calculateCustomPrice,
  calculatePackagePriceWithSeasonal,
} from "@/lib/packages/calculator";
import { NotFoundError, ValidationError, ApiError } from "@/lib/api-error";

type BookingStatus = (typeof bookingStatus)[number];

export async function GET(req: NextRequest) {
  const startTime = Date.now();

  try {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);
    const rawParams = Object.fromEntries(searchParams);
    const query = bookingQuerySchema.parse(rawParams);
    const { page, limit, status } = query;

    const statusValue = typeof status === "string" ? status : undefined;
    let where: ReturnType<typeof eq> | ReturnType<typeof and> | undefined;

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
        ? and(baseWhere, eq(bookings.status, statusValue as BookingStatus))
        : baseWhere;
    } else if (session.user.role === "admin" || session.user.role === "staff") {
      where = statusValue
        ? eq(bookings.status, statusValue as BookingStatus)
        : undefined;
    } else {
      where = statusValue
        ? and(
            eq(bookings.userId, session.user.id),
            eq(bookings.status, statusValue as BookingStatus),
          )
        : eq(bookings.userId, session.user.id);
    }

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

    const duration = Date.now() - startTime;
    logApiRequest("GET", "/api/bookings", 200, duration, session.user.id);

    return ok({ data, meta: { total, page, limit, totalPages } });
  } catch (error) {
    const duration = Date.now() - startTime;
    const statusCode = error instanceof ApiError ? error.statusCode : 500;
    logApiRequest("GET", "/api/bookings", statusCode, duration);
    logError(error, "GET /api/bookings");
    return handleApiError(error, "GET /api/bookings");
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const csrfError = validateMutationCsrf(req);
    if (csrfError) return csrfError;

    const limited = await enforceRateLimit(req, bookingRateLimit);
    if (limited) {
      logSecurityEvent("rate_limit_exceeded", {
        path: "/api/bookings",
        method: "POST",
      });
      return limited;
    }

    const session = await requireSession(["cust"]);
    const body = createBookingSchema.parse(await req.json());

    const [unit] = await db
      .select()
      .from(units)
      .where(eq(units.id, body.unitId))
      .limit(1);

    if (!unit) {
      throw new NotFoundError("Unit");
    }

    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, body.propertyId))
      .limit(1);

    if (!property) {
      throw new NotFoundError("Property");
    }

    if (unit.propertyId !== property.id) {
      throw new ValidationError("Unit does not belong to property", {
        unitId: body.unitId,
        propertyId: body.propertyId,
      });
    }

    if (unit.status !== "available") {
      throw new ValidationError("Unit is not available", {
        unitId: body.unitId,
        unitStatus: unit.status,
      });
    }

    const packageValidation = validateBookingPackage(
      property.packages,
      body.packageId,
      body.customDuration,
    );
    if (!packageValidation.valid) {
      throw new ValidationError(
        packageValidation.error || "Paket tidak valid",
        {
          packageId: body.packageId,
          customDuration: body.customDuration,
        },
      );
    }

    const pkg = getPackageById(property.packages, body.packageId);
    if (!pkg) {
      throw new NotFoundError("Package");
    }

    let totalPrice: number;
    let endDate: Date;
    let appliedSeasonalRuleId: string | undefined;

    const checkIn = new Date(body.startDate);
    const seasonalRules = await db
      .select()
      .from(seasonalPricingRules)
      .where(
        and(
          eq(seasonalPricingRules.propertyId, property.id),
          eq(seasonalPricingRules.isActive, true),
          or(
            sql`${seasonalPricingRules.unitId} IS NULL`,
            eq(seasonalPricingRules.unitId, unit.id),
          ),
        ),
      )
      .orderBy(
        desc(seasonalPricingRules.priority),
        desc(seasonalPricingRules.createdAt),
      );

    if (body.packageId === "custom" && property.packages.custom.enabled) {
      const customResult = calculateCustomPrice(
        property.packages,
        body.customDuration!,
        seasonalRules,
        checkIn,
      );
      totalPrice = customResult.finalPrice;
      appliedSeasonalRuleId = customResult.seasonal?.ruleId;
      endDate = calculatePackageEndDate(
        body.startDate,
        property.packages.custom.unit,
        body.customDuration!,
      );
    } else {
      const priceResult = calculatePackagePriceWithSeasonal(
        pkg.basePrice,
        pkg.discountPercent,
        pkg.ppnPercent,
        pkg.appFeePercent,
        seasonalRules,
        checkIn,
      );
      totalPrice = priceResult.finalPrice;
      appliedSeasonalRuleId = priceResult.seasonal?.ruleId;
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
      throw new ValidationError(
        "Unit is already booked for the selected dates",
        {
          unitId: body.unitId,
          startDate: body.startDate,
          endDate: endDate.toISOString(),
        },
      );
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
          pricingRuleId: appliedSeasonalRuleId,
        },
      })
      .returning();

    const duration = Date.now() - startTime;
    logApiRequest("POST", "/api/bookings", 201, duration, session.user.id);
    logSecurityEvent("booking_created", {
      userId: session.user.id,
      bookingId: booking.id,
      propertyId: property.id,
      unitId: unit.id,
      totalPrice,
      dpAmount,
    });

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
    const duration = Date.now() - startTime;
    const statusCode = error instanceof ApiError ? error.statusCode : 500;
    logApiRequest("POST", "/api/bookings", statusCode, duration);
    logError(error, "POST /api/bookings");
    return handleApiError(error, "POST /api/bookings");
  }
}
