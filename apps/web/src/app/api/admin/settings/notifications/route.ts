import { NextRequest } from "next/server";
import { requireSession, type Role } from "@/lib/auth";
import { validateCsrfToken } from "@/lib/csrf";
import { ok, fail, handleApiError } from "@/lib/api";
import {
  getNotificationSettings,
  upsertNotificationSettings,
} from "@/lib/notification-settings";
import { z } from "zod";

const notificationSchema = z.object({
  resendApiKey: z.string().optional(),
  resendFromEmail: z.string().optional(),
  metaAccessToken: z.string().optional(),
  metaPhoneNumberId: z.string().optional(),
  metaMaintenanceCreatedTemplate: z.string().optional(),
  metaMaintenanceUpdatedTemplate: z.string().optional(),
});

export async function GET() {
  try {
    await requireSession(["admin"] as Role[]);
    const settings = await getNotificationSettings();
    return ok({
      email: {
        configured: Boolean(settings.resendApiKey),
        sender: settings.resendFromEmail || "KonkosYuk <onboarding@resend.dev>",
      },
      whatsapp: {
        configured: Boolean(
          settings.metaAccessToken && settings.metaPhoneNumberId,
        ),
        createdTemplate:
          settings.metaMaintenanceCreatedTemplate ||
          "maintenance_report_created",
        updatedTemplate:
          settings.metaMaintenanceUpdatedTemplate ||
          "maintenance_report_updated",
      },
    });
  } catch (error) {
    return handleApiError(error, "GET /api/admin/settings/notifications");
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireSession(["admin"] as Role[]);

    const csrfResult = validateCsrfToken(req);
    if (!csrfResult.success) return csrfResult.error!;

    const body = await req.json();
    const validated = notificationSchema.parse(body);

    const settings = await upsertNotificationSettings({
      resendApiKey: validated.resendApiKey,
      resendFromEmail: validated.resendFromEmail,
      metaAccessToken: validated.metaAccessToken,
      metaPhoneNumberId: validated.metaPhoneNumberId,
      metaMaintenanceCreatedTemplate: validated.metaMaintenanceCreatedTemplate,
      metaMaintenanceUpdatedTemplate: validated.metaMaintenanceUpdatedTemplate,
    });

    return ok({
      email: {
        configured: Boolean(settings.resendApiKey),
        sender: settings.resendFromEmail || "KonkosYuk <onboarding@resend.dev>",
      },
      whatsapp: {
        configured: Boolean(
          settings.metaAccessToken && settings.metaPhoneNumberId,
        ),
        createdTemplate:
          settings.metaMaintenanceCreatedTemplate ||
          "maintenance_report_created",
        updatedTemplate:
          settings.metaMaintenanceUpdatedTemplate ||
          "maintenance_report_updated",
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail(error.issues[0]?.message || "Input tidak valid", 400);
    }
    return handleApiError(error, "POST /api/admin/settings/notifications");
  }
}
