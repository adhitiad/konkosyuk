import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendApprovalEmail(
  tenantEmail: string,
  tenantName: string,
  propertyName: string,
  unitName: string,
  dpAmount: number,
  invoiceUrl: string,
): Promise<void> {
  try {
    await resend.emails.send({
      from: 'KonkosYuk <onboarding@resend.dev>',
      to: [tenantEmail],
      subject: 'Permintaan Sewa Anda Disetujui - KonkosYuk',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #2563eb;">Halo ${tenantName},</h2>
          <p>Permintaan sewa Anda telah disetujui oleh pemilik properti.</p>
          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p><strong>Properti:</strong> ${propertyName}</p>
            <p><strong>Unit:</strong> ${unitName}</p>
            <p><strong>DP yang harus dibayar:</strong> Rp ${dpAmount.toLocaleString('id-ID')}</p>
          </div>
          <p>Silakan selesaikan pembayaran DP untuk mengunci kamar Anda.</p>
          <a href="${invoiceUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Bayar DP Sekarang</a>
          <p style="margin-top: 24px; font-size: 12px; color: #64748b;">Email ini dikirim secara otomatis oleh sistem KonkosYuk.</p>
        </div>
      `,
    })
  } catch (error) {
    console.error('Failed to send approval email:', error)
  }
}
