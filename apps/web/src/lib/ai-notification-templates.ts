/**
 * Template notifikasi berbasis AI untuk Email dan WhatsApp.
 *
 * Modul ini menyediakan fungsi-fungsi untuk menghasilkan konten notifikasi
 * yang dipersonalisasi menggunakan AI gateway (Aion/Groq).
 *
 * Penggunaan:
 * ```ts
 * const template = await getAIEmailTemplate("booking_approved", {
 *   tenantName: "John Doe",
 *   propertyName: "Villa Sunset",
 *   unitName: "Unit A1",
 * });
 * ```
 */

import {
  generateAITemplate,
  getAIConfigFromEnv,
  type AITemplateRequest,
} from "@/lib/ai-gateway";
import { logError } from "@/lib/logger";

const aiConfig = getAIConfigFromEnv();

export interface EmailTemplateVariables {
  recipientName?: string;
  tenantName?: string;
  ownerName?: string;
  propertyName?: string;
  unitName?: string;
  bookingUrl?: string;
  invoiceUrl?: string;
  paymentUrl?: string;
  dpAmount?: number;
  fullAmount?: number;
  startDate?: string;
  endDate?: string;
  category?: string;
  status?: string;
  reason?: string;
  chatUrl?: string;
  senderName?: string;
  messagePreview?: string;
  referralCode?: string;
  rewardAmount?: number;
  voucherCode?: string;
  groupName?: string;
  inviterName?: string;
  updateMessage?: string;
  resolutionNote?: string;
  alertMessage?: string;
  customFields?: Record<string, string>;
  description?: string;
}

export interface WhatsAppTemplateVariables {
  recipientName?: string;
  tenantName?: string;
  ownerName?: string;
  propertyName?: string;
  unitName?: string;
  bookingCode?: string;
  amount?: number;
  status?: string;
  reason?: string;
  category?: string;
  resolutionNote?: string;
  chatUrl?: string;
  senderName?: string;
  messagePreview?: string;
  customFields?: Record<string, string>;
}

function buildContext(
  variables: Record<string, unknown>,
): Record<string, unknown> {
  const context: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(variables)) {
    if (value !== undefined && value !== null && value !== "") {
      context[key] = value;
    }
  }

  return context;
}

function sanitizeForWhatsApp(text: string): string {
  const map: Record<string, string> = {
    "&": "&",
    "<": "<",
    ">": ">",
    '"': '"',
    "'": "'",
  };
  return text.replace(/[&<>"']/g, (char) => map[char] || char).trim();
}

function wrapEmailHtml(
  body: string,
  title: string,
  recipientName?: string,
): string {
  const greeting = recipientName ? `Halo ${recipientName},` : "Halo,";

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
</head>
<body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #f8f9fa;">
  <div style="background-color: #ffffff; border-radius: 8px; padding: 32px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #0d9488; font-size: 24px; margin: 0;">KonkosYuk</h1>
      <p style="color: #6b7280; font-size: 14px; margin: 4px 0 0;">Sistem Booking Properti</p>
    </div>
    <div style="border-top: 2px solid #0d9488; margin: 24px 0;"></div>
    <div style="font-size: 16px; line-height: 1.6;">
      <p style="margin-top: 0;">${greeting}</p>
      ${body}
    </div>
    <div style="border-top: 1px solid #e5e7eb; margin: 24px 0;"></div>
    <p style="font-size: 12px; color: #9ca3af; text-align: center;">
      Email ini dikirim secara otomatis oleh sistem KonkosYuk.<br>
      Jika Anda memiliki pertanyaan, silakan hubungi dukungan kami.
    </p>
  </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&",
    "<": "<",
    ">": ">",
    '"': '"',
    "'": "'",
  };
  return text.replace(/[&<>"']/g, (char) => map[char] || char);
}

async function getAIOrStatic(
  request: AITemplateRequest,
  fallbackStatic: () => { subject?: string; title?: string; body: string },
): Promise<{
  subject?: string;
  title?: string;
  body: string;
  provider: "aion" | "groq" | "static";
}> {
  try {
    const result = await generateAITemplate(request, aiConfig);

    if (result.provider !== "static") {
      return result;
    }
  } catch (error) {
    logError(
      error,
      "Gagal generate template dengan AI, menggunakan template statis",
    );
  }

  return { ...fallbackStatic(), provider: "static" };
}

export async function getAIEmailTemplate(
  notificationType: string,
  variables: EmailTemplateVariables = {},
): Promise<{
  subject: string;
  html: string;
  provider: "aion" | "groq" | "static";
}> {
  const context = buildContext(variables as unknown as Record<string, unknown>);
  const request: AITemplateRequest = {
    notificationType,
    channel: "email",
    context,
  };

  const result = await getAIOrStatic(request, () => {
    const staticResult = getStaticEmailTemplate(notificationType, variables);
    return { subject: staticResult.subject, body: staticResult.html };
  });

  const html = wrapEmailHtml(
    result.body,
    result.subject || "Pemberitahuan KonkosYuk",
    variables.recipientName,
  );

  return {
    subject:
      result.subject ||
      getStaticEmailTemplate(notificationType, variables).subject,
    html,
    provider: result.provider,
  };
}

export async function getAIWhatsAppTemplate(
  notificationType: string,
  variables: WhatsAppTemplateVariables = {},
): Promise<{
  title: string;
  body: string;
  provider: "aion" | "groq" | "static";
}> {
  const context = buildContext(variables as unknown as Record<string, unknown>);
  const request: AITemplateRequest = {
    notificationType,
    channel: "whatsapp",
    context,
  };

  const result = await getAIOrStatic(request, () => {
    const staticResult = getStaticWhatsAppTemplate(notificationType, variables);
    return { title: staticResult.title, body: staticResult.body };
  });

  return {
    title:
      result.title ||
      getStaticWhatsAppTemplate(notificationType, variables).title,
    body: sanitizeForWhatsApp(result.body),
    provider: result.provider,
  };
}

function getStaticEmailTemplate(
  notificationType: string,
  variables: EmailTemplateVariables,
): { subject: string; html: string } {
  const templates: Record<
    string,
    (vars: EmailTemplateVariables) => { subject: string; html: string }
  > = {
    booking_created: (v) => ({
      subject: "Permintaan Booking Baru",
      html: `<h2>Permintaan Booking Baru</h2>
        <p>Ada permintaan booking baru dari <strong>${escapeHtml(v.tenantName || "tenant")}</strong> untuk properti <strong>${escapeHtml(v.propertyName || "")}</strong> - ${escapeHtml(v.unitName || "")}.</p>
        ${v.bookingUrl ? `<p><a href="${escapeHtml(v.bookingUrl)}" style="color: #0d9488;">Lihat Detail Booking</a></p>` : ""}`,
    }),
    booking_approved: (v) => ({
      subject: "Permintaan Sewa Anda Disetujui",
      html: `<h2>Permintaan Sewa Disetujui</h2>
        <p>Permintaan sewa Anda untuk <strong>${escapeHtml(v.propertyName || "")}</strong> - ${escapeHtml(v.unitName || "")} telah disetujui.</p>
        ${v.invoiceUrl ? `<p><a href="${escapeHtml(v.invoiceUrl)}" style="color: #0d9488;">Lihat Invoice Pembayaran</a></p>` : ""}`,
    }),
    booking_rejected: (v) => ({
      subject: "Permintaan Booking Ditolak",
      html: `<h2>Permintaan Booking Ditolak</h2>
        <p>Maaf, permintaan booking Anda untuk <strong>${escapeHtml(v.propertyName || "")}</strong> - ${escapeHtml(v.unitName || "")} belum dapat diproses.</p>
        ${v.reason ? `<p><em>Alasan: ${escapeHtml(v.reason)}</em></p>` : ""}`,
    }),
    payment_dp_paid: (v) => ({
      subject: "Pembayaran DP Diterima",
      html: `<h2>Pembayaran DP Diterima</h2>
        <p>Pembayaran down payment dari <strong>${escapeHtml(v.tenantName || "")}</strong> sebesar <strong>Rp ${(v.dpAmount || 0).toLocaleString("id-ID")}</strong> telah kami terima untuk <strong>${escapeHtml(v.propertyName || "")}</strong>.</p>`,
    }),
    payment_full_paid: (v) => ({
      subject: "Pembayaran Lengkap Diterima",
      html: `<h2>Pembayaran Lengkap Diterima</h2>
        <p>Pembayaran lengkap dari <strong>${escapeHtml(v.tenantName || "")}</strong> sebesar <strong>Rp ${(v.fullAmount || 0).toLocaleString("id-ID")}</strong> telah kami terima untuk <strong>${escapeHtml(v.propertyName || "")}</strong>.</p>
        <p>Terima kasih telah mempercayakan KonkosYuk!</p>`,
    }),
    payment_failed: (v) => ({
      subject: "Pembayaran Gagal",
      html: `<h2>Pembayaran Gagal</h2>
        <p>Terjadi kendala pada pembayaran Anda untuk <strong>${escapeHtml(v.propertyName || "")}</strong>. Silakan coba lagi atau hubungi dukungan jika masalah berlanjut.</p>`,
    }),
    maintenance_created: (v) => ({
      subject: "Laporan Masalah Baru",
      html: `<h2>Laporan Masalah Baru</h2>
        <p>Ada laporan <strong>${escapeHtml(v.category || "masalah")}</strong> di properti <strong>${escapeHtml(v.propertyName || "")}</strong>.</p>
        ${v.description ? `<p><em>${escapeHtml(v.description)}</em></p>` : ""}`,
    }),
    maintenance_updated: (v) => ({
      subject: "Status Laporan Masalah Diperbarui",
      html: `<h2>Status Laporan Diperbarui</h2>
        <p>Status laporan masalah Anda telah berubah menjadi <strong>${escapeHtml(v.status || "")}</strong>.</p>
        ${v.resolutionNote ? `<p><em>Catatan: ${escapeHtml(v.resolutionNote)}</em></p>` : ""}`,
    }),
    booking_reminder_24h: (v) => ({
      subject: "Pengingat: Booking Dimulai Besok",
      html: `<h2>Pengingat Booking</h2>
        <p>Booking Anda untuk <strong>${escapeHtml(v.propertyName || "")}</strong> - ${escapeHtml(v.unitName || "")} akan dimulai besok.</p>
        <p>Pastikan segala sesuatu telah siap. Selamat menikmati penginapan!</p>`,
    }),
    booking_reminder_1h: (v) => ({
      subject: "Pengingat: Booking Dimulai 1 Jam Lagi",
      html: `<h2>Pengingat Booking</h2>
        <p>Booking Anda untuk <strong>${escapeHtml(v.propertyName || "")}</strong> - ${escapeHtml(v.unitName || "")} akan dimulai dalam 1 jam.</p>
        <p>Silakan pastikan Anda sudah sampai di lokasi.</p>`,
    }),
    chat_message: (v) => ({
      subject: `Pesan Baru dari ${v.senderName || "User"}`,
      html: `<h2>Pesan Baru</h2>
        <p>Anda menerima pesan baru dari <strong>${escapeHtml(v.senderName || "")}</strong>:</p>
        <blockquote style="border-left: 3px solid #0d9488; padding-left: 16px; color: #4b5563; font-style: italic;">${escapeHtml(v.messagePreview || "")}</blockquote>
        ${v.chatUrl ? `<p><a href="${escapeHtml(v.chatUrl)}" style="color: #0d9488;">Balas Pesan</a></p>` : ""}`,
    }),
    system: () => ({
      subject: "Pemberitahuan KonkosYuk",
      html: `<h2>Pemberitahuan</h2><p>Ada pemberitahuan penting dari sistem KonkosYuk. Silakan cek aplikasi untuk detail.</p>`,
    }),
  };

  const template = templates[notificationType] || templates.system;
  return template(variables);
}

function getStaticWhatsAppTemplate(
  notificationType: string,
  variables: WhatsAppTemplateVariables,
): { title: string; body: string } {
  const templates: Record<
    string,
    (vars: WhatsAppTemplateVariables) => { title: string; body: string }
  > = {
    booking_created: (v) => ({
      title: "Booking Baru",
      body: `Halo ${v.ownerName || "Owner"}! Ada permintaan booking baru dari ${v.tenantName || "tenant"} untuk ${v.propertyName || ""}${v.unitName ? " - " + v.unitName : ""}. Silakan cek aplikasi untuk detail dan persetujuan.`,
    }),
    booking_approved: (v) => ({
      title: "Booking Disetujui",
      body: `Halo ${v.tenantName || ""}! Permintaan sewa Anda untuk ${v.propertyName || ""}${v.unitName ? " - " + v.unitName : ""} telah disetujui. Silakan lanjutkan proses pembayaran melalui aplikasi.`,
    }),
    booking_rejected: (v) => ({
      title: "Booking Ditolak",
      body: `Halo ${v.tenantName || ""}! Maaf, permintaan booking Anda untuk ${v.propertyName || ""}${v.unitName ? " - " + v.unitName : ""} belum dapat diproses.${v.reason ? " Alasan: " + v.reason : ""} Silakan cek aplikasi untuk info lebih lanjut.`,
    }),
    payment_dp_paid: (v) => ({
      title: "Pembayaran DP Diterima",
      body: `Pembayaran DP dari ${v.tenantName || ""} sebesar Rp ${(v.amount || 0).toLocaleString("id-ID")} telah diterima untuk ${v.propertyName || ""}. Booking kini dalam proses konfirmasi.`,
    }),
    payment_full_paid: (v) => ({
      title: "Pembayaran Lengkap",
      body: `Pembayaran lengkap dari ${v.tenantName || ""} sebesar Rp ${(v.amount || 0).toLocaleString("id-ID")} telah diterima untuk ${v.propertyName || ""}. Terima kasih!`,
    }),
    payment_failed: (v) => ({
      title: "Pembayaran Gagal",
      body: `Terjadi kendala pada pembayaran untuk ${v.propertyName || ""}. Silakan coba lagi atau hubungi dukungan jika masalah berlanjut.`,
    }),
    maintenance_created: (v) => ({
      title: "Laporan Masalah Baru",
      body: `Ada laporan ${v.category || "masalah"} baru di ${v.propertyName || ""}. Silakan cek aplikasi untuk detail dan penanganan lebih lanjut.`,
    }),
    maintenance_updated: (v) => ({
      title: "Laporan Diperbarui",
      body: `Status laporan masalah Anda telah diperbarui menjadi "${v.status || ""}".${v.resolutionNote ? " Catatan: " + v.resolutionNote : ""} Silakan cek aplikasi untuk info lengkap.`,
    }),
    booking_reminder_24h: (v) => ({
      title: "Pengingat Booking",
      body: `Halo ${v.tenantName || ""}! Booking Anda untuk ${v.propertyName || ""}${v.unitName ? " - " + v.unitName : ""} akan dimulai besok. Pastikan segala sesuatu telah siap.`,
    }),
    booking_reminder_1h: (v) => ({
      title: "Pengingat Booking",
      body: `Halo ${v.tenantName || ""}! Booking Anda untuk ${v.propertyName || ""}${v.unitName ? " - " + v.unitName : ""} akan dimulai dalam 1 jam. Silakan pastikan Anda sudah sampai di lokasi.`,
    }),
    chat_message: (v) => ({
      title: "Pesan Baru",
      body: `Anda menerima pesan baru dari ${v.senderName || ""}: "${v.messagePreview || ""}". ${v.chatUrl ? "Balas sekarang: " + v.chatUrl : ""}`,
    }),
    system: () => ({
      title: "Pemberitahuan KonkosYuk",
      body: "Ada pemberitahuan penting dari sistem KonkosYuk. Silakan cek aplikasi untuk detail lebih lanjut.",
    }),
  };

  const template = templates[notificationType] || templates.system;
  return template(variables);
}

export { getStaticEmailTemplate, getStaticWhatsAppTemplate };
