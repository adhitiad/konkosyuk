import { db } from "@/db";
import {
  notifications,
  pushSubscriptions,
  notificationType,
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import webpush from "web-push";
import { logError } from "@/lib/logger";

if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@konkosyuk.app",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
}

export async function createNotification(
  userId: string,
  type: (typeof notificationType)[number],
  title: string,
  message: string,
  referenceId?: string,
) {
  await db.insert(notifications).values({
    userId,
    type,
    title,
    message,
    referenceId,
  });
}

export async function getUnreadCount(userId: string) {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(
      and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
    );
  return Number(count);
}

export async function markAsRead(notificationId: string) {
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.id, notificationId));
}

export async function sendWebPushNotification(
  userId: string,
  title: string,
  message: string,
) {
  if (
    !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    !process.env.VAPID_PRIVATE_KEY
  ) {
    return;
  }

  const subscriptions = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));

  if (subscriptions.length === 0) return;

  const payload = JSON.stringify({ title, message, icon: "/icon-192.png" });

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
        );
      } catch (error) {
        if (
          (error as Error).message.includes("expired") ||
          (error as Error).message.includes("410")
        ) {
          await db
            .delete(pushSubscriptions)
            .where(eq(pushSubscriptions.id, sub.id));
        }
        throw error;
      }
    }),
  );

  const failed = results.filter((r) => r.status === "rejected").length;
  if (failed > 0) {
    logError(
      new Error("push notification failure"),
      "[push] Failed to send notifications",
      { failed, total: subscriptions.length },
    );
  }
}
