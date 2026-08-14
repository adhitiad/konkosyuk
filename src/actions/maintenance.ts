"use server";

import { db } from "@/db";
import { maintenanceTickets, units, bookings } from "@/db/schema";
import { eq, and, lte, gte } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";

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
        error: "Anda hanya dapat membuat tiket maintenance untuk unit yang sedang Anda sewa",
        success: false,
      };
    }

    const [ticket] = await db
      .insert(maintenanceTickets)
      .values({
        unitId: validated.unitId,
        tenantId: session.user.id,
        title: validated.title,
        description: validated.description,
        priority: validated.priority,
        images: validated.images ?? [],
      })
      .returning();

    return { success: true, data: ticket };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message || "Input tidak valid", success: false };
    }
    return { error: "Gagal membuat tiket maintenance", success: false };
  }
}