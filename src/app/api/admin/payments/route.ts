import { NextRequest } from "next/server";
import { db } from "@/db";
import {
  payments,
  bookings,
  units,
  properties,
  users,
  paymentStatus,
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { validateAdminRequest } from "@/lib/api-auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { z } from "zod";
import type { Role } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit-log";

const createManualPaymentSchema = z.object({
  userId: z.string().uuid(),
  bookingId: z.string().uuid(),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .refine(
      (val) => {
        const num = Number(val);
        return num > 0 && num < 1e12;
      },
      {
        message: "Amount must be a valid positive number less than 1 trillion",
      },
    ),
  provider: z.enum(["doku", "ipaymu", "nicepay"]),
  purpose: z.enum(["dp", "full_payment"]),
  transactionId: z.string().optional(),
  status: z
    .enum(["pending", "success", "failed", "expired", "refunded"])
    .default("pending"),
});

export async function GET(req: NextRequest) {
  try {
    await requireSession(["admin", "staff"] as Role[]);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const statusValue = typeof status === "string" ? status : undefined;

    const data = await db
      .select({
        id: payments.id,
        bookingId: payments.bookingId,
        provider: payments.provider,
        purpose: payments.purpose,
        amount: payments.amount,
        currency: payments.currency,
        status: payments.status,
        transactionId: payments.transactionId,
        paidAt: payments.paidAt,
        createdAt: payments.createdAt,
        updatedAt: payments.updatedAt,
        bookingCode: bookings.id,
        userName: users.name,
        userEmail: users.email,
        propertyName: properties.name,
        unitName: units.name,
      })
      .from(payments)
      .leftJoin(bookings, eq(payments.bookingId, bookings.id))
      .leftJoin(properties, eq(bookings.propertyId, properties.id))
      .leftJoin(units, eq(bookings.unitId, units.id))
      .leftJoin(users, eq(bookings.userId, users.id))
      .where(
        statusValue
          ? eq(payments.status, statusValue as (typeof paymentStatus)[number])
          : undefined,
      )
      .orderBy(desc(payments.createdAt))
      .limit(100);

    return ok({ data, meta: { total: data.length } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await validateAdminRequest(req);
    if (authResult instanceof Response) return authResult;
    const { session } = authResult;
    const body = createManualPaymentSchema.parse(await req.json());

    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, body.bookingId))
      .limit(1);

    if (!booking) {
      return fail("Booking not found", 404);
    }

    if (booking.userId !== body.userId) {
      return fail("User does not match booking", 400);
    }

    const [payment] = await db
      .insert(payments)
      .values({
        bookingId: body.bookingId,
        provider: body.provider,
        purpose: body.purpose,
        amount: body.amount,
        currency: "IDR",
        status: body.status,
        transactionId: body.transactionId,
        paidAt: body.status === "success" ? new Date() : null,
        metadata: {
          manual: true,
          createdBy: session.user.id,
        },
      })
      .returning();

    if (body.status === "success") {
      if (body.purpose === "dp") {
        const nextStatus =
          booking.bookingType === "request"
            ? "awaiting_owner_approval"
            : "awaiting_full_payment";

        await db
          .update(bookings)
          .set({ status: nextStatus, updatedAt: new Date() })
          .where(eq(bookings.id, booking.id));
      } else if (body.purpose === "full_payment") {
        await db.transaction(async (tx) => {
          await tx
            .update(bookings)
            .set({ status: "confirmed", updatedAt: new Date() })
            .where(eq(bookings.id, booking.id));

          await tx
            .update(units)
            .set({ status: "booked", updatedAt: new Date() })
            .where(eq(units.id, booking.unitId));
        });
      }
    }

    await createAuditLog({
      action: "create",
      targetType: "payment",
      targetId: payment.id,
      adminId: session.user.id,
      details: {
        bookingId: body.bookingId,
        amount: body.amount,
        provider: body.provider,
        purpose: body.purpose,
        status: body.status,
      },
    });

    return ok(payment, 201);
  } catch (error) {
    return handleApiError(error, "POST /api/admin/payments");
  }
}
