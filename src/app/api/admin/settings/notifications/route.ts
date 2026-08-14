import { requireSession, type Role } from "@/lib/auth";
import { ok, handleApiError } from "@/lib/api";

export async function GET() {
  try {
    await requireSession(["admin"] as Role[]);
    return ok({
      email: {
        configured: Boolean(process.env.RESEND_API_KEY),
        sender:
          process.env.RESEND_FROM_EMAIL || "KonkosYuk <onboarding@resend.dev>",
      },
      whatsapp: {
        configured: Boolean(
          process.env.META_ACCESS_TOKEN && process.env.META_PHONE_NUMBER_ID,
        ),
        createdTemplate:
          process.env.META_MAINTENANCE_CREATED_TEMPLATE ||
          "maintenance_report_created",
        updatedTemplate:
          process.env.META_MAINTENANCE_UPDATED_TEMPLATE ||
          "maintenance_report_updated",
      },
    });
  } catch (error) {
    return handleApiError(error, "GET /api/admin/settings/notifications");
  }
}
