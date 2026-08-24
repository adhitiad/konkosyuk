"use server";

import { db } from "@/db";
import { maintenanceTickets, units, properties, bookings } from "@/db/schema";
import { eq, and, lte, gte } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { logError } from "@/lib/logger";
import { validateActionCsrf } from "@/lib/api-auth";
import { sanitizeString } from "@/lib/sanitize";

const createTicketSchema = z.object({
  unitId: z.string().uuid(),
  title: z.string().min(1, "Judul harus diisi").max(100),
  description: z.string().min(1, "Deskripsi harus diisi").max(2000),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  images: z.array(z.string().url("URL gambar tidak valid")).optional(),
});

export type CreateMaintenanceTicketState = {
  success?: boolean;
  error?: string;
  data?: unknown;
};

export async function createMaintenanceTicketAction(
  prevState: CreateMaintenanceTicketState | undefined,
  formData: FormData,
): Promise<CreateMaintenanceTicketState> {
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

    const validated = createTicketSchema.parse({
      unitId: formData.get("unitId"),
      title: formData.get("title"),
      description: formData.get("description"),
      priority: formData.get("priority") || "medium",
      images,
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

    const [activeBooking] = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.unitId, validated.unitId),
          eq(bookings.userId, session.user.id),
          eq(bookings.status, "confirmed"),
          lte(bookings.startDate, new Date()),
          gte(bookings.endDate, new Date()),
        ),
      )
      .limit(1);

    if (!activeBooking) {
      return {
        error:
          "Anda hanya dapat membuat tiket maintenance untuk unit yang sedang Anda sewa",
        success: false,
      };
    }

    const [ticket] = await db
      .insert(maintenanceTickets)
      .values({
        unitId: validated.unitId,
        tenantId: session.user.id,
        title: sanitizeString(validated.title) || validated.title,
        description: sanitizeString(validated.description) || validated.description,
        priority: validated.priority,
        images: validated.images ?? [],
      })
      .returning();

    return { success: true, data: ticket };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: error.issues[0]?.message || "Input tidak valid",
        success: false,
      };
    }
    return { error: "Gagal membuat tiket maintenance", success: false };
  }
}

const updateTicketSchema = z.object({
  status: z
    .enum(["reported", "in_progress", "resolved", "cancelled"])
    .optional(),
  ownerNotes: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
});

export type UpdateMaintenanceTicketState = {
  success?: boolean;
  error?: string;
  data?: unknown;
};

export async function updateMaintenanceTicketAction(
  prevState: UpdateMaintenanceTicketState | undefined,
  formData: FormData,
): Promise<UpdateMaintenanceTicketState> {
  const csrfError = await validateActionCsrf(formData);
  if (csrfError) {
    return { error: csrfError, success: false };
  }

  try {
    const ticketId = formData.get("id") as string;
    if (!ticketId) {
      return { error: "ID tiket tidak valid", success: false };
    }

    const validated = updateTicketSchema.parse({
      status: formData.get("status") || undefined,
      ownerNotes: formData.get("ownerNotes") || undefined,
      priority: formData.get("priority") || undefined,
    });

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { error: "Tidak terotorisasi", success: false };
    }

    const [ticket] = await db
      .select()
      .from(maintenanceTickets)
      .where(eq(maintenanceTickets.id, ticketId))
      .limit(1);

    if (!ticket) {
      return { error: "Tiket tidak ditemukan", success: false };
    }

    if (session.user.role === "owner") {
      const [unit] = await db
        .select()
        .from(units)
        .where(eq(units.id, ticket.unitId))
        .limit(1);

      if (!unit) {
        return { error: "Unit tidak ditemukan", success: false };
      }

      const [property] = await db
        .select()
        .from(properties)
        .where(eq(properties.id, unit.propertyId))
        .limit(1);

      if (!property || property.ownerId !== session.user.id) {
        return { error: "Dilarang", success: false };
      }
    }

    const updateData: Record<string, unknown> = {};
    if (validated.status) updateData.status = validated.status;
    if (validated.ownerNotes !== undefined)
      updateData.ownerNotes = validated.ownerNotes;
    if (validated.priority) updateData.priority = validated.priority;

    const [updated] = await db
      .update(maintenanceTickets)
      .set(updateData)
      .where(eq(maintenanceTickets.id, ticketId))
      .returning();

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: error.issues[0]?.message || "Input tidak valid",
        success: false,
      };
    }
    logError(error, "updateMaintenanceTicketAction error");
    return { error: "Gagal memperbarui tiket maintenance", success: false };
  }
}
