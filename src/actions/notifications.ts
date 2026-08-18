"use server";

import { db } from "@/db";
import { notifications } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { invalidateCacheByTag } from "@/lib/cache";
import { createAuditLog } from "@/lib/audit-log";
import type { Role } from "@/lib/auth";

const updateNotificationSchema = z.object({
  notificationId: z.string().uuid(),
});

export type UpdateNotificationState = {
  success?: boolean;
  error?: string;
  data?: { success: boolean };
};

export async function updateNotificationAction(
  _prevState: UpdateNotificationState | undefined,
  formData: FormData,
): Promise<UpdateNotificationState> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { error: "Tidak terotorisasi", success: false };
    }

    const validated = updateNotificationSchema.parse({
      notificationId: formData.get("notificationId"),
    });

    await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.id, validated.notificationId),
          eq(notifications.userId, session.user.id),
        ),
      );

    await invalidateCacheByTag("notifications");

    return { success: true, data: { success: true } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: error.issues[0]?.message || "Input tidak valid",
        success: false,
      };
    }
    return { error: "Gagal memperbarui notifikasi", success: false };
  }
}

const adminUpdateNotificationSchema = z.object({
  notificationId: z.string().uuid(),
  isRead: z.boolean(),
});

export type AdminUpdateNotificationState = {
  success?: boolean;
  error?: string;
  data?: { success: boolean };
};

export async function adminUpdateNotificationAction(
  _prevState: AdminUpdateNotificationState | undefined,
  formData: FormData,
): Promise<AdminUpdateNotificationState> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { error: "Tidak terotorisasi", success: false };
    }

    const allowedRoles: Role[] = ["admin", "staff"];
    if (!allowedRoles.includes(session.user.role as Role)) {
      return { error: "Dilarang", success: false };
    }

    const validated = adminUpdateNotificationSchema.parse({
      notificationId: formData.get("notificationId"),
      isRead: formData.get("isRead") === "true",
    });

    await db
      .update(notifications)
      .set({ isRead: validated.isRead })
      .where(eq(notifications.id, validated.notificationId));

    await createAuditLog({
      action: "update",
      targetType: "notification",
      targetId: validated.notificationId,
      adminId: session.user.id,
      details: {
        isRead: validated.isRead,
      },
    });

    await invalidateCacheByTag("notifications");

    return { success: true, data: { success: true } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: error.issues[0]?.message || "Input tidak valid",
        success: false,
      };
    }
    return { error: "Gagal memperbarui notifikasi", success: false };
  }
}

const markAllNotificationsReadSchema = z.object({});

export type MarkAllNotificationsReadState = {
  success?: boolean;
  error?: string;
  data?: { success: boolean; count?: number };
};

export async function markAllNotificationsReadAction(
  _prevState: MarkAllNotificationsReadState | undefined,
  _formData: FormData,
): Promise<MarkAllNotificationsReadState> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { error: "Tidak terotorisasi", success: false };
    }

    markAllNotificationsReadSchema.parse({});

    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, session.user.id));

    await invalidateCacheByTag("notifications");

    return { success: true, data: { success: true } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: error.issues[0]?.message || "Input tidak valid",
        success: false,
      };
    }
    return {
      error: "Gagal menandai semua notifikasi sebagai dibaca",
      success: false,
    };
  }
}
