/**
 * AI Gateway untuk generasi template notifikasi.
 *
 * Strategi pergantian layanan AI:
 * - Primary: Aion (20K TPM, 20K daily token limit)
 * - Fallback: Groq (30 RPM, 14.4K RPD, 15K TPM, 500K TPD)
 *
 * Algoritma:
 * 1. Coba Aion terlebih dahulu
 * 2. Jika Aion rate limited (429) atau error, fallback ke Groq
 * 3. Jika Groq juga gagal, fallback ke template statis
 * 4. Tracking penggunaan per-menit dan per-hari untuk menghindari exceed limit
 */

import OpenAI from "openai";
import Groq from "groq-sdk";
import { logError, logWarn } from "@/lib/logger";
import type {
  AIProvider,
  AIConfig,
  AITemplateRequest,
  AITemplateResponse,
  UsageTracker,
} from "@/types/infrastructure";

export type { AIProvider, AIConfig, AITemplateRequest, AITemplateResponse };

const usage: Record<AIProvider, UsageTracker> = {
  aion: {
    minuteTokens: 0,
    dailyTokens: 0,
    minuteRequests: 0,
    dailyRequests: 0,
    lastMinuteReset: Date.now(),
    lastDayReset: Date.now(),
  },
  groq: {
    minuteTokens: 0,
    dailyTokens: 0,
    minuteRequests: 0,
    dailyRequests: 0,
    lastMinuteReset: Date.now(),
    lastDayReset: Date.now(),
  },
  static: {
    minuteTokens: 0,
    dailyTokens: 0,
    minuteRequests: 0,
    dailyRequests: 0,
    lastMinuteReset: Date.now(),
    lastDayReset: Date.now(),
  },
};

const AION_LIMITS = {
  tpm: 20_000,
  dailyTokens: 20_000,
};

const GROQ_LIMITS = {
  rpm: 30,
  rpd: 14_400,
  tpm: 15_000,
  tpd: 500_000,
};

function resetCountersIfNeeded(tracker: UsageTracker): UsageTracker {
  const now = Date.now();
  const oneMinute = 60 * 1000;
  const oneDay = 24 * 60 * 60 * 1000;

  let needsUpdate = false;
  const updated = { ...tracker };

  if (now - tracker.lastMinuteReset >= oneMinute) {
    updated.minuteTokens = 0;
    updated.minuteRequests = 0;
    updated.lastMinuteReset = now;
    needsUpdate = true;
  }

  if (now - tracker.lastDayReset >= oneDay) {
    updated.dailyTokens = 0;
    updated.dailyRequests = 0;
    updated.lastDayReset = now;
    needsUpdate = true;
  }

  return needsUpdate ? updated : tracker;
}

function updateUsage(provider: AIProvider, tokens: number): void {
  usage[provider] = resetCountersIfNeeded(usage[provider]);
  usage[provider].minuteTokens += tokens;
  usage[provider].dailyTokens += tokens;
  usage[provider].minuteRequests += 1;
  usage[provider].dailyRequests += 1;
}

function canUseAion(): boolean {
  const tracker = resetCountersIfNeeded(usage.aion);
  return (
    tracker.minuteTokens < AION_LIMITS.tpm &&
    tracker.dailyTokens < AION_LIMITS.dailyTokens
  );
}

function canUseGroq(): boolean {
  const tracker = resetCountersIfNeeded(usage.groq);
  return (
    tracker.minuteRequests < GROQ_LIMITS.rpm &&
    tracker.dailyRequests < GROQ_LIMITS.rpd &&
    tracker.minuteTokens < GROQ_LIMITS.tpm &&
    tracker.dailyTokens < GROQ_LIMITS.tpd
  );
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function buildPrompt(request: AITemplateRequest): string {
  const { notificationType, channel, language = "id", context } = request;

  const channelLabel = channel === "email" ? "Email" : "WhatsApp";
  const langLabel = language === "id" ? "Bahasa Indonesia" : "English";

  let contextStr = "";
  for (const [key, value] of Object.entries(context)) {
    if (value !== undefined && value !== null && value !== "") {
      contextStr += `- ${key}: ${value}\n`;
    }
  }

  return `Kamu adalah asisten penulis notifikasi profesional untuk sistem booking properti KonkosYuk.

Tugas: Buatkan konten notifikasi ${channelLabel} dalam ${langLabel}.

Jenis Notifikasi: ${notificationType}

Data Kontekst:
${contextStr || "- (tidak ada data tambahan)"}

Aturan:
1. Gunakan bahasa yang natural, ramah, dan profesional
2. Sertakan informasi penting dari konteks di atas
3. Untuk WhatsApp: maksimal 2 paragraf, gunakan format yang mudah dibaca di mobile
4. Untuk Email: gunakan format HTML yang rapi dengan greeting, body, dan closing
5. Jangan gunakan placeholder seperti [nama], [tanggal], dll - isi dengan data sebenarnya
6. Jangan tambahkan disclaimer atau footer yang tidak relevan

Output format:
${channel === "email" ? `Subject: <subject email>
Body: <HTML body>` : `Title: <judul WhatsApp>
Body: <isi pesan WhatsApp>`}`;
}

function getStaticTemplate(request: AITemplateRequest): AITemplateResponse {
  const { notificationType, channel } = request;

  const templates: Record<string, { email?: { subject: string; body: string }; whatsapp?: { title: string; body: string } }> = {
    booking_created: {
      email: {
        subject: "Permintaan Booking Baru",
        body: `<h2>Permintaan Booking Baru</h2><p>Ada permintaan booking baru yang memerlukan persetujuan Anda. Silakan cek dashboard untuk melihat detail.</p>`,
      },
      whatsapp: {
        title: "Booking Baru",
        body: "Ada permintaan booking baru yang memerlukan persetujuan Anda. Silakan cek aplikasi untuk detail lebih lanjut.",
      },
    },
    booking_approved: {
      email: {
        subject: "Permintaan Sewa Anda Disetujui",
        body: `<h2>Permintaan Sewa Disetujui</h2><p>Permintaan sewa Anda telah disetujui. Silakan lanjutkan proses pembayaran.</p>`,
      },
      whatsapp: {
        title: "Booking Disetujui",
        body: "Permintaan sewa Anda telah disetujui! Silakan lanjutkan proses pembayaran melalui aplikasi.",
      },
    },
    booking_rejected: {
      email: {
        subject: "Permintaan Booking Ditolak",
        body: `<h2>Permintaan Booking Ditolak</h2><p>Maaf, permintaan booking Anda belum dapat diproses. Silakan cek alasan penolakan di aplikasi.</p>`,
      },
      whatsapp: {
        title: "Booking Ditolak",
        body: "Maaf, permintaan booking Anda belum dapat diproses. Silakan cek alasan penolakan di aplikasi untuk informasi lebih lanjut.",
      },
    },
    payment_dp_paid: {
      email: {
        subject: "Pembayaran DP Diterima",
        body: `<h2>Pembayaran DP Diterima</h2><p>Pembayaran down payment Anda telah kami terima. Booking Anda kini dalam proses konfirmasi.</p>`,
      },
      whatsapp: {
        title: "Pembayaran DP Diterima",
        body: "Pembayaran down payment Anda telah kami terima. Booking Anda kini dalam proses konfirmasi.",
      },
    },
    payment_full_paid: {
      email: {
        subject: "Pembayaran Lengkap Diterima",
        body: `<h2>Pembayaran Lengkap Diterima</h2><p>Pembayaran lengkap untuk booking Anda telah kami terima. Terima kasih!</p>`,
      },
      whatsapp: {
        title: "Pembayaran Lengkap",
        body: "Pembayaran lengkap untuk booking Anda telah kami terima. Terima kasih telah mempercayakan KonkosYuk!",
      },
    },
    payment_failed: {
      email: {
        subject: "Pembayaran Gagal",
        body: `<h2>Pembayaran Gagal</h2><p>Terjadi kendala pada pembayaran Anda. Silakan coba lagi atau hubungi dukungan jika masalah berlanjut.</p>`,
      },
      whatsapp: {
        title: "Pembayaran Gagal",
        body: "Terjadi kendala pada pembayaran Anda. Silakan coba lagi atau hubungi dukungan jika masalah berlanjut.",
      },
    },
    maintenance_created: {
      email: {
        subject: "Laporan Masalah Baru",
        body: `<h2>Laporan Masalah Baru</h2><p>Ada laporan masalah baru yang perlu ditangani. Silakan cek dashboard untuk detail.</p>`,
      },
      whatsapp: {
        title: "Laporan Masalah Baru",
        body: "Ada laporan masalah baru yang perlu ditangani. Silakan cek aplikasi untuk detail lebih lanjut.",
      },
    },
    maintenance_updated: {
      email: {
        subject: "Status Laporan Masalah Diperbarui",
        body: `<h2>Status Laporan Diperbarui</h2><p>Status laporan masalah Anda telah diperbarui. Silakan cek aplikasi untuk informasi terbaru.</p>`,
      },
      whatsapp: {
        title: "Laporan Diperbarui",
        body: "Status laporan masalah Anda telah diperbarui. Silakan cek aplikasi untuk informasi terbaru.",
      },
    },
    booking_reminder_24h: {
      email: {
        subject: "Pengingat: Booking Dimulai Besok",
        body: `<h2>Pengingat Booking</h2><p>Booking Anda akan dimulai besok. Pastikan segala sesuatu telah siap.</p>`,
      },
      whatsapp: {
        title: "Pengingat Booking",
        body: "Booking Anda akan dimulai besok. Pastikan segala sesuatu telah siap. Terima kasih!",
      },
    },
    booking_reminder_1h: {
      email: {
        subject: "Pengingat: Booking Dimulai 1 Jam Lagi",
        body: `<h2>Pengingat Booking</h2><p>Booking Anda akan dimulai dalam 1 jam. Silakan pastikan Anda sudah sampai di lokasi.</p>`,
      },
      whatsapp: {
        title: "Pengingat Booking",
        body: "Booking Anda akan dimulai dalam 1 jam. Silakan pastikan Anda sudah sampai di lokasi. Terima kasih!",
      },
    },
    system: {
      email: {
        subject: "Pemberitahuan Sistem",
        body: `<h2>Pemberitahuan</h2><p>Ada pemberitahuan penting dari sistem KonkosYuk. Silakan cek aplikasi untuk detail.</p>`,
      },
      whatsapp: {
        title: "Pemberitahuan",
        body: "Ada pemberitahuan penting dari sistem KonkosYuk. Silakan cek aplikasi untuk detail lebih lanjut.",
      },
    },
  };

  const template = templates[notificationType] || templates.system;

  if (channel === "email" && template.email) {
    return {
      subject: template.email.subject,
      body: template.email.body,
      provider: "static",
    };
  }

  if (channel === "whatsapp" && template.whatsapp) {
    return {
      title: template.whatsapp.title,
      body: template.whatsapp.body,
      provider: "static",
    };
  }

  return {
    body: channel === "email"
      ? "<p>Pemberitahuan dari KonkosYuk.</p>"
      : "Pemberitahuan dari KonkosYuk.",
    provider: "static",
  };
}

async function callAion(prompt: string, config: AIConfig): Promise<AITemplateResponse> {
  const client = new OpenAI({
    baseURL: "https://api.aionlabs.ai/v1",
    apiKey: config.aionApiKey,
  });

  const completion = await client.chat.completions.create({
    model: config.aionModel,
    messages: [{ role: "user", content: prompt }],
    temperature: config.aionTemperature,
    max_tokens: 500,
  });

  const content = completion.choices?.[0]?.message?.content || "";

  const tokens = estimateTokens(content);
  updateUsage("aion", tokens);

  return parseAIResponse(content, "aion");
}

async function callGroq(prompt: string, config: AIConfig): Promise<AITemplateResponse> {
  const client = new Groq({
    apiKey: config.groqApiKey,
  });

  const completion = await client.chat.completions.create({
    model: config.groqModel,
    messages: [{ role: "user", content: prompt }],
    temperature: config.groqTemperature,
    max_tokens: 500,
  });

  const content = completion.choices?.[0]?.message?.content || "";

  const tokens = estimateTokens(content);
  updateUsage("groq", tokens);

  return parseAIResponse(content, "groq");
}

function parseAIResponse(content: string, provider: AIProvider): AITemplateResponse {
  let subject: string | undefined;
  let title: string | undefined;
  let body = content;

  const subjectMatch = content.match(/Subject:\s*(.+?)(?:\n|$)/i);
  const titleMatch = content.match(/Title:\s*(.+?)(?:\n|$)/i);
  const bodyMatch = content.match(/Body:\s*([\s\S]+)/i);

  if (subjectMatch) {
    subject = subjectMatch[1].trim();
    body = body.replace(subjectMatch[0], "").trim();
  }

  if (titleMatch) {
    title = titleMatch[1].trim();
    body = body.replace(titleMatch[0], "").trim();
  }

  if (bodyMatch) {
    body = bodyMatch[1].trim();
  }

  return { subject, title, body, provider };
}

export async function generateAITemplate(
  request: AITemplateRequest,
  config: AIConfig,
): Promise<AITemplateResponse> {
  const prompt = buildPrompt(request);

  if (!config.aionApiKey && !config.groqApiKey) {
    logWarn("Tidak ada API key AI yang dikonfigurasi, menggunakan template statis");
    return getStaticTemplate(request);
  }

  const providers: Array<{ name: AIProvider; fn: () => Promise<AITemplateResponse> }> = [];

  if (config.aionApiKey && canUseAion()) {
    providers.push({ name: "aion", fn: () => callAion(prompt, config) });
  }

  if (config.groqApiKey && canUseGroq()) {
    providers.push({ name: "groq", fn: () => callGroq(prompt, config) });
  }

  for (const provider of providers) {
    try {
      const result = await provider.fn();
      return result;
    } catch (error) {
      logError(error, `Gagal generate template dengan ${provider.name}`, {
        notificationType: request.notificationType,
        channel: request.channel,
      });
    }
  }

  logWarn("Semua provider AI gagal, menggunakan template statis", {
    notificationType: request.notificationType,
    channel: request.channel,
  });

  return getStaticTemplate(request);
}

export function getAIUsageStats(): Record<AIProvider, { minuteTokens: number; dailyTokens: number; minuteRequests: number; dailyRequests: number }> {
  return {
    aion: resetCountersIfNeeded(usage.aion),
    groq: resetCountersIfNeeded(usage.groq),
    static: { minuteTokens: 0, dailyTokens: 0, minuteRequests: 0, dailyRequests: 0 },
  };
}

export function getAIConfigFromEnv(): AIConfig {
  return {
    provider: "aion",
    aionApiKey: process.env.AION_API_KEY || "",
    aionModel: process.env.AION_MODEL || "aion-labs/aion-2.0",
    aionTemperature: Number(process.env.AION_TEMPERATURE ?? 0.6),
    groqApiKey: process.env.GROQ_API_KEY || "",
    groqModel: process.env.GROQ_MODEL || "meta-llama/llama-prompt-guard-2-86m",
    groqTemperature: Number(process.env.GROQ_TEMPERATURE ?? 0.5),
  };
}
