import { NextRequest } from "next/server";
import { z } from "zod";
import { getResendClient, getFromEmail } from "@/lib/notifications/email";
import { ok, fail, handleApiError } from "@/lib/api";

const newsletterSchema = z.object({
  email: z.string().email("Email tidak valid"),
});

export async function POST(req: NextRequest) {
  try {
    const { email } = newsletterSchema.parse(await req.json());

    const client = await getResendClient();
    if (!client) {
      return fail("Layanan email belum dikonfigurasi", 500);
    }

    await client.emails.send({
      from: await getFromEmail(),
      to: [email],
      subject: "Terima kasih telah berlangganan KonkosYuk",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #2563eb;">Terima kasih telah berlangganan!</h2>
          <p>Kami akan mengirimkan info kost terbaru dan penawaran eksklusif langsung ke email Anda.</p>
          <p style="margin-top: 24px; font-size: 12px; color: #64748b;">Email ini dikirim secara otomatis oleh sistem KonkosYuk.</p>
        </div>
      `,
    });

    return ok({ success: true });
  } catch (error) {
    return handleApiError(error, "POST /api/newsletter/subscribe");
  }
}
