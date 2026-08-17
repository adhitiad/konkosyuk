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

async function getResendClient() {
  const settings = await getNotificationSettings();
  const apiKey = settings.resendApiKey || process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY belum dikonfigurasi, email maintenance dilewati");
    return null;
  }
  return new Resend(apiKey);
}

async function getFromEmail() {
  const settings = await getNotificationSettings();
  return settings.resendFromEmail || process.env.RESEND_FROM_EMAIL || "KonkosYuk <onboarding@resend.dev>";
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
          <h2 style="color: #2563eb;">Halo ${tenantName},</h2>
          <p>Permintaan sewa Anda telah disetujui oleh pemilik properti.</p>
          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p><strong>Properti:</strong> ${propertyName}</p>
            <p><strong>Unit:</strong> ${unitName}</p>
            <p><strong>DP yang harus dibayar:</strong> Rp ${dpAmount.toLocaleString("id-ID")}</p>
          </div>
          <p>Silakan selesaikan pembayaran DP untuk mengunci kamar Anda.</p>
          <a href="${invoiceUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Bayar DP Sekarang</a>
          <p style="margin-top: 24px; font-size: 12px; color: #64748b;">Email ini dikirim secara otomatis oleh sistem KonkosYuk.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send approval email:", error);
  }
}
