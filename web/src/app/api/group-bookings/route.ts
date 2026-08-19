import { NextRequest } from "next/server";
import { db } from "@/db";
import { groupBookings, groupBookingMembers, users, properties, units } from "@/db/schema";
import { requireSession, Role } from "@/lib/auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { z } from "zod";
import { eq, desc, and, sql, or } from "drizzle-orm";
import { dispatchGroupBookingInvite } from "@/lib/notification-service";

const createGroupBookingSchema = z.object({
  propertyId: z.string().uuid(),
  unitId: z.string().uuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  maxMembers: z.coerce.number().int().positive().max(50),
  memberEmails: z.array(z.string().email()).min(1, "Minimal 1 anggota"),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const groupBookingQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(["pending", "confirmed", "cancelled", "completed"]).optional(),
  propertyId: z.string().uuid().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const url = new URL(req.url);
    const query = groupBookingQuerySchema.parse(Object.fromEntries(url.searchParams));
    const { page, limit, status, propertyId } = query;

    const conditions = [];
    
    if (session.user.role === "cust") {
      conditions.push(
        or(
          eq(groupBookings.leadUserId, session.user.id),
          inArray(
            groupBookings.id,
            db.select({ groupBookingId: groupBookingMembers.groupBookingId })
              .from(groupBookingMembers)
              .where(eq(groupBookingMembers.userId, session.user.id))
          )
        )
      );
    } else if (session.user.role === "owner") {
      const ownerProperties = await db
        .select({ id: properties.id })
        .from(properties)
        .where(eq(properties.ownerId, session.user.id));
      const propertyIds = ownerProperties.map((p) => p.id);
      if (propertyIds.length === 0) {
        return ok({ data: [], meta: { total: 0, page, limit, totalPages: 0 } });
      }
      conditions.push(inArray(groupBookings.propertyId, propertyIds));
    }

    if (status) {
      conditions.push(eq(groupBookings.status, status));
    }
    if (propertyId) {
      conditions.push(eq(groupBookings.propertyId, propertyId));
    }

    const where = and(...conditions);

    const [data, totalResult] = await Promise.all([
      db
        .select()
        .from(groupBookings)
        .where(where)
        .orderBy(desc(groupBookings.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      db.select({ count: sql<number>`count(*)` }).from(groupBookings).where(where),
    ]);

    const total = Number(totalResult[0]?.count ?? 0);
    const totalPages = Math.ceil(total / limit);

    return ok({ data, meta: { page, limit, total, totalPages } });
  } catch (error) {
    return handleApiError(error, "GET /api/group-bookings");
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(["cust", "owner", "admin", "staff"] as Role[]);
    const body = createGroupBookingSchema.parse(await req.json());

    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, body.propertyId))
      .limit(1);

    if (!property) {
      return fail("Properti tidak ditemukan", 404);
    }

    if (session.user.role === "owner" && property.ownerId !== session.user.id) {
      return fail("Forbidden", 403);
    }

    const [unit] = await db
      .select()
      .from(units)
      .where(eq(units.id, body.unitId))
      .limit(1);

    if (!unit || unit.propertyId !== body.propertyId) {
      return fail("Unit tidak ditemukan", 404);
    }

    const memberCount = body.memberEmails.length + 1;
    const sharePercentage = memberCount > 0 ? 100 / memberCount : 100;

    const [groupBooking] = await db.transaction(async (tx) => {
      const [gb] = await tx
        .insert(groupBookings)
        .values({
          leadUserId: session.user.id,
          propertyId: body.propertyId,
          unitId: body.unitId,
          status: "pending",
          totalAmount: 0,
          depositAmount: 0,
          startDate: new Date(body.startDate),
          endDate: new Date(body.endDate),
          metadata: body.metadata || {},
        } satisfies GroupBookingInsert)
        .returning();

      await tx.insert(groupBookingMembers).values({
        groupBookingId: gb.id,
        userId: session.user.id,
        sharePercentage: sharePercentage,
        shareAmount: 0,
        paidAmount: 0,
        status: "accepted",
      } satisfies GroupBookingMemberInsert);

      return [gb];
    });

    for (const email of body.memberEmails) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (user) {
        await db.insert(groupBookingMembers).values({
          groupBookingId: groupBooking.id,
          userId: user.id,
          sharePercentage: sharePercentage,
          shareAmount: 0,
          paidAmount: 0,
          status: "invited",
        } satisfies GroupBookingMemberInsert);

        dispatchGroupBookingInvite(
          user.id,
          groupBooking.id,
          property.name,
          session.user.name,
        ).catch(() => {});
      }
    }

    return ok(groupBooking, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail(error.issues[0]?.message || "Input tidak valid", 400);
    }
    return handleApiError(error, "POST /api/group-bookings");
  }
}
