"use server";

import { db } from "@/db";
import { bookingRequests, units, properties } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { logInfo, logError } from "@/lib/logger";
import { validateActionCsrf } from "@/lib/api-auth";

const createBookingRequestSchema = z.object({
  unitId: z.string().uuid(),
  propertyId: z.string().uuid(),
  numOccupants: z.coerce.number().int().min(1),
  startDate: z.string().datetime(),
});

export type CreateBookingRequestState = {
  success?: boolean;
  error?: string;
  data?: unknown;
};

export async function createBookingRequestAction(
  prevState: CreateBookingRequestState | undefined,
  formData: FormData,
): Promise<CreateBookingRequestState> {
  const csrfError = await validateActionCsrf(formData);
  if (csrfError) {
    return { error: csrfError, success: false };
  }

  try {
    const validated = createBookingRequestSchema.parse({
      unitId: formData.get("unitId"),
      propertyId: formData.get("propertyId"),
      numOccupants: formData.get("numOccupants"),
      startDate: formData.get("startDate"),
    });

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { error: "Tidak terotorisasi", success: false };
    }

    const [unit] = await db
      .select()
      .from(units)
      .where(eq(units.id, validated.unitId))
      .limit(1);

    if (!unit) {
      return { error: "Unit tidak ditemukan", success: false };
    }

    if (unit.status !== "available") {
      return { error: "Unit tidak tersedia", success: false };
    }

    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, validated.propertyId))
      .limit(1);

    if (!property) {
      return { error: "Properti tidak ditemukan", success: false };
    }

    if (unit.propertyId !== property.id) {
      return { error: "Unit bukan bagian dari properti ini", success: false };
    }

    const capacity = unit.capacity ? parseInt(unit.capacity, 10) : Infinity;
    if (validated.numOccupants > capacity) {
      return {
        error: `Jumlah penghuni melebihi kapasitas kamar (${capacity})`,
        success: false,
      };
    }

    const [existing] = await db
      .select()
      .from(bookingRequests)
      .where(
        and(
          eq(bookingRequests.unitId, validated.unitId),
          eq(bookingRequests.tenantId, session.user.id),
          eq(bookingRequests.status, "pending"),
        ),
      )
      .limit(1);

    if (existing) {
      return {
        error:
          "Anda sudah memiliki permintaan booking yang sedang menunggu untuk unit ini",
        success: false,
      };
    }

    const id = crypto.randomUUID();

    const [request] = await db
      .insert(bookingRequests)
      .values({
        id,
        tenantId: session.user.id,
        unitId: validated.unitId,
        propertyId: validated.propertyId,
        numOccupants: validated.numOccupants,
        startDate: new Date(validated.startDate),
      })
      .returning();

    logInfo("booking_request_created", {
      bookingRequestId: id,
      tenantId: session.user.id,
      unitId: validated.unitId,
      propertyId: validated.propertyId,
    });

    return { success: true, data: request };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: error.issues[0]?.message || "Input tidak valid",
        success: false,
      };
    }
    logError(error, "create_booking_request");
    return { error: "Gagal membuat permintaan booking", success: false };
  }
}

const reviewBookingRequestSchema = z.object({
  bookingRequestId: z.string().uuid(),
  status: z.enum(["approved", "rejected"]),
  agreedPrice: z.coerce.number().positive().optional(),
});

export type ReviewBookingRequestState = {
  success?: boolean;
  error?: string;
  data?: unknown;
};

export async function reviewBookingRequestAction(
  prevState: ReviewBookingRequestState | undefined,
  formData: FormData,
): Promise<ReviewBookingRequestState> {
  const csrfError = await validateActionCsrf(formData);
  if (csrfError) {
    return { error: csrfError, success: false };
  }

  try {
    const validated = reviewBookingRequestSchema.parse({
      bookingRequestId: formData.get("bookingRequestId"),
      status: formData.get("status"),
      agreedPrice: formData.get("agreedPrice"),
    });

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { error: "Tidak terotorisasi", success: false };
    }

    const [request] = await db
      .select()
      .from(bookingRequests)
      .where(eq(bookingRequests.id, validated.bookingRequestId))
      .limit(1);

    if (!request) {
      return { error: "Permintaan booking tidak ditemukan", success: false };
    }

    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, request.propertyId))
      .limit(1);

    if (!property || property.ownerId !== session.user.id) {
      return { error: "Dilarang", success: false };
    }

    const updated = await db
      .update(bookingRequests)
      .set({
        status: validated.status,
        agreedPrice: validated.agreedPrice?.toString() ?? request.agreedPrice,
        updatedAt: new Date(),
      })
      .where(eq(bookingRequests.id, validated.bookingRequestId))
      .returning();

    logInfo("booking_request_reviewed", {
      bookingRequestId: validated.bookingRequestId,
      status: validated.status,
      ownerId: session.user.id,
    });

    return { success: true, data: updated[0] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: error.issues[0]?.message || "Input tidak valid",
        success: false,
      };
    }
    logError(error, "review_booking_request");
    return { error: "Gagal meninjau permintaan booking", success: false };
  }
}
