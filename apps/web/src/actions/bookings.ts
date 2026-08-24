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
  refundRequests,
  bookingStatus,
} from "@/db/schema";
import type { NewPayment } from "@/db/schema";

type BookingStatus = (typeof bookingStatus)[number];
import { eq, and, or, gte, lte, sql, desc, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import {
  bookingQuerySchema,
  checkoutBookingSchema,
} from "@konkosyuk/shared";
import {
  getPackageById,
  calculatePackageEndDate,
  validateBookingPackage,
  calculateCustomPrice,
  calculatePackagePriceWithSeasonal,
} from "@/lib/packages/calculator";
import { invalidateCacheByTag } from "@/lib/cache";
import { updateTag } from "next/cache";
import {
  sendApprovalEmail,
  sendBookingRequestEmail,
  sendBookingRejectionEmail,
} from "@/lib/notifications/email";
import { dispatchNotification } from "@/lib/notification-service";
import { getPaymentProvider } from "@/lib/payments";
import { generateInvoiceNumber, money } from "@/lib/utils";
import { checkFraudFlags } from "@/lib/fraud-check";
import { logError } from "@/lib/logger";

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
      ).catch((err) => logError(err, "Failed to send booking request email"));
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
    }).catch((err) => logError(err, "Failed to dispatch booking created notification"));

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
          ).catch((err) => logError(err, "Failed to send booking rejection email"));
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
          logError(err, "Failed to dispatch booking rejected notification"),
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
        ).catch((err) => logError(err, "Failed to send approval email"));
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
      }).catch((err) => logError(err, "Failed to dispatch booking approved notification"));

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
        .catch((err) => logError(err, "Failed to create move-in inspection"));

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
    logError(error, "reviewBookingAction error");
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

export async function getBookingsAction(params?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "Tidak terotorisasi" };
    }

    const query = bookingQuerySchema.parse(params ?? {});
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
        return { success: true, data: [], meta: { total: 0, page, limit, totalPages: 0 } };
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

    return {
      success: true,
      data,
      meta: { total, page, limit, totalPages },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || "Input tidak valid" };
    }
    return { success: false, error: "Gagal memuat booking" };
  }
}

export async function getBookingByIdAction(bookingId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "Tidak terotorisasi" };
    }

    const [booking] = await db
      .select({
        id: bookings.id,
        userId: bookings.userId,
        propertyId: bookings.propertyId,
        unitId: bookings.unitId,
        bookingType: bookings.bookingType,
        status: bookings.status,
        startDate: bookings.startDate,
        endDate: bookings.endDate,
        metadata: bookings.metadata,
        createdAt: bookings.createdAt,
        updatedAt: bookings.updatedAt,
        propertyName: properties.name,
        propertyAddress: properties.address,
        unitName: units.name,
        unitPrice: units.price,
      })
      .from(bookings)
      .leftJoin(properties, eq(bookings.propertyId, properties.id))
      .leftJoin(units, eq(bookings.unitId, units.id))
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!booking) {
      return { success: false, error: "Booking tidak ditemukan", status: 404 };
    }

    if (booking.userId !== session.user.id && session.user.role !== "admin" && session.user.role !== "staff") {
      return { success: false, error: "Dilarang", status: 403 };
    }

    const bookingPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.bookingId, bookingId))
      .orderBy(desc(payments.createdAt));

    const bookingRefundRequests = await db
      .select()
      .from(refundRequests)
      .where(eq(refundRequests.bookingId, bookingId))
      .orderBy(desc(refundRequests.createdAt));

    return {
      success: true,
      data: {
        ...booking,
        payments: bookingPayments,
        refundRequests: bookingRefundRequests,
      },
    };
  } catch {
    return { success: false, error: "Gagal memuat detail booking" };
  }
}

export async function checkoutBookingAction(bookingId: string, formData: FormData) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "Tidak terotorisasi" };
    }

    const body = checkoutBookingSchema.parse(Object.fromEntries(formData));

    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!booking) {
      return { success: false, error: "Booking tidak ditemukan", status: 404 };
    }

    if (booking.userId !== session.user.id) {
      return { success: false, error: "Dilarang", status: 403 };
    }

    let purpose: "dp" | "full_payment";
    let amount: number;

    if (booking.status === "pending_dp") {
      purpose = "dp";
      amount = booking.metadata?.dpAmount ? Number(booking.metadata.dpAmount) : 0;
    } else if (booking.status === "awaiting_full_payment") {
      purpose = "full_payment";
      amount = booking.metadata?.remainingAmount ? Number(booking.metadata.remainingAmount) : 0;
    } else {
      return { success: false, error: "Booking belum siap dibayar", status: 400 };
    }

    if (amount <= 0) {
      return { success: false, error: "Jumlah pembayaran tidak valid", status: 400 };
    }

    const adapter = getPaymentProvider(body.paymentProvider);
    if (!adapter) {
      return { success: false, error: "Provider pembayaran tidak didukung", status: 400 };
    }

    const validatedProvider = body.paymentProvider as "doku" | "ipaymu" | "nicepay" | "mock";

    const [user] = await db
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, booking.userId))
      .limit(1);

    if (!user?.name || !user?.email) {
      return { success: false, error: "Nama di profil harus sesuai dengan rekening untuk keamanan", status: 403 };
    }

    const fraudResult = await checkFraudFlags(booking.userId, amount);
    if (fraudResult.isBlocked) {
      return { success: false, error: fraudResult.reason ?? "Akses diblokir karena aktivitas mencurigakan", status: 403 };
    }

    const invoiceNumber = generateInvoiceNumber(
      purpose.toUpperCase() as "DP" | "FULL",
    );

    const paymentMetadata: Record<string, unknown> = {
      invoiceNumber,
      bookingCode: booking.metadata?.bookingCode,
    };

    if (fraudResult.requiresManualReview) {
      paymentMetadata.fraudReview = true;
      paymentMetadata.fraudReason = "amount_exceeds_10m";
    }

    const paymentValues: NewPayment = {
      bookingId: booking.id,
      provider: validatedProvider,
      purpose,
      amount: money(amount),
      currency: "IDR",
      status: "pending",
      transactionId: invoiceNumber,
      metadata: paymentMetadata,
    };

    const [payment] = await db
      .insert(payments)
      .values(paymentValues)
      .returning();

    try {
      const result = await adapter.createPayment({
        bookingId: booking.id,
        provider: validatedProvider,
        purpose,
        amount,
        currency: "IDR",
        expiresIn: 21600,
        metadata: {
          invoiceNumber,
          bookingCode: booking.metadata?.bookingCode,
          customerName: user.name,
          customerEmail: user.email,
        },
      });

      await db
        .update(payments)
        .set({
          transactionId: result.transactionId,
          rawResponse: result.rawResponse,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id));

      updateTag("bookings");
      invalidateCacheByTag("bookings");

      return {
        success: true,
        data: {
          paymentId: payment.id,
          invoiceNumber,
          redirectUrl: result.redirectUrl,
          qrCode: result.qrCode,
          vaNumber: result.vaNumber,
          expiresAt: result.expiresAt,
        },
      };
    } catch (error) {
      await db
        .update(payments)
        .set({ status: "failed", updatedAt: new Date() })
        .where(eq(payments.id, payment.id));

      throw error;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || "Input tidak valid", status: 400 };
    }
    return { success: false, error: "Gagal memproses pembayaran" };
  }
}
