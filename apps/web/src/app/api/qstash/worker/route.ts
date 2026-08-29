import { NextRequest, NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { logInfo, logError } from "@/lib/logger";
import { getRedis } from "@/lib/redis";
import { sendNotification } from "@/lib/notifications";
import { trackStat } from "@/lib/stats";

const IDEMPOTENCY_TTL = 86400;

const qstashConfig = {
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY ?? "build-time-dummy-key",
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY ?? "build-time-dummy-key",
};

export const POST = verifySignatureAppRouter(async (request: NextRequest) => {
  const messageId = request.headers.get("upstash-message-id");
  if (!messageId) {
    throw new Error("Missing upstash-message-id header");
  }

  const redis = await getRedis();
  const idempotencyKey = `qstash:processed:${messageId}`;

  const alreadyProcessed = await redis.get(idempotencyKey);
  if (alreadyProcessed) {
    return NextResponse.json({ status: "already processed" }, { status: 200 });
  }

  try {
    const body = (await request.json()) as {
      type: string;
      payload: Record<string, unknown>;
    };

    const { type, payload } = body;

    switch (type) {
      case "SEND_NOTIFICATION": {
        await handleSendNotification(payload);
        break;
      }
      case "SYNC_ANALYTICS": {
        await handleSyncAnalytics(payload);
        break;
      }
      default:
        throw new Error(`Unknown job type: ${type}`);
    }

    await redis.set(idempotencyKey, "1", IDEMPOTENCY_TTL);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    logError(error, "QStash worker error");
    throw error;
  }
}, qstashConfig);

interface ChannelPayload {
  channel: "email" | "telegram" | "whatsapp" | "push" | "in_app";
  to?: string;
  subject?: string;
  html?: string;
  chatId?: string;
  text?: string;
  parseMode?: "Markdown" | "HTML";
  message?: string;
  title?: string;
  userId?: string;
  type?: string;
  referenceId?: string;
}

async function handleSendNotification(payload: Record<string, unknown>) {
  const userId = payload.userId as string | undefined;
  const channels = (payload.channels as ChannelPayload[] | undefined) || [];
  const legacyEmail = payload.recipientEmail as string | undefined;
  const legacyTelegram = payload.telegramChatId as string | undefined;
  const title = (payload.title as string) || "Notifikasi";
  const message = (payload.message as string) || "";
  const notificationType = (payload.notificationType as string) || "system";

  logInfo("[qstash] Memproses SEND_NOTIFICATION", { userId, channelsCount: channels.length });

  if (channels.length > 0) {
    for (const channel of channels) {
      const channelName = channel.channel;
      try {
        await sendChannelNotification(channelName, channel);
        void trackStat(channelName, "success");
      } catch (error) {
        const isRateLimited = isRateLimitError(error);
        if (isRateLimited) {
          void trackStat(channelName, "rate_limited");
        } else {
          void trackStat(channelName, "failed");
        }
        throw error;
      }
    }
  } else if (legacyEmail || legacyTelegram) {
    if (legacyEmail) {
      try {
        await sendNotification("email", {
          to: legacyEmail,
          subject: title,
          html: buildLegacyEmailHtml(title, message),
        });
        void trackStat("email", "success");
      } catch (error) {
        if (isRateLimitError(error)) {
          void trackStat("email", "rate_limited");
        } else {
          void trackStat("email", "failed");
        }
        throw error;
      }
    }

    if (legacyTelegram) {
      try {
        await sendNotification("telegram", {
          chatId: legacyTelegram,
          text: buildLegacyTelegramMessage(title, message),
          parseMode: "HTML",
        });
        void trackStat("telegram", "success");
      } catch (error) {
        if (isRateLimitError(error)) {
          void trackStat("telegram", "rate_limited");
        } else {
          void trackStat("telegram", "failed");
        }
        throw error;
      }
    }
  } else {
    const defaultInAppType = notificationType || "system";
    if (userId) {
      try {
        await sendNotification("in_app", {
          userId,
          title,
          message,
          type: defaultInAppType,
          referenceId: (payload.referenceId as string | undefined),
        });
        void trackStat("in_app", "success");
      } catch (error) {
        void trackStat("in_app", "failed");
        throw error;
      }
    }
  }

  logInfo("[qstash] SEND_NOTIFICATION selesai", { userId, channelsCount: channels.length });
}

function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes("Rate limit exceeded");
  }
  return false;
}

async function sendChannelNotification(_channel: ChannelPayload["channel"], channelPayload: ChannelPayload): Promise<void> {
  switch (channelPayload.channel) {
    case "email": {
      if (!channelPayload.to || !channelPayload.subject || !channelPayload.html) {
        throw new Error("Email channel requires to, subject, and html");
      }
      await sendNotification("email", {
        to: channelPayload.to,
        subject: channelPayload.subject,
        html: channelPayload.html,
      });
      break;
    }
    case "telegram": {
      if (!channelPayload.chatId || !channelPayload.text) {
        throw new Error("Telegram channel requires chatId and text");
      }
      await sendNotification("telegram", {
        chatId: channelPayload.chatId,
        text: channelPayload.text,
        parseMode: channelPayload.parseMode,
      });
      break;
    }
    case "whatsapp": {
      if (!channelPayload.to || !channelPayload.message) {
        throw new Error("WhatsApp channel requires to and message");
      }
      await sendNotification("whatsapp", {
        to: channelPayload.to,
        message: channelPayload.message,
      });
      break;
    }
    case "push": {
      if (!channelPayload.userId || !channelPayload.title || !channelPayload.message) {
        throw new Error("Push channel requires userId, title, and message");
      }
      await sendNotification("push", {
        userId: channelPayload.userId,
        title: channelPayload.title,
        message: channelPayload.message,
      });
      break;
    }
    case "in_app": {
      if (!channelPayload.userId || !channelPayload.title || !channelPayload.message || !channelPayload.type) {
        throw new Error("In-app channel requires userId, title, message, and type");
      }
      await sendNotification("in_app", {
        userId: channelPayload.userId,
        title: channelPayload.title,
        message: channelPayload.message,
        type: channelPayload.type,
        referenceId: channelPayload.referenceId,
      });
      break;
    }
  }
}

async function handleSyncAnalytics(payload: Record<string, unknown>) {
  logInfo("[qstash] Memproses SYNC_ANALYTICS", { payload });
}

function buildLegacyEmailHtml(title: string, message: string): string {
  return `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #2563eb; margin-bottom: 16px;">${title}</h2>
      <p style="line-height: 1.6;">${message}</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
      <p style="font-size: 12px; color: #999;">Email ini dikirim secara otomatis oleh sistem KonkosYuk.</p>
    </div>
  `;
}

function buildLegacyTelegramMessage(title: string, message: string): string {
  return `<b>${title}</b>\n\n${message}`;
}