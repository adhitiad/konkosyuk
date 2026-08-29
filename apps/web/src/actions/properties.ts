"use server";

import { db } from "@/db";
import {
  properties,
  users,
  bookings,
  payments,
  platformSettings,
  notifications,
} from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { createPropertySchema, updatePropertySchema } from "@konkosyuk/shared";
import { invalidateCacheByTag } from "@/lib/cache";
import { parseJsonArrayField } from "@/lib/form-data-utils";
import type { Role } from "@/lib/auth";
import { money, generateInvoiceNumber } from "@/lib/utils";
import { DEFAULT_FEATURED_LISTING_PRICE } from "@/lib/constants/actions";
import { logError } from "@/lib/logger";
import { getPaymentProvider } from "@/lib/payments";
import { createAuditLog } from "@/lib/audit-log";
import type { PropertyPackages } from "@/types/property";
import type { NewProperty, NewPayment } from "@/db/schema";
import { validateActionCsrf } from "@/lib/api-auth";
import {
  validateAndApplyVoucher,
  redeemVoucherAtomically,
} from "@/lib/referrals/voucher";
import { sanitizeString } from "@/lib/sanitize";
import type {
  CreatePropertyState,
  UpdatePropertyState,
  DeletePropertyState,
  FeaturePropertyState,
  ApprovePropertyState,
  CheckoutFeaturedState,
} from "@/types/action";

export async function createPropertyAction(
  _prevState: CreatePropertyState | undefined,
  formData: FormData,
): Promise<CreatePropertyState> {
  const csrfError = await validateActionCsrf(formData);
  if (csrfError) {
    return { error: csrfError, success: false };
  }

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { error: "Tidak terotorisasi", success: false };
    }

    if (session.user.role === "owner") {
      const [user] = await db
        .select({ kycStatus: users.kycStatus })
        .from(users)
        .where(eq(users.id, session.user.id))
        .limit(1);

      if (user?.kycStatus !== "verified") {
        return {
          error: "Verifikasi KTP Anda terlebih dahulu.",
          success: false,
        };
      }

      if (!session.user.phone) {
        return { error: "Nomor HP/WA wajib diisi di profil.", success: false };
      }

      if (!session.user.name || session.user.name.trim().length < 2) {
        return {
          error: "Nama profil tidak sesuai dengan data KYC terverifikasi.",
          success: false,
        };
      }
    }

    const images = parseJsonArrayField(
      formData.get("images") as string | null,
      "images",
    );

    const packagesRaw = formData.get("packages") as string | null;
    let packages = undefined;
    if (packagesRaw) {
      try {
        packages = JSON.parse(packagesRaw) as PropertyPackages;
      } catch {
        throw new Error(
          "Field packages berisi JSON tidak valid. Pastikan client mengirim JSON.stringify(object)",
        );
      }
    }

    const amenities = parseJsonArrayField(
      formData.get("amenities") as string | null,
      "amenities",
    );

    const validated = createPropertySchema.parse({
      title: formData.get("title"),
      description: formData.get("description") || undefined,
      address: formData.get("address"),
      province: formData.get("province") || undefined,
      city: formData.get("city") || undefined,
      type: formData.get("type"),
      basePrice: formData.get("basePrice") || undefined,
      packages,
      status: formData.get("status") || "aktif",
      amenities,
      images,
      latitude: formData.get("latitude")
        ? Number(formData.get("latitude"))
        : undefined,
      longitude: formData.get("longitude")
        ? Number(formData.get("longitude"))
        : undefined,
    });

    const [property] = await db
      .insert(properties)
      .values({
        name: sanitizeString(validated.title) || validated.title,
        description: validated.description
          ? sanitizeString(validated.description)
          : null,
        address: validated.address ?? "",
        province: validated.province,
        city: validated.city,
        type: validated.type as
          "kost" | "kontrakan" | "apartemen" | "rumah" | "ruko",
        basePrice: validated.basePrice,
        packages: validated.packages ?? {
          predefined: [],
          custom: {
            enabled: false,
            label: "Custom Duration",
            unit: "days",
            pricePerUnit: 0,
            minDuration: 1,
            maxDuration: 365,
          },
        },
        status: (validated.status ?? "aktif") as "aktif" | "nonaktif",
        amenities: validated.amenities ?? [],
        images: validated.images ?? [],
        ownerId: session.user.id,
        latitude:
          validated.latitude !== undefined
            ? String(validated.latitude)
            : undefined,
        longitude:
          validated.longitude !== undefined
            ? String(validated.longitude)
            : undefined,
        isActive: false,
        isFeatured: false,
        gpsVerified: false,
      } satisfies NewProperty)
      .returning();

    await invalidateCacheByTag("properties");

    return { success: true, data: property };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: error.issues[0]?.message || "Input tidak valid",
        success: false,
      };
    }
    if (error instanceof Error) {
      return { error: error.message, success: false };
    }
    return { error: "Gagal menambahkan properti", success: false };
  }
}

export async function updatePropertyAction(
  _prevState: UpdatePropertyState | undefined,
  formData: FormData,
): Promise<UpdatePropertyState> {
  const csrfError = await validateActionCsrf(formData);
  if (csrfError) {
    return { error: csrfError, success: false };
  }

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { error: "Tidak terotorisasi", success: false };
    }

    const allowedRoles: Role[] = ["owner", "staff", "admin"];
    if (!allowedRoles.includes(session.user.role as Role)) {
      return { error: "Dilarang", success: false };
    }

    const propertyId = formData.get("propertyId") as string;
    if (!propertyId) {
      return { error: "ID properti tidak valid", success: false };
    }

    const [existing] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, propertyId))
      .limit(1);

    if (!existing) {
      return { error: "Properti tidak ditemukan", success: false };
    }

    if (session.user.role !== "admin" && existing.ownerId !== session.user.id) {
      return { error: "Dilarang", success: false };
    }

    const images = parseJsonArrayField(
      formData.get("images") as string | null,
      "images",
    );

    const packagesRaw = formData.get("packages") as string | null;
    let packages: PropertyPackages | undefined = undefined;
    if (packagesRaw) {
      try {
        packages = JSON.parse(packagesRaw) as PropertyPackages;
      } catch {
        throw new Error(
          "Field packages berisi JSON tidak valid. Pastikan client mengirim JSON.stringify(object)",
        );
      }
    }

    const amenities = parseJsonArrayField(
      formData.get("amenities") as string | null,
      "amenities",
    );

    const metadataRaw = formData.get("metadata");
    let metadata: Record<string, unknown> | undefined = undefined;
    if (metadataRaw) {
      try {
        metadata = JSON.parse(metadataRaw as string);
      } catch {
        metadata = undefined;
      }
    }

    const validated = updatePropertySchema.parse({
      title: formData.get("title") || undefined,
      description: formData.get("description") || undefined,
      address: formData.get("address") || undefined,
      province: formData.get("province") || undefined,
      city: formData.get("city") || undefined,
      type: formData.get("type") || undefined,
      basePrice: formData.get("basePrice") || undefined,
      packages,
      status: formData.get("status") || undefined,
      amenities,
      images,
      metadata,
      latitude: formData.get("latitude")
        ? Number(formData.get("latitude"))
        : undefined,
      longitude: formData.get("longitude")
        ? Number(formData.get("longitude"))
        : undefined,
    });

    const [updated] = await db
      .update(properties)
      .set({
        name: validated.title,
        description: validated.description,
        address: validated.address,
        province: validated.province,
        city: validated.city,
        type: validated.type as
          "kost" | "kontrakan" | "apartemen" | "rumah" | "ruko",
        basePrice: validated.basePrice,
        packages: validated.packages,
        status: validated.status ?? ("aktif" as "aktif" | "nonaktif"),
        amenities: validated.amenities,
        images: validated.images,
        metadata: validated.metadata,
        latitude:
          validated.latitude !== undefined
            ? String(validated.latitude)
            : undefined,
        longitude:
          validated.longitude !== undefined
            ? String(validated.longitude)
            : undefined,
        updatedAt: new Date(),
      })
      .where(eq(properties.id, propertyId))
      .returning();

    await invalidateCacheByTag("properties");

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: error.issues[0]?.message || "Input tidak valid",
        success: false,
      };
    }
    if (error instanceof Error) {
      return { error: error.message, success: false };
    }
    logError(error, "updatePropertyAction error");
    return { error: "Gagal memperbarui properti", success: false };
  }
}

export async function deletePropertyAction(
  _prevState: DeletePropertyState | undefined,
  formData: FormData,
): Promise<DeletePropertyState> {
  const csrfError = await validateActionCsrf(formData);
  if (csrfError) {
    return { error: csrfError, success: false };
  }

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { error: "Tidak terotorisasi", success: false };
    }

    const allowedRoles: Role[] = ["owner", "staff", "admin"];
    if (!allowedRoles.includes(session.user.role as Role)) {
      return { error: "Dilarang", success: false };
    }

    const propertyId = formData.get("propertyId") as string;
    if (!propertyId) {
      return { error: "ID properti tidak valid", success: false };
    }

    const [existing] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, propertyId))
      .limit(1);

    if (!existing) {
      return { error: "Properti tidak ditemukan", success: false };
    }

    if (session.user.role !== "admin" && existing.ownerId !== session.user.id) {
      return { error: "Dilarang", success: false };
    }

    await db.delete(properties).where(eq(properties.id, propertyId));

    await invalidateCacheByTag("properties");

    return { success: true };
  } catch (error) {
    logError(error, "deletePropertyAction error");
    return { error: "Gagal menghapus properti", success: false };
  }
}

const FEATURED_DURATION_DAYS = 30;

export async function featurePropertyAction(
  _prevState: FeaturePropertyState | undefined,
  formData: FormData,
): Promise<FeaturePropertyState> {
  const csrfError = await validateActionCsrf(formData);
  if (csrfError) {
    return { error: csrfError, success: false };
  }

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { error: "Tidak terotorisasi", success: false };
    }

    const allowedRoles: Role[] = ["owner", "admin", "staff"];
    if (!allowedRoles.includes(session.user.role as Role)) {
      return { error: "Dilarang", success: false };
    }

    const propertyId = formData.get("propertyId") as string;
    if (!propertyId) {
      return { error: "ID properti tidak valid", success: false };
    }

    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, propertyId))
      .limit(1);

    if (!property) {
      return { error: "Properti tidak ditemukan", success: false };
    }

    if (session.user.role !== "admin" && property.ownerId !== session.user.id) {
      return { error: "Dilarang", success: false };
    }

    const [existingPayment] = await db
      .select({
        id: payments.id,
        status: payments.status,
        paidAt: payments.paidAt,
      })
      .from(payments)
      .innerJoin(bookings, eq(payments.bookingId, bookings.id))
      .where(
        and(
          eq(bookings.propertyId, propertyId),
          eq(payments.purpose, "featured_listing"),
          eq(payments.status, "success"),
        ),
      )
      .orderBy(desc(payments.paidAt))
      .limit(1);

    if (!existingPayment) {
      return {
        error:
          "Pembayaran untuk featured listing tidak ditemukan. Silakan selesaikan pembayaran featured listing terlebih dahulu.",
        success: false,
      };
    }

    const featuredUntil = new Date();
    featuredUntil.setDate(featuredUntil.getDate() + FEATURED_DURATION_DAYS);

    const [updated] = await db
      .update(properties)
      .set({
        isFeatured: true,
        featuredUntil,
        updatedAt: new Date(),
      })
      .where(eq(properties.id, propertyId))
      .returning();

    await invalidateCacheByTag("properties");

    return { success: true, data: updated };
  } catch (error) {
    logError(error, "featurePropertyAction error");
    return { error: "Gagal mengaktifkan featured property", success: false };
  }
}

const approvePropertySchema = z.object({
  propertyId: z.string().uuid(),
  isActive: z.boolean(),
});

export async function approvePropertyAction(
  _prevState: ApprovePropertyState | undefined,
  formData: FormData,
): Promise<ApprovePropertyState> {
  const csrfError = await validateActionCsrf(formData);
  if (csrfError) {
    return { error: csrfError, success: false };
  }

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { error: "Tidak terotorisasi", success: false };
    }

    if (session.user.role !== "admin") {
      return {
        error: "Hanya admin yang dapat menyetujui properti",
        success: false,
      };
    }

    const propertyId = formData.get("propertyId") as string;
    const isActive = formData.get("isActive") === "true";

    if (!propertyId) {
      return { error: "ID properti tidak valid", success: false };
    }

    const validated = approvePropertySchema.parse({ propertyId, isActive });

    const [existing] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, validated.propertyId))
      .limit(1);

    if (!existing) {
      return { error: "Properti tidak ditemukan", success: false };
    }

    const [updated] = await db
      .update(properties)
      .set({
        isActive: validated.isActive,
        updatedAt: new Date(),
      })
      .where(eq(properties.id, validated.propertyId))
      .returning();

    if (validated.isActive) {
      await db.insert(notifications).values({
        id: crypto.randomUUID(),
        userId: existing.ownerId,
        title: "Properti Disetujui",
        message: `Properti "${existing.name}" telah disetujui dan kini aktif di platform.`,
        type: "system",
        isRead: false,
      });
    }

    await createAuditLog({
      action: validated.isActive ? "approve" : "reject",
      targetType: "property",
      targetId: validated.propertyId,
      adminId: session.user.id,
      details: {
        propertyName: existing.name,
        isActive: validated.isActive,
      },
    });

    await invalidateCacheByTag("properties");

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: error.issues[0]?.message || "Input tidak valid",
        success: false,
      };
    }
    logError(error, "approvePropertyAction error");
    return { error: "Gagal memproses approval properti", success: false };
  }
}

const checkoutFeaturedSchema = z.object({
  propertyId: z.string().uuid(),
  paymentProvider: z.enum(["doku", "ipaymu", "nicepay", "otto", "mock"]),
  voucherCode: z.string().optional(),
});

export async function checkoutFeaturedAction(
  _prevState: CheckoutFeaturedState | undefined,
  formData: FormData,
): Promise<CheckoutFeaturedState> {
  const csrfError = await validateActionCsrf(formData);
  if (csrfError) {
    return { error: csrfError, success: false };
  }

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { error: "Tidak terotorisasi", success: false };
    }

    const allowedRoles: Role[] = ["owner", "admin"];
    if (!allowedRoles.includes(session.user.role as Role)) {
      return { error: "Dilarang", success: false };
    }

    const propertyId = formData.get("propertyId") as string;
    const providerName = formData.get("paymentProvider") as string;

    if (!propertyId || !providerName) {
      return {
        error: "propertyId dan paymentProvider wajib diisi",
        success: false,
      };
    }

    const validated = checkoutFeaturedSchema.parse({
      propertyId,
      paymentProvider: providerName,
    });

    const adapter = getPaymentProvider(validated.paymentProvider);
    if (!adapter) {
      return { error: "Payment provider tidak valid", success: false };
    }

    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, validated.propertyId))
      .limit(1);

    if (!property) {
      return { error: "Properti tidak ditemukan", success: false };
    }

    if (session.user.role !== "admin" && property.ownerId !== session.user.id) {
      return { error: "Dilarang", success: false };
    }

    const [settings] = await db
      .select()
      .from(platformSettings)
      .where(eq(platformSettings.id, "default"))
      .limit(1);

    const amount = parseFloat(
      settings?.featuredListingPrice || String(DEFAULT_FEATURED_LISTING_PRICE),
    );
    if (amount <= 0) {
      return {
        error: "Harga featured listing belum dikonfigurasi",
        success: false,
      };
    }

    let finalAmount = amount;
    let appliedReferralId: string | undefined;
    if (validated.voucherCode) {
      const result = await validateAndApplyVoucher(
        validated.voucherCode,
        property.ownerId,
        amount,
      );
      if (!result.valid) {
        return { error: result.error, success: false };
      }
      finalAmount = result.finalAmount!;
      appliedReferralId = result.referralId;
    }

    const invoiceNumber = generateInvoiceNumber("FEATURED");

    const result = await db.transaction(async (tx) => {
      const [payment] = await tx
        .insert(payments)
        .values({
          bookingId: "00000000-0000-0000-0000-000000000000",
          propertyId: property.id,
          provider: validated.paymentProvider,
          purpose: "featured_listing",
          amount: money(finalAmount),
          currency: "IDR",
          status: "pending",
          transactionId: invoiceNumber,
          metadata: {
            propertyId: property.id,
            ownerId: property.ownerId,
            voucherCode: validated.voucherCode || null,
            originalAmount: amount,
          },
        } satisfies NewPayment)
        .returning();

      try {
        const adapterResult = await adapter.createPayment({
          bookingId: property.id,
          provider: validated.paymentProvider,
          purpose: "featured_listing",
          amount: finalAmount,
          currency: "IDR",
          metadata: {
            invoiceNumber,
            propertyId: property.id,
          },
        });

        await tx
          .update(payments)
          .set({
            transactionId: adapterResult.transactionId,
            rawResponse: adapterResult.rawResponse,
            updatedAt: new Date(),
          })
          .where(eq(payments.id, payment.id));

        if (appliedReferralId) {
          const redeemed = await redeemVoucherAtomically(tx, appliedReferralId);
          if (!redeemed) {
            throw new Error("Voucher sudah digunakan atau tidak valid");
          }
        }

        return { success: true, payment, adapterResult } as const;
      } catch (error) {
        await tx
          .update(payments)
          .set({ status: "failed", updatedAt: new Date() })
          .where(eq(payments.id, payment.id));
        throw error;
      }
    });

    if (!result.success) {
      return { error: "Gagal memproses pembayaran", success: false };
    }

    const { payment, adapterResult } = result;

    return {
      success: true,
      data: {
        paymentId: payment.id,
        invoiceNumber,
        redirectUrl: adapterResult.redirectUrl,
        qrCode: adapterResult.qrCode,
        vaNumber: adapterResult.vaNumber,
        expiresAt: adapterResult.expiresAt,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: error.issues[0]?.message || "Input tidak valid",
        success: false,
      };
    }
    logError(error, "checkoutFeaturedAction error");
    return {
      error: "Gagal membuat pembayaran featured listing",
      success: false,
    };
  }
}
