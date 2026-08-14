"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import type { Role } from "@/lib/auth";

const updateProfileSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter").max(255),
  phone: z.string().min(1, "Nomor telepon wajib diisi").max(20),
});

export type UpdateProfileState = {
  success?: boolean;
  error?: string;
  data?: typeof users.$inferSelect;
};

export async function updateProfileAction(
  prevState: UpdateProfileState | undefined,
  formData: FormData,
): Promise<UpdateProfileState> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { error: "Tidak terotorisasi", success: false };
    }

    const validated = updateProfileSchema.parse({
      name: formData.get("name"),
      phone: formData.get("phone"),
    });

    const [updated] = await db
      .update(users)
      .set({
        name: validated.name,
        phone: validated.phone,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id))
      .returning();

    return {
      success: true,
      data: updated,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message || "Input tidak valid", success: false };
    }
    console.error("updateProfileAction error:", error);
    return { error: "Gagal memperbarui profil", success: false };
  }
}

const updateUserProfileSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter").max(255),
  phone: z.string().min(1, "Nomor telepon wajib diisi").max(20),
  image: z.string().url("URL gambar tidak valid").optional().nullable(),
  province: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
});

export type UpdateUserProfileState = {
  success?: boolean;
  error?: string;
  data?: typeof users.$inferSelect;
};

export async function updateUserProfileAction(
  prevState: UpdateUserProfileState | undefined,
  formData: FormData,
): Promise<UpdateUserProfileState> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { error: "Tidak terotorisasi", success: false };
    }

    const validated = updateUserProfileSchema.parse({
      name: formData.get("name"),
      phone: formData.get("phone"),
      image: formData.get("image") || null,
      province: formData.get("province") || null,
      city: formData.get("city") || null,
      district: formData.get("district") || null,
    });

    const [updated] = await db
      .update(users)
      .set({
        name: validated.name,
        phone: validated.phone,
        image: validated.image ?? null,
        province: validated.province ?? null,
        city: validated.city ?? null,
        district: validated.district ?? null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id))
      .returning();

    return {
      success: true,
      data: updated,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message || "Input tidak valid", success: false };
    }
    console.error("updateUserProfileAction error:", error);
    return { error: "Gagal memperbarui profil", success: false };
  }
}