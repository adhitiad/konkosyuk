import { NextRequest, NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { logInfo, logError } from "@/lib/logger";
import { getRedis } from "@/lib/redis";
import { trackStat } from "@/lib/stats";

const DLQ_TTL = 604800;

const qstashConfig = {
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY ?? "build-time-dummy-key",
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY ?? "build-time-dummy-key",
};

/**
 * Dead Letter Queue (DLQ) untuk QStash.
 *
 * Endpoint ini menerima job yang gagal total setelah semua retry QStash habis.
 *
 * Konfigurasi di dashboard Upstash QStash:
 * 1. Buka https://console.upstash.com/qstash
 * 2. Pilih aplikasi QStash Anda
 * 3. Masuk ke menu "Dead Letter Queue" atau "DLQ"
 * 4. Set URL tujuan DLQ ke: https://<your-domain>/api/qstash/dlq
 *
 * Konfigurasi via QStash API:
 * curl -X POST https://qstash.upstash.io/v2/dlq/config \
 *   -H "Authorization: Bearer $QSTASH_TOKEN" \
 *   -H "Content-Type: application/json" \
 *   -d '{"url": "https://<your-domain>/api/qstash/dlq"}'
 *
 * Data yang disimpan di Redis:
 * - Key: qstash:dlq:{messageId}
 * - Value: JSON { originalPayload, retryCount, failureReason, failedAt }
 * - TTL: 7 hari
 */
export const POST = verifySignatureAppRouter(async (request: NextRequest) => {
  try {
    const messageId = request.headers.get("upstash-message-id");
    const retryCount = request.headers.get("upstash-retry-count");
    const failureReason = request.headers.get("upstash-failure-reason");

    if (!messageId) {
      throw new Error("Missing upstash-message-id header");
    }

    const body = (await request.json()) as Record<string, unknown>;

    const redis = await getRedis();
    const dlqKey = `qstash:dlq:${messageId}`;

    const dlqEntry = {
      originalPayload: body,
      retryCount: retryCount ? Number(retryCount) : 0,
      failureReason: failureReason || null,
      failedAt: new Date().toISOString(),
    };

    await redis.set(dlqKey, JSON.stringify(dlqEntry), DLQ_TTL);

    const channel = (body.payload as Record<string, unknown> | undefined)?.channel as string | undefined;
    if (channel) {
      void trackStat(channel, "dlq");
    }

    logInfo("[qstash-dlq] Job disimpan ke DLQ", {
      messageId,
      retryCount: dlqEntry.retryCount,
      failureReason: dlqEntry.failureReason,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    logError(error, "QStash DLQ error");
    throw error;
  }
}, qstashConfig);
