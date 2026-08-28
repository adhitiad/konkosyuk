import { Resend } from "resend";
import { logError } from "@/lib/logger";

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

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

async function downloadToBase64(url: string, filename: string): Promise<{ filename: string; content: string }> {
  if (!isValidUrl(url)) {
    throw new Error(`URL lampiran email tidak valid: ${url}`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Gagal mengunduh lampiran email: HTTP ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");

    return { filename, content: base64 };
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Timeout mengunduh lampiran email: ${url}`);
    }
    throw error;
  }
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY belum dikonfigurasi");
  }

  try {
    const resend = new Resend(apiKey);

    let attachments: { filename: string; content: string }[] | undefined;
    if (payload.attachments && payload.attachments.length > 0) {
      attachments = await Promise.all(
        payload.attachments.map((att) => downloadToBase64(att.url, att.filename)),
      );
    }

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "KonkosYuk <noreply@konkosyuk.app>",
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      attachments,
    });

    if (error) {
      const err = new Error(`Gagal mengirim email: ${error.message || JSON.stringify(error)}`);
      logError(err, "Gagal mengirim email", { to: payload.to, error });
      throw err;
    }

    console.log("[notifications] Email terkirim", { to: payload.to, id: data?.id, attachments: attachments?.length ?? 0 });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(JSON.stringify(error));
    logError(err, "Error mengirim email", { to: payload.to });
    throw err;
  }
}