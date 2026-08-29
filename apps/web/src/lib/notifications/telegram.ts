import { logWarn } from "@/lib/logger";

export interface TelegramPayload {
  chatId: string;
  text: string;
  parseMode?: "Markdown" | "HTML";
}

export async function sendTelegram(_payload: TelegramPayload): Promise<void> {
  logWarn("Telegram tidak didukung pada arsitektur serverless TypeScript", {
    chatId: _payload.chatId,
    text: _payload.text,
  });
}
