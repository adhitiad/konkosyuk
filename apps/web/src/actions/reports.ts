"use server";

import { and, eq, inArray, lte, gte } from "drizzle-orm";
import { db } from "@/db";
import {
  bookings,
  maintenanceReports,
  notifications,
  properties,
  units,
  users,
  maintenanceReportCategory,
  maintenanceReportStatus,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import {
  sendMaintenanceReportCreatedEmail,
  sendMaintenanceReportUpdatedEmail,
  sendMaintenanceWhatsApp,
} from "@/lib/notification-client";
import { validateActionCsrf } from "@/lib/api-auth";
import { MAX_DESCRIPTION_LENGTH } from "@/lib/constants/actions";

const createReportSchema = z.object({
  propertyId: z.string().uuid(),
  unitId: z.string().uuid().nullable().optional(),
  category: z.enum(maintenanceReportCategory),
  description: z.string().trim().min(10).max(MAX_DESCRIPTION_LENGTH),
  images: z.array(z.string().url()).max(5).default([]),
});

export type CreateReportState = {
  success?: boolean;
  error?: string;
  data?: typeof maintenanceReports.$inferSelect;
};

export async function createReportAction(
  prevState: CreateReportState | undefined,
  formData: FormData,
): Promise<CreateReportState> {
  const csrfError = await validateActionCsrf(formData);
  if (csrfError) {
    return { error: csrfError, success: false };
  }

  try {
    const imagesRaw = formData.get("images");
    let images: string[] = [];
    if (imagesRaw) {
      try {
        images = JSON.parse(imagesRaw as string);
      } catch {
        images = [];
      }
    }

    const validated = createReportSchema.parse({
      propertyId: formData.get("propertyId"),
      unitId: formData.get("unitId") || null,
      category: formData.get("category"),
      description: formData.get("description"),
      images,
    });

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { error: "Tidak terotorisasi", success: false };
    }

    const now = new Date();

    const [property] = await db
      .select({
        id: properties.id,
        ownerId: properties.ownerId,
        name: properties.name,
      })
      .from(properties)
      .where(eq(properties.id, validated.propertyId))
      .limit(1);

    if (!property) {
      return { error: "Properti tidak ditemukan", success: false };
    }

    const [booking] = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(
        and(
          eq(bookings.userId, session.user.id),
          eq(bookings.propertyId, validated.propertyId),
          inArray(bookings.status, ["confirmed", "completed"]),
          lte(bookings.startDate, now),
          gte(bookings.endDate, now),
        ),
      )
      .limit(1);

    if (!booking) {
      return {
        error: "Anda tidak sedang menyewa properti ini",
        success: false,
      };
    }

    if (validated.unitId) {
      const [unit] = await db
        .select({ id: units.id })
        .from(units)
        .where(
          and(
            eq(units.id, validated.unitId),
            eq(units.propertyId, validated.propertyId),
          ),
        )
        .limit(1);

      if (!unit) {
        return { error: "Unit tidak valid untuk properti ini", success: false };
      }
    }

    const [report] = await db
      .insert(maintenanceReports)
      .values({
        tenantId: session.user.id,
        propertyId: validated.propertyId,
        unitId: validated.unitId ?? null,
        category: validated.category,
        description: validated.description,
        images: validated.images,
      })
      .returning();

    const [owner] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        whatsapp: users.whatsapp,
      })
      .from(users)
      .where(eq(users.id, property.ownerId))
      .limit(1);

    const admins = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        whatsapp: users.whatsapp,
      })
      .from(users)
      .where(eq(users.role, "admin"));

    await db.insert(notifications).values([
      {
        userId: property.ownerId,
        title: "Laporan Masalah Baru",
        message: `Ada laporan "${validated.category}" di properti ${property.name}. Mohon ditindaklanjuti.`,
        type: "report",
        referenceId: report.id,
      },
      ...admins.map((admin) => ({
        userId: admin.id,
        title: "Laporan Masalah Perlu Dipantau",
        message: `Tenant mengirim laporan "${validated.category}" di properti ${property.name}. Buka laporan untuk memantau tindak lanjut owner.`,
        type: "report" as const,
        referenceId: report.id,
      })),
    ]);

    const recipients = [owner, ...admins].filter(
      (recipient): recipient is NonNullable<typeof recipient> =>
        Boolean(recipient),
    );

    await Promise.allSettled(
      recipients.flatMap((recipient) => [
        recipient.email
          ? sendMaintenanceReportCreatedEmail(
              recipient.id,
              recipient.email,
              recipient.name,
              property.name,
              validated.category,
              validated.description,
            )
          : Promise.resolve(),
        recipient.phone || recipient.whatsapp
          ? sendMaintenanceWhatsApp(
              recipient.id,
              recipient.phone || recipient.whatsapp || "",
              process.env.META_MAINTENANCE_CREATED_TEMPLATE ||
                "maintenance_report_created",
              [
                recipient.name,
                property.name,
                validated.category,
                validated.description,
              ],
            )
          : Promise.resolve(),
      ]),
    );

    return { success: true, data: report };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: error.issues[0]?.message || "Input tidak valid",
        success: false,
      };
    }
    return { error: "Gagal membuat laporan", success: false };
  }
}

const updateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(maintenanceReportStatus),
  resolutionNote: z
    .string()
    .trim()
    .max(MAX_DESCRIPTION_LENGTH)
    .nullable()
    .optional(),
});

export type UpdateReportState = {
  success?: boolean;
  error?: string;
  data?: typeof maintenanceReports.$inferSelect;
};

export async function updateReportAction(
  prevState: UpdateReportState | undefined,
  formData: FormData,
): Promise<UpdateReportState> {
  const csrfError = await validateActionCsrf(formData);
  if (csrfError) {
    return { error: csrfError, success: false };
  }

  try {
    const validated = updateSchema.parse({
      id: formData.get("id"),
      status: formData.get("status"),
      resolutionNote: formData.get("resolutionNote") || null,
    });

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { error: "Tidak terotorisasi", success: false };
    }

    const [report] = await db
      .select({
        id: maintenanceReports.id,
        tenantId: maintenanceReports.tenantId,
        propertyOwnerId: properties.ownerId,
        tenantName: users.name,
        tenantEmail: users.email,
        tenantPhone: users.phone,
        tenantWhatsapp: users.whatsapp,
      })
      .from(maintenanceReports)
      .innerJoin(properties, eq(maintenanceReports.propertyId, properties.id))
      .innerJoin(users, eq(maintenanceReports.tenantId, users.id))
      .where(eq(maintenanceReports.id, validated.id))
      .limit(1);

    if (!report) {
      return { error: "Laporan tidak ditemukan", success: false };
    }

    if (
      session.user.role === "owner" &&
      report.propertyOwnerId !== session.user.id
    ) {
      return { error: "Dilarang", success: false };
    }

    const [updated] = await db
      .update(maintenanceReports)
      .set({
        status: validated.status,
        resolutionNote: validated.resolutionNote ?? null,
        updatedAt: new Date(),
      })
      .where(eq(maintenanceReports.id, validated.id))
      .returning();

    await db.insert(notifications).values({
      userId: report.tenantId,
      title: "Status Laporan Diperbarui",
      message: `Status laporan Anda sekarang: ${validated.status}.`,
      type: "report",
      referenceId: validated.id,
    });

    await Promise.allSettled([
      report.tenantEmail
        ? sendMaintenanceReportUpdatedEmail(
            report.tenantId,
            report.tenantEmail,
            report.tenantName,
            validated.status,
            validated.resolutionNote,
          )
        : Promise.resolve(),
      report.tenantPhone || report.tenantWhatsapp
        ? sendMaintenanceWhatsApp(
            report.tenantId,
            report.tenantPhone || report.tenantWhatsapp || "",
            process.env.META_MAINTENANCE_UPDATED_TEMPLATE ||
              "maintenance_report_updated",
            [
              report.tenantName,
              validated.status,
              validated.resolutionNote || "-",
            ],
          )
        : Promise.resolve(),
    ]);

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: error.issues[0]?.message || "Input tidak valid",
        success: false,
      };
    }
    return { error: "Gagal memperbarui laporan", success: false };
  }
}
