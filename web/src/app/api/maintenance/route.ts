import { NextRequest } from "next/server";
import { db } from "@/db";
import { maintenanceTickets, units, properties, bookings } from "@/db/schema";
import { eq, and, desc, inArray, gte, lte } from "drizzle-orm";
import { maintenanceStatus } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { validateMutationCsrf } from "@/lib/api-auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { z } from "zod";

const createTicketSchema = z.object({
  unitId: z.string().uuid(),
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(2000),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  images: z.array(z.string().url()).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let whereClause;

    if (session.user.role === "owner") {
      const ownerProperties = await db
        .select({ id: properties.id })
        .from(properties)
        .where(eq(properties.ownerId, session.user.id));

      const propertyIds = ownerProperties.map((p) => p.id);
      if (propertyIds.length === 0) {
        return ok({ data: [], meta: { total: 0 } });
      }

      const ownerUnits = await db
        .select({ id: units.id })
        .from(units)
        .where(inArray(units.propertyId, propertyIds));

      const unitIds = ownerUnits.map((u) => u.id);
      if (unitIds.length === 0) {
        return ok({ data: [], meta: { total: 0 } });
      }

      whereClause = inArray(maintenanceTickets.unitId, unitIds);
    } else {
      whereClause = eq(maintenanceTickets.tenantId, session.user.id);
    }

    if (status) {
      whereClause = and(
        whereClause,
        eq(
          maintenanceTickets.status,
          status as (typeof maintenanceStatus)[number],
        ),
      );
    }

    const data = await db
      .select({
        id: maintenanceTickets.id,
        unitId: maintenanceTickets.unitId,
        tenantId: maintenanceTickets.tenantId,
        title: maintenanceTickets.title,
        description: maintenanceTickets.description,
        images: maintenanceTickets.images,
        priority: maintenanceTickets.priority,
        status: maintenanceTickets.status,
        ownerNotes: maintenanceTickets.ownerNotes,
        createdAt: maintenanceTickets.createdAt,
        updatedAt: maintenanceTickets.updatedAt,
        unitName: units.name,
        propertyName: properties.name,
      })
      .from(maintenanceTickets)
      .leftJoin(units, eq(maintenanceTickets.unitId, units.id))
      .leftJoin(properties, eq(units.propertyId, properties.id))
      .where(whereClause)
      .orderBy(desc(maintenanceTickets.createdAt));

    return ok({ data, meta: { total: data.length } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const csrfError = validateMutationCsrf(req);
    if (csrfError) return csrfError;
    const session = await requireSession(["cust"] as const);
    const body = createTicketSchema.parse(await req.json());

    const [unit] = await db
      .select()
      .from(units)
      .where(eq(units.id, body.unitId))
      .limit(1);

    if (!unit) {
      return fail("Unit not found", 404);
    }

    const [activeBooking] = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.unitId, body.unitId),
          eq(bookings.userId, session.user.id),
          eq(bookings.status, "confirmed"),
          lte(bookings.startDate, new Date()),
          gte(bookings.endDate, new Date()),
        ),
      )
      .limit(1);

    if (!activeBooking) {
      return fail(
        "You can only create maintenance tickets for units you are currently renting",
        400,
      );
    }

    const [ticket] = await db
      .insert(maintenanceTickets)
      .values({
        unitId: body.unitId,
        tenantId: session.user.id,
        title: body.title,
        description: body.description,
        priority: body.priority,
        images: body.images ?? [],
      })
      .returning();

    return ok(ticket, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
