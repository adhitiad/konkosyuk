/**
 * Rate limiter menggunakan fixed window counter di Upstash Redis.
 *
 * Algoritma fixed window membagi waktu ke dalam jendela-waktu terpisah
 * dan menghitung berapa banyak request yang masuk di jendela tersebut.
 *
 * Key format: ratelimit:{key}:{windowTimestamp}
 * Window timestamp = Math.floor(Date.now() / 1000 / windowSeconds)
 *
 * Contoh: ratelimit:fonnte:12345678 untuk window 1 detik
 *
 * Jika Redis tidak tersedia, otomatis fallback ke memory client
 * (per-instance, tidak shared antar Next.js instance).
 */
import { getRedis } from "@/lib/redis";

const DEFAULT_RATE_LIMIT = Number(process.env.FONNTE_RATE_LIMIT ?? 5);
const DEFAULT_RATE_WINDOW = Number(process.env.FONNTE_RATE_WINDOW ?? 1);

/**
 * Cek rate limit untuk key tertentu.
 *
 * @param key - Identifier unik untuk rate limit (misal: 'fonnte')
 * @param limit - Maksimum request yang diizinkan per window
 * @param windowSeconds - Durasi window dalam detik
 * @throws Error jika rate limit terlampaui
 *
 * @example
 * // Maksimal 5 pesan WhatsApp per 1 detik
 * await checkRateLimit('fonnte', 5, 1);
 */
export async function checkRateLimit(
  key: string,
  limit = DEFAULT_RATE_LIMIT,
  windowSeconds = DEFAULT_RATE_WINDOW,
): Promise<void> {
  const windowKey = `ratelimit:${key}:${Math.floor(Date.now() / 1000 / windowSeconds)}`;

  const redis = await getRedis();

  const current = await redis.incr(windowKey, windowSeconds);
  if (current > limit) {
    throw new Error(`Rate limit exceeded for ${key}`);
  }
}
