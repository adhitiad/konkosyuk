import { NextRequest } from "next/server";
import { db } from "@/db";
import { inspections, properties } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import type { Role } from "@/lib/auth";
import { dispatchNotification } from "@/lib/notification-client";
import { logError } from "@/lib/logger";

const completeInspectionSchema = z.object({
  overallCondition: z.enum(["excellent", "good", "fair", "poor", "damaged"]),
  notes: z.string().optional().nullable(),
  damageScore: z.coerce.number().min(0).max(100).default(0),
  estimatedRepairCost: z.coerce.number().nonnegative().default(0),
  securityDeposit: z.coerce.number().nonnegative().default(0),
  refundAmount: z.coerce.number().nonnegative().default(0),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession(["owner", "admin", "staff"] as Role[]);
    const { id } = await params;
    const body = completeInspectionSchema.parse(await req.json());

    const [inspection] = await db
      .select()
      .from(inspections)
      .where(eq(inspections.id, id))
      .limit(1);

    if (!inspection) {
      return fail("Inspeksi tidak ditemukan", 404);
    }

    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, inspection.propertyId))
      .limit(1);

    if (
      !property ||
      (session.user.role === "owner" && property.ownerId !== session.user.id)
    ) {
      return fail("Forbidden", 403);
    }

    const finalStatus = "completed";

    const [updated] = await db
      .update(inspections)
      .set({
        status: finalStatus,
        overallCondition: body.overallCondition,
        notes: body.notes,
        damageScore: sql`${body.damageScore}`,
        estimatedRepairCost: sql`${body.estimatedRepairCost}`,
        securityDeposit: sql`${body.securityDeposit}`,
        refundAmount: sql`${body.refundAmount}`,
        completedAt: sql`now()`,
      })
      .where(eq(inspections.id, id))
      .returning();

    if (inspection.performedBy && inspection.performedBy !== session.user.id) {
      dispatchNotification({
        userId: inspection.performedBy,
        type: "inspection_completed",
        category: "inspection",
        priority: "normal",
        title: "Inspeksi Selesai",
        message: `Inspeksi ${inspection.type === "move_in" ? "move-in" : inspection.type === "move_out" ? "move-out" : "mid-stay"} telah selesai.`,
        actionUrl: "/dashboard/inspections",
        referenceId: inspection.id,
        referenceType: "inspection",
      }).catch((err) =>
        logError(err, "Failed to dispatch inspection completed notification"),
      );
    }

    return ok(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail(error.issues[0]?.message || "Input tidak valid", 400);
    }
    return handleApiError(error, "POST /api/inspections/[id]/complete");
  }
}
