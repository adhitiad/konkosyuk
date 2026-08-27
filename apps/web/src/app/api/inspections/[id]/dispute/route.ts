import { NextRequest } from "next/server";
import { db } from "@/db";
import { inspections, properties } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { dispatchNotification } from "@/lib/notification-client";
import { logError } from "@/lib/logger";

const disputeInspectionSchema = z.object({
  disputeReason: z.string().min(1, "Alasan sengketa harus diisi"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const body = disputeInspectionSchema.parse(await req.json());

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

    if (!property) {
      return fail("Properti tidak ditemukan", 404);
    }

    if (
      session.user.role === "cust" &&
      inspection.performedBy !== session.user.id
    ) {
      return fail("Forbidden", 403);
    }

    if (session.user.role === "owner" && property.ownerId !== session.user.id) {
      return fail("Forbidden", 403);
    }

    const [updated] = await db
      .update(inspections)
      .set({
        isDisputed: true,
        disputeReason: body.disputeReason,
        status: "disputed",
      })
      .where(eq(inspections.id, id))
      .returning();

    const notifyUserId =
      session.user.role === "cust" ? property.ownerId : inspection.performedBy;

    if (notifyUserId && notifyUserId !== session.user.id) {
      dispatchNotification({
        userId: notifyUserId,
        type: "inspection_disputed",
        category: "inspection",
        priority: "high",
        title: "Inspeksi Di-dispute",
        message: `Inspeksi ${inspection.type === "move_in" ? "move-in" : inspection.type === "move_out" ? "move-out" : "mid-stay"} sedang di-dispute.`,
        actionUrl:
          session.user.role === "owner"
            ? "/owner/inspections"
            : "/dashboard/inspections",
        referenceId: inspection.id,
        referenceType: "inspection",
      }).catch((err) =>
        logError(err, "Failed to dispatch inspection disputed notification"),
      );
    }

    return ok(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail(error.issues[0]?.message || "Input tidak valid", 400);
    }
    return handleApiError(error, "POST /api/inspections/[id]/dispute");
  }
}
