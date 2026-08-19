import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  maintenanceReports,
  notifications,
  properties,
  users,
} from "@/db/schema";
import { requireSession, type Role } from "@/lib/auth";
import { validateMutationCsrf } from "@/lib/api-auth";
import { fail, handleApiError, ok } from "@/lib/api";
import { sendMaintenanceReportUpdatedEmail } from "@/lib/notifications/email";
import { sendMaintenanceWhatsApp } from "@/lib/notifications/whatsapp";

const updateSchema = z.object({
  status: z.enum(["pending", "in_progress", "resolved", "rejected"]),
  resolutionNote: z.string().trim().max(2000).nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const csrfError = validateMutationCsrf(req);
    if (csrfError) return csrfError;
    const session = await requireSession(["owner", "admin"] as Role[]);
    const { id } = await params;
    const body = updateSchema.parse(await req.json());
    const [report] = await db
      .select({
        id: maintenanceReports.id,
        tenantId: maintenanceReports.tenantId,
        propertyOwnerId: properties.ownerId,
        tenantName: users.name,
        tenantEmail: users.email,
        tenantPhone: users.phone,
        tenantWhatsapp: users.whatsapp,
      })
      .from(maintenanceReports)
      .innerJoin(properties, eq(maintenanceReports.propertyId, properties.id))
      .innerJoin(users, eq(maintenanceReports.tenantId, users.id))
      .where(eq(maintenanceReports.id, id))
      .limit(1);
    if (!report) return fail("Laporan tidak ditemukan", 404);
    if (
      session.user.role === "owner" &&
      report.propertyOwnerId !== session.user.id
    )
      return fail("Forbidden", 403);

    const [updated] = await db
      .update(maintenanceReports)
      .set({
        status: body.status,
        resolutionNote: body.resolutionNote ?? null,
        updatedAt: new Date(),
      })
      .where(eq(maintenanceReports.id, id))
      .returning();
    await db.insert(notifications).values({
      userId: report.tenantId,
      title: "Status Laporan Diperbarui",
      message: `Status laporan Anda sekarang: ${body.status}.`,
      type: "report",
      referenceId: id,
    });
    await Promise.allSettled([
      report.tenantEmail
        ? sendMaintenanceReportUpdatedEmail(
            report.tenantEmail,
            report.tenantName,
            body.status,
            body.resolutionNote,
          )
        : Promise.resolve(),
      report.tenantPhone || report.tenantWhatsapp
        ? sendMaintenanceWhatsApp(
            report.tenantPhone || report.tenantWhatsapp || "",
            process.env.META_MAINTENANCE_UPDATED_TEMPLATE ||
              "maintenance_report_updated",
            [report.tenantName, body.status, body.resolutionNote || "-"],
          )
        : Promise.resolve(),
    ]);
    return ok(updated);
  } catch (error) {
    return handleApiError(error, "PATCH /api/reports/[id]");
  }
}
