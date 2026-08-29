import { NextRequest, NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { logInfo, logError } from "@/lib/logger";
import { getAllUsageCurrentMonth, COST_THRESHOLDS } from "@/lib/usage-tracker";
import { sendTelegram } from "@/lib/notifications/telegram";

const ADMIN_TELEGRAM_CHAT_ID = process.env.ADMIN_TELEGRAM_CHAT_ID;
const WARNING_THRESHOLD = 0.8;
const CRITICAL_THRESHOLD = 1.0;

const qstashConfig = {
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY ?? "build-time-dummy-key",
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY ?? "build-time-dummy-key",
};

export const POST = verifySignatureAppRouter(async (_request: NextRequest) => {
  try {
    const usage = await getAllUsageCurrentMonth();

    const alerts: string[] = [];

    for (const [service, current] of Object.entries(usage)) {
      const threshold = COST_THRESHOLDS[service as keyof typeof COST_THRESHOLDS];
      if (!threshold) continue;

      const percentage = current / threshold;

      if (percentage >= CRITICAL_THRESHOLD) {
        const message = `🚨 PERINGATAN KRITIS: Penggunaan ${service.toUpperCase()} telah mencapai ${Math.round(percentage * 100)}% dari batas bulanan!\n\nCurrent: ${current}\nThreshold: ${threshold}`;
        alerts.push(message);

        if (ADMIN_TELEGRAM_CHAT_ID) {
          try {
            await sendTelegram({
              chatId: ADMIN_TELEGRAM_CHAT_ID,
              text: message,
              parseMode: "HTML",
            });
          } catch (error) {
            logError(error, "Gagal mengirim alert Telegram", { service });
          }
        }
      } else if (percentage >= WARNING_THRESHOLD) {
        const message = `⚠️ PERINGATAN BIAYA: Penggunaan ${service.toUpperCase()} telah mencapai ${Math.round(percentage * 100)}% dari batas bulanan.\n\nCurrent: ${current}\nThreshold: ${threshold}`;
        alerts.push(message);

        if (ADMIN_TELEGRAM_CHAT_ID) {
          try {
            await sendTelegram({
              chatId: ADMIN_TELEGRAM_CHAT_ID,
              text: message,
              parseMode: "HTML",
            });
          } catch (error) {
            logError(error, "Gagal mengirim alert Telegram", { service });
          }
        }
      }
    }

    logInfo("[check-costs] Pemeriksaan biaya selesai", {
      usage,
      alertsCount: alerts.length,
      alerts,
    });

    return NextResponse.json({
      success: true,
      usage,
      alertsSent: alerts.length,
      alerts,
    });
  } catch (error) {
    logError(error, "Gagal memeriksa biaya");
    return NextResponse.json(
      { error: "Gagal memeriksa biaya" },
      { status: 500 },
    );
  }
}, qstashConfig);
