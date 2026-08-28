import webpush from "web-push";
import { logError } from "@/lib/logger";
import { createDb } from "@konkosyuk/shared/db";
import { pushSubscriptions } from "@konkosyuk/shared/db/schema";
import { eq } from "drizzle-orm";

export interface PushPayload {
  userId: string;
  title: string;
  message: string;
}

export async function sendPushNotification(payload: PushPayload): Promise<void> {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    throw new Error("VAPID keys belum dikonfigurasi");
  }

  try {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || "mailto:admin@konkosyuk.app",
      publicKey,
      privateKey,
    );

    const db = createDb(process.env.DATABASE_URL!, {
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    const subscriptions = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, payload.userId));

    if (subscriptions.length === 0) {
      console.log("[notifications] Tidak ada push subscription untuk user", { userId: payload.userId });
      return;
    }

    const payloadJson = JSON.stringify({ title: payload.title, message: payload.message, icon: "/icon-192.png" });

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payloadJson,
          );
        } catch (error) {
          logError(error instanceof Error ? error : new Error(JSON.stringify(error)), "Gagal mengirim push ke subscription", { subscriptionId: sub.id, userId: payload.userId });
        }
      }),
    );

    console.log("[notifications] Push notification diproses", { userId: payload.userId, subscriptions: subscriptions.length });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(JSON.stringify(error));
    logError(err, "Error mengirim push notification", { userId: payload.userId });
    throw err;
  }
}