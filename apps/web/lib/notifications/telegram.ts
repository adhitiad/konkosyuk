import { logError } from "@/lib/logger";

export interface TelegramPayload {
  chatId: string;
  text: string;
  parseMode?: "Markdown" | "HTML";
  documentUrl?: string;
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export async function sendTelegram(payload: TelegramPayload): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN belum dikonfigurasi");
  }

  try {
    const endpoint = payload.documentUrl ? "sendDocument" : "sendMessage";
    const url = `https://api.telegram.org/bot${token}/${endpoint}`;

    const body: Record<string, unknown> = {
      chat_id: payload.chatId,
    };

    if (payload.documentUrl) {
      if (!isValidUrl(payload.documentUrl)) {
        throw new Error(`URL dokumen Telegram tidak valid: ${payload.documentUrl}`);
      }
      body.document = payload.documentUrl;
      body.caption = payload.text;
      if (payload.parseMode) {
        body.parse_mode = payload.parseMode;
      }
    } else {
      body.text = payload.text;
      if (payload.parseMode) {
        body.parse_mode = payload.parseMode;
      }
    }

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    if (!response.ok || !result.ok) {
      const err = new Error(`Gagal mengirim telegram: ${result.description || JSON.stringify(result)}`);
      logError(err, "Gagal mengirim telegram", { chatId: payload.chatId, result });
      throw err;
    }

    console.log("[notifications] Telegram terkirim", { chatId: payload.chatId, messageId: result.result?.message_id, endpoint });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(JSON.stringify(error));
    logError(err, "Error mengirim telegram", { chatId: payload.chatId });
    throw err;
  }
}