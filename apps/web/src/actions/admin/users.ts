"use server";

import { db } from "@/db";
import { users, accounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { hashPassword } from "better-auth/crypto";
import { createAuditLog } from "@/lib/audit-log";
import { logError } from "@/lib/logger";
import { validateActionCsrf } from "@/lib/api-auth";
import type { UpdateUserState, DeleteUserState, BanUserState, CreateUserState } from "@/types/action";

const updateUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  role: z.enum(["cust", "owner", "admin", "staff"]).optional(),
  isActive: z.boolean().optional(),
  isBanned: z.boolean().optional(),
  image: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  whatsapp: z.string().nullable().optional(),
  telegram: z.string().nullable().optional(),
  district: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  province: z.string().nullable().optional(),
});


export async function updateUserAction(
  _prevState: UpdateUserState | undefined,
  formData: FormData,
): Promise<UpdateUserState> {
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

    if (!["admin", "staff"].includes(session.user.role)) {
      return { error: "Dilarang", success: false };
    }

    const validated = updateUserSchema.parse({
      id: formData.get("id"),
      name: formData.get("name") || undefined,
      email: formData.get("email") || undefined,
      role: formData.get("role") || undefined,
      isActive: formData.get("isActive")
        ? formData.get("isActive") === "true"
        : undefined,
      isBanned: formData.get("isBanned")
        ? formData.get("isBanned") === "true"
        : undefined,
      image: formData.get("image") || undefined,
      phone: formData.get("phone") || undefined,
      whatsapp: formData.get("whatsapp") || undefined,
      telegram: formData.get("telegram") || undefined,
      district: formData.get("district") || undefined,
      city: formData.get("city") || undefined,
      province: formData.get("province") || undefined,
    });

    const userId = validated.id;

    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!existing) {
      return { error: "User tidak ditemukan", success: false };
    }

    if (
      existing.id === session.user.id &&
      validated.role &&
      validated.role !== existing.role
    ) {
      return { error: "Anda tidak bisa mengubah role sendiri", success: false };
    }

    const allowedFields = [
      "name",
      "email",
      "phone",
      "whatsapp",
      "telegram",
      "isActive",
      "isBanned",
      "image",
      "district",
      "city",
      "province",
    ] as const;

    const updateData: Record<string, unknown> = {};

    for (const key of allowedFields) {
      const value = validated[key as keyof typeof validated];
      if (value !== undefined) {
        updateData[key] = value;
      }
    }

    if (session.user.role !== "admin") {
      if (
        validated.role !== undefined ||
        validated.isActive !== undefined ||
        validated.isBanned !== undefined
      ) {
        return {
          error:
            "Hanya admin yang bisa mengubah role, status aktif, atau status ban",
          success: false,
        };
      }

      if (existing.role === "admin") {
        return { error: "Tidak bisa memodifikasi user admin", success: false };
      }
    }

    if (
      validated.role &&
      !["cust", "owner", "admin", "staff"].includes(validated.role)
    ) {
      return { error: "Role tidak valid", success: false };
    }

    if (validated.role) {
      updateData.role = validated.role;
    }
    if (validated.isActive !== undefined) {
      updateData.isActive = validated.isActive;
    }
    if (validated.isBanned !== undefined) {
      updateData.isBanned = validated.isBanned;
    }

    await db
      .update(users)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    if (
      validated.role ||
      validated.isActive !== undefined ||
      validated.isBanned !== undefined
    ) {
      await createAuditLog({
        action: validated.role ? "approve" : "update",
        targetType: "user",
        targetId: userId,
        adminId: session.user.id,
        details: {
          changes: updateData,
          targetUserId: userId,
        },
      });
    }

    return { success: true, message: "User berhasil diperbarui" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: error.issues[0]?.message || "Input tidak valid",
        success: false,
      };
    }
    return { error: "Gagal memperbarui user", success: false };
  }
}

const deleteUserSchema = z.object({
  id: z.string().uuid(),
});


export async function deleteUserAction(
  _prevState: DeleteUserState | undefined,
  formData: FormData,
): Promise<DeleteUserState> {
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
      return { error: "Dilarang - hanya admin", success: false };
    }

    const validated = deleteUserSchema.parse({
      id: formData.get("id"),
    });

    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.id, validated.id))
      .limit(1);

    if (!existing) {
      return { error: "User tidak ditemukan", success: false };
    }

    if (existing.id === session.user.id) {
      return {
        error: "Anda tidak bisa menghapus akun sendiri",
        success: false,
      };
    }

    await db.delete(users).where(eq(users.id, validated.id));

    await createAuditLog({
      action: "delete",
      targetType: "user",
      targetId: validated.id,
      adminId: session.user.id,
      details: {
        deletedUserEmail: existing.email,
        deletedUserRole: existing.role,
      },
    });

    return { success: true, message: "User berhasil dihapus" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: error.issues[0]?.message || "Input tidak valid",
        success: false,
      };
    }
    return { error: "Gagal menghapus user", success: false };
  }
}

const banUserSchema = z.object({
  id: z.string().uuid(),
  isBanned: z.boolean(),
  banReason: z.string().optional(),
});


export async function banUserAction(
  _prevState: BanUserState | undefined,
  formData: FormData,
): Promise<BanUserState> {
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
      return { error: "Dilarang - hanya admin", success: false };
    }

    const validated = banUserSchema.parse({
      id: formData.get("id"),
      isBanned: formData.get("isBanned") === "true",
      banReason: formData.get("banReason") || undefined,
    });

    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.id, validated.id))
      .limit(1);

    if (!existing) {
      return { error: "User tidak ditemukan", success: false };
    }

    if (existing.id === session.user.id) {
      return {
        error: "Anda tidak bisa memblokir akun sendiri",
        success: false,
      };
    }

    await db
      .update(users)
      .set({
        isBanned: validated.isBanned,
        banReason: validated.isBanned ? (validated.banReason ?? null) : null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, validated.id));

    await createAuditLog({
      action: validated.isBanned ? "reject" : "approve",
      targetType: "user",
      targetId: validated.id,
      adminId: session.user.id,
      details: {
        userId: validated.id,
        userEmail: existing.email,
        isBanned: validated.isBanned,
        banReason: validated.banReason ?? null,
      },
    });

    return {
      success: true,
      message: `User berhasil ${validated.isBanned ? "diblokir" : "dibuka blokirnya"}`,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: error.issues[0]?.message || "Input tidak valid",
        success: false,
      };
    }
    return { error: "Gagal mengubah status blokir user", success: false };
  }
}

const createUserSchema = z.object({
  name: z.string().min(1, "Nama harus diisi").max(255),
  email: z.string().email("Format email tidak valid"),
  role: z.enum(["cust", "owner", "admin", "staff"]).default("cust"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  phone: z.string().optional(),
  image: z.string().url().optional().or(z.literal("")),
  whatsapp: z.string().optional(),
  telegram: z.string().optional(),
  province: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  isActive: z.boolean().default(true),
});


export async function createUserAction(
  _prevState: CreateUserState | undefined,
  formData: FormData,
): Promise<CreateUserState> {
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

    if (!["admin", "staff"].includes(session.user.role)) {
      return { error: "Dilarang", success: false };
    }

    const validated = createUserSchema.parse({
      name: formData.get("name"),
      email: formData.get("email"),
      role: formData.get("role") || "cust",
      password: formData.get("password"),
      phone: formData.get("phone") || undefined,
      image: formData.get("image") || undefined,
      whatsapp: formData.get("whatsapp") || undefined,
      telegram: formData.get("telegram") || undefined,
      province: formData.get("province") || undefined,
      city: formData.get("city") || undefined,
      district: formData.get("district") || undefined,
      isActive: formData.get("isActive") === "true",
    });

    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, validated.email))
      .limit(1);

    if (existing) {
      return { error: "Email sudah digunakan", success: false };
    }

    const [newUser] = await db
      .insert(users)
      .values({
        name: validated.name,
        email: validated.email,
        role: validated.role,
        image: validated.image || null,
        phone: validated.phone || null,
        whatsapp: validated.whatsapp || null,
        telegram: validated.telegram || null,
        province: validated.province || null,
        city: validated.city || null,
        district: validated.district || null,
        isActive: validated.isActive,
      })
      .returning();

    const hashedPassword = await hashPassword(validated.password);

    await db.insert(accounts).values({
      id: crypto.randomUUID(),
      userId: newUser.id,
      accountId: validated.email,
      providerId: "email",
      password: hashedPassword,
    });

    await createAuditLog({
      action: "create",
      targetType: "user",
      targetId: newUser.id,
      adminId: session.user.id,
      details: {
        email: newUser.email,
        role: newUser.role,
        isActive: newUser.isActive,
      },
    });

    return { success: true, message: "User berhasil dibuat", data: newUser };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: error.issues[0]?.message || "Input tidak valid",
        success: false,
      };
    }
    logError(error, "createUserAction error");
    return { error: "Gagal membuat user", success: false };
  }
}
