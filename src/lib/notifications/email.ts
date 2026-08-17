import { Resend } from "resend";
import { getNotificationSettings } from "@/lib/notification-settings";

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[character] ?? character,
  );
}

export async function getResendClient() {
  const settings = await getNotificationSettings();
  const apiKey = settings.resendApiKey || process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      "RESEND_API_KEY belum dikonfigurasi, email maintenance dilewati",
    );
    return null;
  }
  return new Resend(apiKey);
}

export async function getFromEmail() {
  const settings = await getNotificationSettings();
  return (
    settings.resendFromEmail ||
    process.env.RESEND_FROM_EMAIL ||
    "KonkosYuk <onboarding@resend.dev>"
  );
}

async function sendMaintenanceEmail(
  to: string,
  subject: string,
  heading: string,
  content: string,
): Promise<void> {
  const client = await getResendClient();
  if (!client) return;

  try {
    await client.emails.send({
      from: await getFromEmail(),
      to: [to],
      subject,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;color:#333"><h2 style="color:#2563eb">${escapeHtml(heading)}</h2>${content}<p style="margin-top:24px;font-size:12px;color:#64748b">Email otomatis dari KonkosYuk.</p></div>`,
    });
  } catch (error) {
    console.error("Failed to send maintenance email:", error);
  }
}

export function sendMaintenanceReportCreatedEmail(
  to: string,
  recipientName: string,
  propertyName: string,
  category: string,
  description: string,
): Promise<void> {
  return sendMaintenanceEmail(
    to,
    "Laporan Masalah Baru - KonkosYuk",
    `Halo ${recipientName}, ada laporan masalah baru`,
    `<p><strong>Properti:</strong> ${escapeHtml(propertyName)}</p><p><strong>Kategori:</strong> ${escapeHtml(category)}</p><p><strong>Deskripsi:</strong> ${escapeHtml(description)}</p>`,
  );
}

export function sendMaintenanceReportUpdatedEmail(
  to: string,
  recipientName: string,
  status: string,
  resolutionNote?: string | null,
): Promise<void> {
  return sendMaintenanceEmail(
    to,
    "Status Laporan Masalah Diperbarui - KonkosYuk",
    `Halo ${recipientName}, status laporan Anda berubah`,
    `<p><strong>Status:</strong> ${escapeHtml(status)}</p>${resolutionNote ? `<p><strong>Catatan:</strong> ${escapeHtml(resolutionNote)}</p>` : ""}`,
  );
}

export async function sendApprovalEmail(
  tenantEmail: string,
  tenantName: string,
  propertyName: string,
  unitName: string,
  dpAmount: number,
  invoiceUrl: string,
): Promise<void> {
  const client = await getResendClient();
  if (!client) return;

  try {
    await client.emails.send({
      from: await getFromEmail(),
      to: [tenantEmail],
      subject: "Permintaan Sewa Anda Disetujui - KonkosYuk",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #2563eb;">Halo ${escapeHtml(tenantName)},</h2>
          <p>Permintaan sewa Anda telah disetujui oleh pemilik properti.</p>
          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p><strong>Properti:</strong> ${escapeHtml(propertyName)}</p>
            <p><strong>Unit:</strong> ${escapeHtml(unitName)}</p>
            <p><strong>DP yang harus dibayar:</strong> Rp ${dpAmount.toLocaleString("id-ID")}</p>
          </div>
          <p>Silakan selesaikan pembayaran DP untuk mengunci kamar Anda.</p>
          <a href="${escapeHtml(invoiceUrl)}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Bayar DP Sekarang</a>
          <p style="margin-top: 24px; font-size: 12px; color: #64748b;">Email ini dikirim secara otomatis oleh sistem KonkosYuk.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send approval email:", error);
  }
}

export async function sendBookingRequestEmail(
  ownerEmail: string,
  ownerName: string,
  tenantName: string,
  propertyName: string,
  unitName: string,
  bookingUrl: string,
): Promise<void> {
  const client = await getResendClient();
  if (!client) return;

  try {
    await client.emails.send({
      from: await getFromEmail(),
      to: [ownerEmail],
      subject: "Permintaan Booking Baru - KonkosYuk",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #2563eb;">Halo ${escapeHtml(ownerName)},</h2>
          <p>Ada permintaan booking baru untuk properti Anda.</p>
          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p><strong>Tenant:</strong> ${escapeHtml(tenantName)}</p>
            <p><strong>Properti:</strong> ${escapeHtml(propertyName)}</p>
            <p><strong>Unit:</strong> ${escapeHtml(unitName)}</p>
          </div>
          <a href="${escapeHtml(bookingUrl)}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Lihat Detail Booking</a>
          <p style="margin-top: 24px; font-size: 12px; color: #64748b;">Email ini dikirim secara otomatis oleh sistem KonkosYuk.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send booking request email:", error);
  }
}

export async function sendChatNotificationEmail(
  to: string,
  recipientName: string,
  senderName: string,
  messagePreview: string,
  chatUrl: string,
): Promise<void> {
  const client = await getResendClient();
  if (!client) return;

  try {
    await client.emails.send({
      from: await getFromEmail(),
      to: [to],
      subject: `Pesan baru dari ${senderName} - KonkosYuk`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #2563eb;">Halo ${escapeHtml(recipientName)},</h2>
          <p>Anda menerima pesan baru dari <strong>${escapeHtml(senderName)}</strong>:</p>
          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p>"${escapeHtml(messagePreview)}"</p>
          </div>
          <a href="${escapeHtml(chatUrl)}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Buka Chat</a>
          <p style="margin-top: 24px; font-size: 12px; color: #64748b;">Email ini dikirim secara otomatis oleh sistem KonkosYuk.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send chat notification email:", error);
  }
}

export async function sendPaymentReceivedEmail(
  ownerEmail: string,
  ownerName: string,
  tenantName: string,
  propertyName: string,
  amount: number,
  paymentUrl: string,
): Promise<void> {
  const client = await getResendClient();
  if (!client) return;

  try {
    await client.emails.send({
      from: await getFromEmail(),
      to: [ownerEmail],
      subject: "Pembayaran Diterima - KonkosYuk",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #2563eb;">Halo ${escapeHtml(ownerName)},</h2>
          <p>Pembayaran dari <strong>${escapeHtml(tenantName)}</strong> telah diterima.</p>
          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p><strong>Properti:</strong> ${escapeHtml(propertyName)}</p>
            <p><strong>Jumlah:</strong> Rp ${amount.toLocaleString("id-ID")}</p>
          </div>
          <a href="${escapeHtml(paymentUrl)}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Lihat Detail</a>
          <p style="margin-top: 24px; font-size: 12px; color: #64748b;">Email ini dikirim secara otomatis oleh sistem KonkosYuk.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send payment received email:", error);
  }
}

export async function sendBookingRejectionEmail(
  tenantEmail: string,
  tenantName: string,
  propertyName: string,
  unitName: string,
  reason?: string,
): Promise<void> {
  const client = await getResendClient();
  if (!client) return;

  try {
    await client.emails.send({
      from: await getFromEmail(),
      to: [tenantEmail],
      subject: "Permintaan Booking Ditolak - KonkosYuk",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #dc2626;">Halo ${escapeHtml(tenantName)},</h2>
          <p>Mohon maaf, permintaan booking Anda untuk properti berikut telah ditolak:</p>
          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p><strong>Properti:</strong> ${escapeHtml(propertyName)}</p>
            <p><strong>Unit:</strong> ${escapeHtml(unitName)}</p>
            ${reason ? `<p><strong>Alasan:</strong> ${escapeHtml(reason)}</p>` : ""}
          </div>
          <p>Silakan cari properti lain yang tersedia di KonkosYuk.</p>
          <p style="margin-top: 24px; font-size: 12px; color: #64748b;">Email ini dikirim secara otomatis oleh sistem KonkosYuk.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send booking rejection email:", error);
  }
}
