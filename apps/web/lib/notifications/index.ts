export type NotificationChannel = "email" | "telegram" | "whatsapp" | "push" | "in_app";

export interface Attachment {
  url: string;
  filename: string;
}

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  attachments?: Attachment[];
}

export interface TelegramPayload {
  chatId: string;
  text: string;
  parseMode?: "Markdown" | "HTML";
  documentUrl?: string;
}

export interface WhatsAppPayload {
  to: string;
  message: string;
  fileUrl?: string;
}

export interface PushPayload {
  userId: string;
  title: string;
  message: string;
}

export interface InAppPayload {
  userId: string;
  title: string;
  message: string;
  type: string;
  referenceId?: string;
}

export type NotificationPayload =
  | { channel: "email"; payload: EmailPayload }
  | { channel: "telegram"; payload: TelegramPayload }
  | { channel: "whatsapp"; payload: WhatsAppPayload }
  | { channel: "push"; payload: PushPayload }
  | { channel: "in_app"; payload: InAppPayload };

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function validatePayload(channel: NotificationChannel, payload: EmailPayload | TelegramPayload | WhatsAppPayload | PushPayload | InAppPayload): void {
  switch (channel) {
    case "email": {
      const p = payload as EmailPayload;
      if (!p.to || !p.subject || !p.html) {
        throw new Error("Email payload tidak lengkap: to, subject, dan html wajib diisi");
      }
      if (p.attachments) {
        for (const att of p.attachments) {
          if (!isValidUrl(att.url)) {
            throw new Error(`URL lampiran email tidak valid: ${att.url}`);
          }
          if (!att.filename || att.filename.trim() === "") {
            throw new Error("Nama file lampiran email tidak boleh kosong");
          }
        }
      }
      break;
    }
    case "telegram": {
      const p = payload as TelegramPayload;
      if (!p.chatId || !p.text) {
        throw new Error("Telegram payload tidak lengkap: chatId dan text wajib diisi");
      }
      if (p.documentUrl && !isValidUrl(p.documentUrl)) {
        throw new Error(`URL dokumen Telegram tidak valid: ${p.documentUrl}`);
      }
      break;
    }
    case "whatsapp": {
      const p = payload as WhatsAppPayload;
      if (!p.to || !p.message) {
        throw new Error("WhatsApp payload tidak lengkap: to dan message wajib diisi");
      }
      if (p.fileUrl && !isValidUrl(p.fileUrl)) {
        throw new Error(`URL file WhatsApp tidak valid: ${p.fileUrl}`);
      }
      break;
    }
    case "push": {
      const p = payload as PushPayload;
      if (!p.userId || !p.title || !p.message) {
        throw new Error("Push payload tidak lengkap: userId, title, dan message wajib diisi");
      }
      break;
    }
    case "in_app": {
      const p = payload as InAppPayload;
      if (!p.userId || !p.title || !p.message || !p.type) {
        throw new Error("In-app payload tidak lengkap: userId, title, message, dan type wajib diisi");
      }
      break;
    }
  }
}

import { sendEmail } from "./resend";
import { sendTelegram } from "./telegram";
import { sendWhatsApp } from "./whatsapp";
import { sendPushNotification } from "./web-push";
import { sendInAppNotification } from "./in-app";

export async function sendNotification(
  channel: NotificationChannel,
  payload: EmailPayload | TelegramPayload | WhatsAppPayload | PushPayload | InAppPayload,
): Promise<void> {
  validatePayload(channel, payload);

  switch (channel) {
    case "email":
      await sendEmail(payload as EmailPayload);
      break;
    case "telegram":
      await sendTelegram(payload as TelegramPayload);
      break;
    case "whatsapp":
      await sendWhatsApp(payload as WhatsAppPayload);
      break;
    case "push":
      await sendPushNotification(payload as PushPayload);
      break;
    case "in_app":
      await sendInAppNotification(payload as InAppPayload);
      break;
  }
}