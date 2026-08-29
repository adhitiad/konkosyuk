import { logWarn } from "@/lib/logger";
import { sendEmail, sendPush } from "@/lib/notification-client";

export type NotificationChannel = "email" | "telegram" | "whatsapp" | "push" | "in_app";

export interface NotificationPayload {
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

export async function sendNotification(
  channel: NotificationChannel,
  payload: NotificationPayload,
): Promise<void> {
  switch (channel) {
    case "email": {
      if (!payload.to || !payload.subject || !payload.html) {
        throw new Error("Email channel requires to, subject, and html");
      }
      await sendEmail(payload.to, payload.subject, payload.html);
      break;
    }
    case "telegram": {
      logWarn("Telegram tidak didukung pada arsitektur serverless TypeScript", {
        chatId: payload.chatId,
        text: payload.text,
      });
      break;
    }
    case "whatsapp": {
      logWarn("WhatsApp tidak didukung pada arsitektur serverless TypeScript", {
        to: payload.to,
        message: payload.message,
      });
      break;
    }
    case "push": {
      if (!payload.userId || !payload.title || !payload.message) {
        throw new Error("Push channel requires userId, title, and message");
      }
      await sendPush(payload.userId, payload.title, payload.message);
      break;
    }
    case "in_app": {
      if (!payload.userId || !payload.title || !payload.message || !payload.type) {
        throw new Error(
          "In-app channel requires userId, title, message, and type",
        );
      }
      const { createNotification } = await import(
        "@/lib/notification-client"
      );
      await createNotification(
        payload.userId,
        payload.type as "system",
        payload.title,
        payload.message,
        payload.referenceId,
      );
      break;
    }
    default:
      throw new Error(`Unknown channel: ${channel}`);
  }
}
