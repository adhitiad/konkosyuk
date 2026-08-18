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
import { createPropertySchema, updatePropertySchema } from "@/lib/zod";
import { invalidateCacheByTag } from "@/lib/cache";
import type { Role } from "@/lib/auth";
import { money, generateInvoiceNumber } from "@/lib/utils";
import { getPaymentProvider } from "@/lib/payments";
import { createAuditLog } from "@/lib/audit-log";
import type { PropertyPackages } from "@/lib/types/property-packages";
import type { NewProperty, NewPayment } from "@/db/schema";

export type CreatePropertyState = {
  success?: boolean;
  error?: string;
  data?: {
    id: string;
    name: string;
    ownerId: string;
    createdAt: Date;
  };
};

export async function createPropertyAction(
  prevState: CreatePropertyState | undefined,
  formData: FormData,
): Promise<CreatePropertyState> {
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

    const imagesRaw = formData.get("images");
    let images: string[] = [];
    if (imagesRaw) {
      try {
        images = JSON.parse(imagesRaw as string);
      } catch {
        images = [];
      }
    }

    const packagesRaw = formData.get("packages");
    let packages = undefined;
    if (packagesRaw) {
      try {
        packages = JSON.parse(packagesRaw as string);
      } catch {
        packages = undefined;
      }
    }

    const amenitiesRaw = formData.get("amenities");
    let amenities: string[] = [];
    if (amenitiesRaw) {
      try {
        amenities = JSON.parse(amenitiesRaw as string);
      } catch {
        amenities = [];
      }
    }

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
        name: validated.title,
        description: validated.description,
        address: validated.address ?? "",
        province: validated.province,
        city: validated.city,
        type: validated.type,
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
        status: validated.status,
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
    return { error: "Gagal menambahkan properti", success: false };
  }
}

export type UpdatePropertyState = {
  success?: boolean;
  error?: string;
  data?: typeof properties.$inferSelect;
};

export async function updatePropertyAction(
  prevState: UpdatePropertyState | undefined,
  formData: FormData,
): Promise<UpdatePropertyState> {
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

    const imagesRaw = formData.get("images");
    let images: string[] | undefined = undefined;
    if (imagesRaw) {
      try {
        images = JSON.parse(imagesRaw as string);
      } catch {
        images = undefined;
      }
    }

    const packagesRaw = formData.get("packages");
    let packages: PropertyPackages | undefined = undefined;
    if (packagesRaw) {
      try {
        packages = JSON.parse(packagesRaw as string);
      } catch {
        packages = undefined;
      }
    }

    const amenitiesRaw = formData.get("amenities");
    let amenities: string[] | undefined = undefined;
    if (amenitiesRaw) {
      try {
        amenities = JSON.parse(amenitiesRaw as string);
      } catch {
        amenities = undefined;
      }
    }

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
        type: validated.type,
        basePrice: validated.basePrice,
        packages: validated.packages,
        status: validated.status,
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
    console.error("updatePropertyAction error:", error);
    return { error: "Gagal memperbarui properti", success: false };
  }
}

export type DeletePropertyState = {
  success?: boolean;
  error?: string;
};

export async function deletePropertyAction(
  prevState: DeletePropertyState | undefined,
  formData: FormData,
): Promise<DeletePropertyState> {
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
    console.error("deletePropertyAction error:", error);
    return { error: "Gagal menghapus properti", success: false };
  }
}

export type FeaturePropertyState = {
  success?: boolean;
  error?: string;
  data?: typeof properties.$inferSelect;
};

const FEATURED_DURATION_DAYS = 30;

export async function featurePropertyAction(
  prevState: FeaturePropertyState | undefined,
  formData: FormData,
): Promise<FeaturePropertyState> {
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
    console.error("featurePropertyAction error:", error);
    return { error: "Gagal mengaktifkan featured property", success: false };
  }
}

export type ApprovePropertyState = {
  success?: boolean;
  error?: string;
  data?: typeof properties.$inferSelect;
};

const approvePropertySchema = z.object({
  propertyId: z.string().uuid(),
  isActive: z.boolean(),
});

export async function approvePropertyAction(
  prevState: ApprovePropertyState | undefined,
  formData: FormData,
): Promise<ApprovePropertyState> {
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
    console.error("approvePropertyAction error:", error);
    return { error: "Gagal memproses approval properti", success: false };
  }
}

export type CheckoutFeaturedState = {
  success?: boolean;
  error?: string;
  data?: {
    paymentId: string;
    invoiceNumber: string;
    redirectUrl?: string;
    qrCode?: string;
    vaNumber?: string;
    expiresAt?: Date;
  };
};

const checkoutFeaturedSchema = z.object({
  propertyId: z.string().uuid(),
  paymentProvider: z.enum(["doku", "ipaymu", "nicepay", "mock"]),
});

export async function checkoutFeaturedAction(
  prevState: CheckoutFeaturedState | undefined,
  formData: FormData,
): Promise<CheckoutFeaturedState> {
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

    const amount = parseFloat(settings?.featuredListingPrice || "50000");
    if (amount <= 0) {
      return {
        error: "Harga featured listing belum dikonfigurasi",
        success: false,
      };
    }

    const invoiceNumber = generateInvoiceNumber("FEATURED");

    const [payment] = await db
      .insert(payments)
      .values({
        bookingId: "00000000-0000-0000-0000-000000000000",
        propertyId: property.id,
        provider: validated.paymentProvider,
        purpose: "featured_listing",
        amount: money(amount),
        currency: "IDR",
        status: "pending",
        transactionId: invoiceNumber,
        metadata: {
          propertyId: property.id,
          ownerId: property.ownerId,
        },
      } satisfies NewPayment)
      .returning();

    try {
      const result = await adapter.createPayment({
        bookingId: property.id,
        provider: validated.paymentProvider,
        purpose: "featured_listing",
        amount,
        currency: "IDR",
        metadata: {
          invoiceNumber,
          propertyId: property.id,
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
      return {
        error: error.issues[0]?.message || "Input tidak valid",
        success: false,
      };
    }
    console.error("checkoutFeaturedAction error:", error);
    return {
      error: "Gagal membuat pembayaran featured listing",
      success: false,
    };
  }
}
