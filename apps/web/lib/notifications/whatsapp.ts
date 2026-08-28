import { logError } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limiter";

export interface WhatsAppPayload {
  to: string;
  message: string;
  fileUrl?: string;
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Kirim notifikasi WhatsApp via Fonnte.
 *
 * Rate limit global diterapkan di sini untuk mencegah akun Fonnte terkena banned.
 * Default: maksimal 5 pesan per 1 detik (safety margin dari limit resmi Fonnte).
 *
 * Jika rate limit tercapai, error akan dilempar agar QStash melakukan retry otomatis.
 */
export async function sendWhatsApp(payload: WhatsAppPayload): Promise<void> {
  const token = process.env.FONNTE_TOKEN;

  if (!token) {
    throw new Error("FONNTE_TOKEN belum dikonfigurasi");
  }

  /**
   * Rate limit global untuk Fonnte.
   *
   * Limit default 5/detik adalah safety margin dari limit resmi Fonnte (~10 msg/sec).
   * Jika akun di-upgrade ke tier yang lebih tinggi, sesuaikan via environment variables:
   * - FONNTE_RATE_LIMIT: jumlah pesan maksimal per window
   * - FONNTE_RATE_WINDOW: durasi window dalam detik
   *
   * Contoh untuk tier tinggi: FONNTE_RATE_LIMIT=20 FONNTE_RATE_WINDOW=1
   */
  await checkRateLimit("fonnte");

  try {
    const url = "https://api.fonnte.com/send";

    const body: Record<string, string> = {
      target: payload.to,
      message: payload.message,
    };

    if (payload.fileUrl) {
      if (!isValidUrl(payload.fileUrl)) {
        throw new Error(`URL file WhatsApp tidak valid: ${payload.fileUrl}`);
      }
      body.file = payload.fileUrl;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(body),
    });

    const result = await response.json();

    if (!response.ok || result.status !== true) {
      const err = new Error(`Gagal mengirim WhatsApp: ${result.reason || JSON.stringify(result)}`);
      logError(err, "Gagal mengirim WhatsApp", { to: payload.to, result });
      throw err;
    }

    console.log("[notifications] WhatsApp terkirim", { to: payload.to, id: result.id });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(JSON.stringify(error));
    logError(err, "Error mengirim WhatsApp", { to: payload.to });
    throw err;
  }
}