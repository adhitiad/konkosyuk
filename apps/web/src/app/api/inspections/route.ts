import { NextRequest } from "next/server";
import { db } from "@/db";
import { inspections, bookings, properties } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { z } from "zod";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import type { Role } from "@/lib/auth";
import { dispatchNotification } from "@/lib/notification-client";
import { logError } from "@/lib/logger";

const createInspectionSchema = z.object({
  bookingId: z.string().uuid(),
  type: z.enum(["move_in", "move_out", "mid_stay"]),
  performedById: z.string().uuid(),
  witnessId: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const inspectionQuerySchema = z.object({
  bookingId: z.string().uuid().optional(),
  propertyId: z.string().uuid().optional(),
  unitId: z.string().uuid().optional(),
  type: z.enum(["move_in", "move_out", "mid_stay"]).optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const rawParams = Object.fromEntries(req.nextUrl.searchParams);
    const query = inspectionQuerySchema.parse(rawParams);
    const { bookingId, propertyId, unitId, type, status, page, limit } = query;

    const conditions = [];

    if (session.user.role === "cust") {
      conditions.push(eq(inspections.performedBy, session.user.id));
    } else if (session.user.role === "owner") {
      const ownerProperties = await db
        .select({ id: properties.id })
        .from(properties)
        .where(eq(properties.ownerId, session.user.id));
      const propertyIds = ownerProperties.map((p) => p.id);
      if (propertyIds.length === 0) {
        return ok({ data: [], meta: { total: 0, page, limit, totalPages: 0 } });
      }
      conditions.push(inArray(inspections.propertyId, propertyIds));
    }

    if (bookingId) {
      conditions.push(eq(inspections.bookingId, bookingId));
    }
    if (propertyId) {
      conditions.push(eq(inspections.propertyId, propertyId));
    }
    if (unitId) {
      conditions.push(eq(inspections.unitId, unitId));
    }
    if (type) {
      conditions.push(eq(inspections.type, type));
    }
    if (status) {
      conditions.push(
        eq(
          inspections.status,
          status as "pending" | "in_progress" | "completed" | "disputed",
        ),
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const offset = (page - 1) * limit;

    const [data, [{ count: totalCount }]] = await Promise.all([
      db
        .select()
        .from(inspections)
        .where(where)
        .orderBy(desc(inspections.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(inspections)
        .where(where),
    ]);

    const total = Number(totalCount);
    const totalPages = Math.ceil(total / limit);

    return ok({ data, meta: { page, limit, total, totalPages } });
  } catch (error) {
    return handleApiError(error, "GET /api/inspections");
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(["owner", "admin", "staff"] as Role[]);
    const body = createInspectionSchema.parse(await req.json());

    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, body.bookingId))
      .limit(1);

    if (!booking) {
      return fail("Booking tidak ditemukan", 404);
    }

    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, booking.propertyId))
      .limit(1);

    if (!property) {
      return fail("Properti tidak ditemukan", 404);
    }

    if (session.user.role === "owner" && property.ownerId !== session.user.id) {
      return fail("Forbidden", 403);
    }

    const existingMoveIn = await db
      .select()
      .from(inspections)
      .where(
        and(
          eq(inspections.bookingId, body.bookingId),
          eq(inspections.type, "move_in"),
        ),
      )
      .limit(1);

    if (existingMoveIn.length > 0 && body.type === "move_in") {
      return fail("Move-in inspection sudah dibuat untuk booking ini", 400);
    }

    const existingMoveOut = await db
      .select()
      .from(inspections)
      .where(
        and(
          eq(inspections.bookingId, body.bookingId),
          eq(inspections.type, "move_out"),
        ),
      )
      .limit(1);

    if (existingMoveOut.length > 0 && body.type === "move_out") {
      return fail("Move-out inspection sudah dibuat untuk booking ini", 400);
    }

    const [inspection] = await db
      .insert(inspections)
      .values({
        bookingId: body.bookingId,
        propertyId: booking.propertyId,
        unitId: booking.unitId,
        type: body.type,
        performedBy: body.performedById,
        witnessId: body.witnessId,
        notes: body.notes,
      })
      .returning();

    if (property.ownerId && property.ownerId !== body.performedById) {
      dispatchNotification({
        userId: property.ownerId,
        type: "inspection_created",
        category: "inspection",
        title: `Inspeksi ${body.type === "move_in" ? "Move-in" : body.type === "move_out" ? "Move-out" : "Mid-stay"} Dibuat`,
        message: `Inspeksi baru telah dibuat untuk properti ${property.name}`,
        actionUrl: `/owner/inspections`,
        referenceId: inspection.id,
        referenceType: "inspection",
      }).catch((err) =>
        logError(err, "Failed to dispatch inspection created notification"),
      );
    }

    return ok(inspection, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail(error.issues[0]?.message || "Input tidak valid", 400);
    }
    return handleApiError(error, "POST /api/inspections");
  }
}
