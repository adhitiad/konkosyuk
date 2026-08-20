"use server";

import { db } from "@/db";
import {
  bookings,
  units,
  properties,
  users,
  balanceLogs,
  payments,
  seasonalPricingRules,
  inspections,
} from "@/db/schema";
import { eq, and, or, gte, lte, sql, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import {
  getPackageById,
  calculatePackageEndDate,
  validateBookingPackage,
  calculateCustomPrice,
  calculatePackagePriceWithSeasonal,
} from "@/lib/packages/calculator";
import { invalidateCacheByTag } from "@/lib/cache";
import {
  sendApprovalEmail,
  sendBookingRequestEmail,
  sendBookingRejectionEmail,
} from "@/lib/notifications/email";
import { dispatchNotification } from "@/lib/notification-service";

const createBookingSchema = z.object({
  propertyId: z.string().uuid(),
  unitId: z.string().uuid(),
  packageId: z.string().min(1),
  customDuration: z.coerce.number().int().positive().optional(),
  bookingType: z.enum(["instant", "request"]),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  paymentType: z.enum(["dp", "full"]).default("dp"),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CreateBookingState = {
  success?: boolean;
  error?: string;
  data?: {
    id: string;
    propertyId: string;
    unitId: string;
    bookingType: string;
    status: string;
    startDate: Date;
    endDate: Date;
    metadata: Record<string, unknown> | null;
    createdAt: Date;
    updatedAt: Date;
    payment: {
      totalPrice: number;
      dpAmount: number;
      remainingAmount: number;
    };
  };
};

export async function createBookingAction(
  prevState: CreateBookingState | undefined,
  formData: FormData,
): Promise<CreateBookingState> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { error: "Tidak terotorisasi", success: false };
    }

    if (session.user.role !== "cust") {
      return {
        error: "Hanya tenant yang dapat membuat booking",
        success: false,
      };
    }

    const validated = createBookingSchema.parse({
      propertyId: formData.get("propertyId"),
      unitId: formData.get("unitId"),
      packageId: formData.get("packageId"),
      customDuration: formData.get("customDuration")
        ? Number(formData.get("customDuration"))
        : undefined,
      startDate: formData.get("startDate"),
      paymentType: formData.get("paymentType") || "dp",
    });

    const [unit] = await db
      .select()
      .from(units)
      .where(eq(units.id, validated.unitId))
      .limit(1);

    if (!unit) {
      return { error: "Unit tidak ditemukan", success: false };
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
      return { error: "Unit tidak milik properti ini", success: false };
    }

    if (unit.status !== "available") {
      return { error: "Unit tidak tersedia", success: false };
    }

    const packageValidation = validateBookingPackage(
      property.packages,
      validated.packageId,
      validated.customDuration,
    );
    if (!packageValidation.valid) {
      return {
        error: packageValidation.error || "Paket tidak valid",
        success: false,
      };
    }

    const pkg = getPackageById(property.packages, validated.packageId);
    if (!pkg) {
      return { error: "Paket tidak ditemukan", success: false };
    }

    let totalPrice: number;
    let endDate: Date;
    let appliedSeasonalRuleId: string | undefined;

    const checkIn = new Date(validated.startDate);
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

    if (validated.packageId === "custom" && property.packages.custom.enabled) {
      const customResult = calculateCustomPrice(
        property.packages,
        validated.customDuration!,
        seasonalRules,
        checkIn,
      );
      totalPrice = customResult.finalPrice;
      appliedSeasonalRuleId = customResult.seasonal?.ruleId;
      endDate = calculatePackageEndDate(
        validated.startDate,
        property.packages.custom.unit,
        validated.customDuration!,
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
      endDate = calculatePackageEndDate(
        validated.startDate,
        pkg.unit,
        pkg.value,
      );
    }

    const dpAmount = Math.round(totalPrice * 0.35);
    const remainingAmount = totalPrice - dpAmount;

    const isFullPayment = validated.paymentType === "full";
    const bookingStatus = isFullPayment
      ? "awaiting_full_payment"
      : "pending_dp";
    const bookingDpAmount = isFullPayment ? 0 : dpAmount;
    const bookingRemainingAmount = isFullPayment ? totalPrice : remainingAmount;

    const bookingType = unit.status === "available" ? "instant" : "request";

    const overlapping = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.unitId, validated.unitId),
          or(
            and(
              gte(bookings.startDate, new Date(validated.startDate)),
              lte(bookings.startDate, endDate),
            ),
            and(
              gte(bookings.endDate, new Date(validated.startDate)),
              lte(bookings.endDate, endDate),
            ),
            and(
              lte(bookings.startDate, new Date(validated.startDate)),
              gte(bookings.endDate, endDate),
            ),
          ),
        ),
      )
      .limit(1);

    if (overlapping.length > 0) {
      return {
        error: "Unit sudah dibooking untuk tanggal yang dipilih",
        success: false,
      };
    }

    const [booking] = await db
      .insert(bookings)
      .values({
        userId: session.user.id,
        propertyId: property.id,
        unitId: unit.id,
        bookingType,
        status: bookingStatus,
        startDate: new Date(validated.startDate),
        endDate: endDate,
        metadata: {
          packageId: validated.packageId,
          customDuration: validated.customDuration,
          totalPrice,
          dpAmount: bookingDpAmount,
          remainingAmount: bookingRemainingAmount,
          basePrice: pkg.basePrice,
          discountPercent: pkg.discountPercent,
          ppnPercent: pkg.ppnPercent,
          appFeePercent: pkg.appFeePercent,
          pricingRuleId: appliedSeasonalRuleId,
        },
      })
      .returning();

    await invalidateCacheByTag("bookings");

    const [owner] = await db
      .select()
      .from(users)
      .where(eq(users.id, property.ownerId))
      .limit(1);

    if (owner?.email) {
      sendBookingRequestEmail(
        owner.email,
        owner.name,
        session.user.name,
        property.name,
        unit.name,
        `${process.env.NEXT_PUBLIC_APP_URL}/owner/booking-requests`,
      ).catch((err) =>
        console.error("Failed to send booking request email:", err),
      );
    }

    dispatchNotification({
      userId: property.ownerId,
      type: "booking_created",
      category: "booking",
      title: "Booking Baru",
      message: `${session.user.name} membuat booking untuk ${property.name} - ${unit.name}`,
      actionUrl: "/owner/booking-requests",
      referenceId: booking.id,
      referenceType: "booking",
      metadata: {
        ownerEmail: owner?.email,
        ownerName: owner?.name,
        tenantName: session.user.name,
        propertyName: property.name,
        unitName: unit.name,
        bookingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/owner/booking-requests`,
      },
    }).catch((err) =>
      console.error("Failed to dispatch booking created notification:", err),
    );

    return {
      success: true,
      data: {
        ...booking,
        payment: {
          totalPrice,
          dpAmount: bookingDpAmount,
          remainingAmount: bookingRemainingAmount,
        },
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: error.issues[0]?.message || "Input tidak valid",
        success: false,
      };
    }
    return { error: "Gagal membuat booking", success: false };
  }
}

const reviewBookingSchema = z.object({
  bookingId: z.string().uuid(),
  status: z.enum(["confirmed", "rejected"]),
  note: z.string().optional(),
});

export type ReviewBookingState = {
  success?: boolean;
  error?: string;
  data?: unknown;
};

export async function reviewBookingAction(
  prevState: ReviewBookingState | undefined,
  formData: FormData,
): Promise<ReviewBookingState> {
  try {
    const validated = reviewBookingSchema.parse({
      bookingId: formData.get("bookingId"),
      status: formData.get("status"),
      note: formData.get("note") || undefined,
    });

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { error: "Tidak terotorisasi", success: false };
    }

    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, validated.bookingId))
      .limit(1);

    if (!booking) {
      return { error: "Booking tidak ditemukan", success: false };
    }

    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, booking.propertyId))
      .limit(1);

    if (!property) {
      return { error: "Properti tidak ditemukan", success: false };
    }

    if (session.user.role === "owner" && property.ownerId !== session.user.id) {
      return { error: "Dilarang", success: false };
    }

    if (booking.status !== "awaiting_owner_approval") {
      return { error: "Booking tidak menunggu approval", success: false };
    }

    const newStatus =
      validated.status === "confirmed" ? "awaiting_full_payment" : "rejected";

    const updatePayload: Record<string, unknown> = {
      status: newStatus,
      metadata: {
        ...booking.metadata,
        reviewNote: validated.note,
        reviewedBy: session.user.id,
        reviewedAt: new Date().toISOString(),
      },
      updatedAt: new Date(),
    };

    if (validated.status === "rejected") {
      updatePayload.rejectionReason = validated.note ?? null;
    }

    if (validated.status === "rejected") {
      await db.transaction(async (tx) => {
        const [dpPayment] = await tx
          .select()
          .from(payments)
          .where(
            and(
              eq(payments.bookingId, validated.bookingId),
              eq(payments.status, "success"),
              eq(payments.purpose, "dp"),
            ),
          )
          .limit(1);

        if (dpPayment) {
          const dpAmount = Number(dpPayment.amount);

          await tx
            .update(users)
            .set({
              balance: sql`${users.balance} + ${dpAmount}`,
              updatedAt: new Date(),
            })
            .where(eq(users.id, booking.userId));

          await tx.insert(balanceLogs).values({
            userId: booking.userId,
            amount: dpAmount.toFixed(2),
            type: "refund",
            description: `Refund DP booking #${validated.bookingId.slice(0, 8)} - ${validated.note ?? "Booking ditolak"}`,
            relatedId: validated.bookingId,
          });
        }

        const [updated] = await tx
          .update(bookings)
          .set(updatePayload)
          .where(eq(bookings.id, booking.id))
          .returning();

        const [unit] = await tx
          .select()
          .from(units)
          .where(eq(units.id, booking.unitId))
          .limit(1);

        const [tenant] = await tx
          .select()
          .from(users)
          .where(eq(users.id, booking.userId))
          .limit(1);

        if (tenant?.email && unit) {
          sendBookingRejectionEmail(
            tenant.email,
            tenant.name,
            property.name,
            unit.name,
            validated.note ?? undefined,
          ).catch((err) =>
            console.error("Failed to send booking rejection email:", err),
          );
        }

        dispatchNotification({
          userId: booking.userId,
          type: "booking_rejected",
          category: "booking",
          priority: "high",
          title: "Booking Ditolak",
          message: `Booking Anda untuk ${property.name} - ${unit.name} ditolak oleh owner.`,
          actionUrl: "/dashboard/bookings",
          referenceId: booking.id,
          referenceType: "booking",
        }).catch((err) =>
          console.error(
            "Failed to dispatch booking rejected notification:",
            err,
          ),
        );

        return updated;
      });
    } else {
      const [updated] = await db
        .update(bookings)
        .set(updatePayload)
        .where(eq(bookings.id, booking.id))
        .returning();

      const [unit] = await db
        .select()
        .from(units)
        .where(eq(units.id, booking.unitId))
        .limit(1);

      const [tenant] = await db
        .select()
        .from(users)
        .where(eq(users.id, booking.userId))
        .limit(1);

      if (tenant?.email && unit) {
        const dpAmount = Number(booking.metadata?.dpAmount ?? 0);
        sendApprovalEmail(
          tenant.email,
          tenant.name,
          property.name,
          unit.name,
          dpAmount,
          `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/bookings`,
        ).catch((err) => console.error("Failed to send approval email:", err));
      }

      dispatchNotification({
        userId: booking.userId,
        type: "booking_approved",
        category: "booking",
        priority: "high",
        title: "Booking Disetujui",
        message: `Booking Anda untuk ${property.name} - ${unit.name} telah disetujui. Silakan lanjutkan pembayaran.`,
        actionUrl: "/dashboard/bookings",
        referenceId: booking.id,
        referenceType: "booking",
        metadata: {
          tenantEmail: tenant?.email,
          tenantName: tenant?.name,
          propertyName: property.name,
          unitName: unit?.name,
          dpAmount: Number(booking.metadata?.dpAmount ?? 0),
          invoiceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/bookings`,
        },
      }).catch((err) =>
        console.error("Failed to dispatch booking approved notification:", err),
      );

      await db
        .insert(inspections)
        .values({
          bookingId: booking.id,
          propertyId: property.id,
          unitId: unit.id,
          type: "move_in",
          performedBy: booking.userId,
          witnessId: property.ownerId,
          notes: `Auto-created move-in inspection for booking ${booking.id.slice(0, 8)}`,
        })
        .catch((err) =>
          console.error("Failed to create move-in inspection:", err),
        );

      return { success: true, data: updated };
    }

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: error.issues[0]?.message || "Input tidak valid",
        success: false,
      };
    }
    console.error("reviewBookingAction error:", error);
    return { error: "Gagal memproses review booking", success: false };
  }
}

export async function createBookingOrGroupAction(
  prevState: CreateBookingState | undefined,
  formData: FormData,
): Promise<CreateBookingState> {
  const isGroupBooking = formData.get("isGroupBooking") === "true";

  if (isGroupBooking) {
    const memberEmailsRaw = formData.get("memberEmails");
    const memberEmails = memberEmailsRaw
      ? String(memberEmailsRaw)
          .split(",")
          .map((e) => e.trim())
          .filter(Boolean)
      : [];

    if (memberEmails.length === 0) {
      return { error: "Minimal 1 anggota lain harus diundang", success: false };
    }

    const groupFormData = new FormData();
    groupFormData.set("propertyId", String(formData.get("propertyId") || ""));
    groupFormData.set("unitId", String(formData.get("unitId") || ""));
    groupFormData.set("startDate", String(formData.get("startDate") || ""));
    groupFormData.set("endDate", String(formData.get("startDate") || ""));
    groupFormData.set("maxMembers", String(memberEmails.length + 1));
    groupFormData.set("memberEmails", JSON.stringify(memberEmails));

    const createGroupBooking = (await import("./group-bookings"))
      .createGroupBookingAction;
    return createGroupBooking(
      undefined,
      groupFormData,
    ) as Promise<CreateBookingState>;
  }

  return createBookingAction(prevState, formData);
}
