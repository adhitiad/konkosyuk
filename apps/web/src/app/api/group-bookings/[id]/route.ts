import { NextRequest } from "next/server";
import { db } from "@/db";
import {
  groupBookings,
  groupBookingMembers,
  bookings,
  properties,
  units,
} from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { z } from "zod";
import { eq, desc, sql, and, or, gte, lte } from "drizzle-orm";
import { dispatchGroupBookingUpdated } from "@/lib/notification-service";

const updateGroupBookingSchema = z.object({
  status: z.enum(["pending", "confirmed", "cancelled", "completed"]).optional(),
  totalAmount: z.coerce.number().nonnegative().optional(),
  depositAmount: z.coerce.number().nonnegative().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const [groupBooking] = await db
      .select()
      .from(groupBookings)
      .where(eq(groupBookings.id, id))
      .limit(1);

    if (!groupBooking) {
      return fail("Group booking tidak ditemukan", 404);
    }

    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, groupBooking.propertyId))
      .limit(1);

    if (
      session.user.role === "owner" &&
      property?.ownerId !== session.user.id
    ) {
      return fail("Forbidden", 403);
    }

    const members = await db
      .select()
      .from(groupBookingMembers)
      .where(eq(groupBookingMembers.groupBookingId, id))
      .orderBy(desc(groupBookingMembers.createdAt));

    return ok({ ...groupBooking, members });
  } catch (error) {
    return handleApiError(error, "GET /api/group-bookings/[id]");
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const body = updateGroupBookingSchema.parse(await req.json());

    const [groupBooking] = await db
      .select()
      .from(groupBookings)
      .where(eq(groupBookings.id, id))
      .limit(1);

    if (!groupBooking) {
      return fail("Group booking tidak ditemukan", 404);
    }

    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, groupBooking.propertyId))
      .limit(1);

    if (
      session.user.role === "owner" &&
      property?.ownerId !== session.user.id
    ) {
      return fail("Forbidden", 403);
    }

    if (body.status === "confirmed" && groupBooking.status !== "confirmed") {
      const totalAmount = body.totalAmount ?? Number(groupBooking.totalAmount);
      const depositAmount =
        body.depositAmount ?? Number(groupBooking.depositAmount);

      await db.transaction(async (tx) => {
        const [locked] = await tx
          .select()
          .from(groupBookings)
          .where(eq(groupBookings.id, id))
          .for("update")
          .limit(1);

        if (!locked || locked.status === "confirmed") {
          return;
        }

        const [unit] = await tx
          .select()
          .from(units)
          .where(eq(units.id, groupBooking.unitId))
          .for("update")
          .limit(1);

        if (!unit || unit.status !== "available") {
          throw new Error("Unit tidak tersedia untuk dikonfirmasi");
        }

        const overlapping = await tx
          .select()
          .from(bookings)
          .where(
            and(
              eq(bookings.unitId, groupBooking.unitId),
              or(
                and(
                  gte(bookings.startDate, groupBooking.startDate),
                  lte(bookings.startDate, groupBooking.endDate),
                ),
                and(
                  gte(bookings.endDate, groupBooking.startDate),
                  lte(bookings.endDate, groupBooking.endDate),
                ),
                and(
                  lte(bookings.startDate, groupBooking.startDate),
                  gte(bookings.endDate, groupBooking.endDate),
                ),
              ),
            ),
          )
          .for("update")
          .limit(1);

        if (overlapping.length > 0) {
          throw new Error("Unit sudah memiliki booking yang tumpang tindih");
        }

        await tx
          .update(groupBookings)
          .set({
            status: "confirmed",
            totalAmount: sql`${totalAmount}`,
            depositAmount: sql`${depositAmount}`,
            ...(body.metadata !== undefined ? { metadata: body.metadata } : {}),
          })
          .where(eq(groupBookings.id, id));

        const members = await tx
          .select()
          .from(groupBookingMembers)
          .where(eq(groupBookingMembers.groupBookingId, id));

        const acceptedMembers = members.filter(
          (m) => m.status === "accepted" || m.status === "paid",
        );

        for (const member of acceptedMembers) {
          const memberShare =
            (Number(member.sharePercentage) / 100) * totalAmount;
          const memberDeposit =
            (Number(member.sharePercentage) / 100) * depositAmount;

          await tx.insert(bookings).values({
            userId: member.userId,
            propertyId: groupBooking.propertyId,
            unitId: groupBooking.unitId,
            bookingType: "instant",
            status: "pending_dp",
            startDate: new Date(groupBooking.startDate),
            endDate: new Date(groupBooking.endDate),
            metadata: {
              groupBookingId: groupBooking.id,
              sharePercentage: Number(member.sharePercentage),
              shareAmount: memberShare,
              depositAmount: memberDeposit,
            },
            isGroupBooking: true,
            groupBookingId: groupBooking.id,
            basePriceAtBooking: sql`${memberShare}`,
            securityDeposit: sql`${memberDeposit}`,
          });

          if (member.userId !== session.user.id) {
            dispatchGroupBookingUpdated(
              member.userId,
              id,
              property?.name || "Group Booking",
              "Group booking telah dikonfirmasi. Silakan lanjutkan pembayaran.",
            ).catch(() => {});
          }
        }
      });
    } else {
      await db
        .update(groupBookings)
        .set({
          ...(body.status !== undefined ? { status: body.status } : {}),
          ...(body.totalAmount !== undefined
            ? { totalAmount: sql`${body.totalAmount}` }
            : {}),
          ...(body.depositAmount !== undefined
            ? { depositAmount: sql`${body.depositAmount}` }
            : {}),
          ...(body.metadata !== undefined ? { metadata: body.metadata } : {}),
        })
        .where(eq(groupBookings.id, id))
        .returning();
    }

    const [updated] = await db
      .select()
      .from(groupBookings)
      .where(eq(groupBookings.id, id))
      .limit(1);

    return ok(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail(error.issues[0]?.message || "Input tidak valid", 400);
    }
    return handleApiError(error, "PUT /api/group-bookings/[id]");
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const [groupBooking] = await db
      .select()
      .from(groupBookings)
      .where(eq(groupBookings.id, id))
      .limit(1);

    if (!groupBooking) {
      return fail("Group booking tidak ditemukan", 404);
    }

    if (
      groupBooking.leadUserId !== session.user.id &&
      session.user.role !== "admin"
    ) {
      return fail("Forbidden", 403);
    }

    await db
      .update(groupBookings)
      .set({ status: "cancelled" })
      .where(eq(groupBookings.id, id));

    return ok({ success: true });
  } catch (error) {
    return handleApiError(error, "DELETE /api/group-bookings/[id]");
  }
}
