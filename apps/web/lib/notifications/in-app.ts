import { logError } from "@/lib/logger";
import { createDb } from "@konkosyuk/shared/db";
import { notifications } from "@konkosyuk/shared/db/schema";
import { sql } from "drizzle-orm";
import { getAblyRest } from "@/lib/ably/server";

export interface InAppPayload {
  userId: string;
  title: string;
  message: string;
  type: string;
  referenceId?: string;
}

export async function sendInAppNotification(payload: InAppPayload): Promise<void> {
  try {
    const db = createDb(process.env.DATABASE_URL!, {
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    await db.insert(notifications).values({
      userId: payload.userId,
      type: sql`${payload.type}::notification_type`,
      title: payload.title,
      message: payload.message,
      referenceId: payload.referenceId ? sql`${payload.referenceId}::uuid` : undefined,
    });

    console.log("[notifications] In-app notification dibuat", { userId: payload.userId, type: payload.type });

    await publishToAbly(payload);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(JSON.stringify(error));
    logError(err, "Gagal membuat in-app notification", { userId: payload.userId });
    throw err;
  }
}

async function publishToAbly(payload: InAppPayload) {
  try {
    const ably = await getAblyRest();
    const channelName = `user:${payload.userId}:notifications`;
    const channel = ably.channels.get(channelName);

    await channel.publish("notification", {
      userId: payload.userId,
      title: payload.title,
      message: payload.message,
      type: payload.type,
      referenceId: payload.referenceId,
      createdAt: new Date().toISOString(),
    });

    console.log("[notifications] Ably publish berhasil", { channelName, userId: payload.userId });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(JSON.stringify(error));
    logError(err, "Gagal publish notifikasi ke Ably", { userId: payload.userId });
  }
}