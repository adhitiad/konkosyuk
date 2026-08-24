"use server";

import { db } from "@/db";
import { units, properties } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { createUnitSchema, updateUnitSchema } from "@konkosyuk/shared";
import { invalidateCacheByTag } from "@/lib/cache";
import type { Role } from "@/lib/auth";
import { validateActionCsrf } from "@/lib/api-auth";

export type CreateUnitState = {
  success?: boolean;
  error?: string;
  data?: {
    id: string;
    propertyId: string;
    name: string;
    description: string | null;
    price: string;
    capacity: string | null;
    size: string | null;
    status: string;
    createdAt: Date;
  };
};

export async function createUnitAction(
  prevState: CreateUnitState | undefined,
  formData: FormData,
): Promise<CreateUnitState> {
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

    if (!["owner", "staff", "admin"].includes(session.user.role as Role)) {
      return { error: "Dilarang", success: false };
    }

    const validated = createUnitSchema.parse({
      propertyId: formData.get("propertyId"),
      name: formData.get("name"),
      description: formData.get("description") || undefined,
      price: formData.get("price"),
      capacity: formData.get("capacity") || undefined,
      size: formData.get("size") || undefined,
      status: formData.get("status") || "available",
    });

    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, validated.propertyId))
      .limit(1);

    if (!property) {
      return { error: "Properti tidak ditemukan", success: false };
    }

    if (session.user.role === "owner" && property.ownerId !== session.user.id) {
      return { error: "Dilarang", success: false };
    }

    const [existing] = await db
      .select()
      .from(units)
      .where(
        and(
          eq(units.propertyId, validated.propertyId),
          eq(units.name, validated.name),
        ),
      )
      .limit(1);

    if (existing) {
      return { error: "Nama unit sudah ada di properti ini", success: false };
    }

    const [unit] = await db.insert(units).values(validated).returning();

    await invalidateCacheByTag("units");

    return { success: true, data: unit };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: error.issues[0]?.message || "Input tidak valid",
        success: false,
      };
    }
    return { error: "Gagal menambahkan unit", success: false };
  }
}

export type UpdateUnitState = {
  success?: boolean;
  error?: string;
  data?: {
    id: string;
    propertyId: string;
    name: string;
    description: string | null;
    price: string;
    capacity: string | null;
    size: string | null;
    status: string;
    updatedAt: Date;
  };
};

export async function updateUnitAction(
  prevState: UpdateUnitState | undefined,
  formData: FormData,
): Promise<UpdateUnitState> {
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

    if (!["owner", "staff", "admin"].includes(session.user.role as Role)) {
      return { error: "Dilarang", success: false };
    }

    const id = formData.get("id") as string;
    if (!id) {
      return { error: "ID unit diperlukan", success: false };
    }

    const [unit] = await db
      .select()
      .from(units)
      .where(eq(units.id, id))
      .limit(1);

    if (!unit) {
      return { error: "Unit tidak ditemukan", success: false };
    }

    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, unit.propertyId))
      .limit(1);

    if (!property) {
      return { error: "Properti tidak ditemukan", success: false };
    }

    if (session.user.role !== "admin" && property.ownerId !== session.user.id) {
      return { error: "Dilarang", success: false };
    }

    const validated = updateUnitSchema.parse({
      name: formData.get("name") || undefined,
      description: formData.get("description") || undefined,
      price: formData.get("price") || undefined,
      capacity: formData.get("capacity") || undefined,
      size: formData.get("size") || undefined,
      status: formData.get("status") || undefined,
    });

    const updateData = {
      ...validated,
      updatedAt: new Date(),
    };

    const [updated] = await db
      .update(units)
      .set(updateData)
      .where(eq(units.id, id))
      .returning();

    await invalidateCacheByTag("units");

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: error.issues[0]?.message || "Input tidak valid",
        success: false,
      };
    }
    return { error: "Gagal memperbarui unit", success: false };
  }
}

export type DeleteUnitState = {
  success?: boolean;
  error?: string;
};

export async function deleteUnitAction(
  prevState: DeleteUnitState | undefined,
  formData: FormData,
): Promise<DeleteUnitState> {
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

    if (!["owner", "staff", "admin"].includes(session.user.role as Role)) {
      return { error: "Dilarang", success: false };
    }

    const id = formData.get("id") as string;
    if (!id) {
      return { error: "ID unit diperlukan", success: false };
    }

    const [unit] = await db
      .select()
      .from(units)
      .where(eq(units.id, id))
      .limit(1);

    if (!unit) {
      return { error: "Unit tidak ditemukan", success: false };
    }

    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, unit.propertyId))
      .limit(1);

    if (!property) {
      return { error: "Properti tidak ditemukan", success: false };
    }

    if (session.user.role !== "admin" && property.ownerId !== session.user.id) {
      return { error: "Dilarang", success: false };
    }

    await db.delete(units).where(eq(units.id, id));

    await invalidateCacheByTag("units");

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: error.issues[0]?.message || "Input tidak valid",
        success: false,
      };
    }
    return { error: "Gagal menghapus unit", success: false };
  }
}
