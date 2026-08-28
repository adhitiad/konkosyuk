import { NextRequest } from "next/server";
import { db } from "@/db";
import {
  inspections,
  inspectionItems,
  inspectionPhotos,
  damageReports,
  properties,
} from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import type { Role } from "@/lib/auth";

const updateInspectionSchema = z.object({
  status: z.string().optional(),
  overallCondition: z.string().optional(),
  notes: z.string().optional().nullable(),
  damageScore: z.coerce.number().min(0).max(100).optional(),
  estimatedRepairCost: z.coerce.number().nonnegative().optional(),
  securityDeposit: z.coerce.number().nonnegative().optional(),
  refundAmount: z.coerce.number().nonnegative().optional(),
  isDisputed: z.boolean().optional(),
  disputeReason: z.string().optional().nullable(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    const { id } = await params;

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

    const items = await db
      .select()
      .from(inspectionItems)
      .where(eq(inspectionItems.inspectionId, id))
      .orderBy(desc(inspectionItems.createdAt));

    const photos = await db
      .select()
      .from(inspectionPhotos)
      .where(eq(inspectionPhotos.inspectionId, id))
      .orderBy(desc(inspectionPhotos.createdAt));

    const reports = await db
      .select()
      .from(damageReports)
      .where(eq(damageReports.inspectionId, id))
      .orderBy(desc(damageReports.createdAt));

    return ok({
      ...inspection,
      items,
      photos,
      damageReports: reports,
    });
  } catch (error) {
    return handleApiError(error, "GET /api/inspections/[id]");
  }
}

export async function PUT(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession(["owner", "admin", "staff"] as Role[]);
    const { id } = await params;
    const body = updateInspectionSchema.parse(await req.json());

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

    const updateData: Record<string, unknown> = {};

    if (body.status !== undefined) updateData.status = body.status;
    if (body.overallCondition !== undefined)
      updateData.overallCondition = body.overallCondition;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.damageScore !== undefined)
      updateData.damageScore = sql`${body.damageScore}`;
    if (body.estimatedRepairCost !== undefined)
      updateData.estimatedRepairCost = sql`${body.estimatedRepairCost}`;
    if (body.securityDeposit !== undefined)
      updateData.securityDeposit = sql`${body.securityDeposit}`;
    if (body.refundAmount !== undefined)
      updateData.refundAmount = sql`${body.refundAmount}`;
    if (body.isDisputed !== undefined) updateData.isDisputed = body.isDisputed;
    if (body.disputeReason !== undefined)
      updateData.disputeReason = body.disputeReason;

    if (
      body.status === "completed" ||
      body.status === "move_in_done" ||
      body.status === "move_out_done"
    ) {
      updateData.completedAt = sql`now()`;
    }

    const [updated] = await db
      .update(inspections)
      .set(updateData)
      .where(eq(inspections.id, id))
      .returning();

    return ok(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail(error.issues[0]?.message || "Input tidak valid", 400);
    }
    return handleApiError(error, "PUT /api/inspections/[id]");
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession(["owner", "admin", "staff"] as Role[]);
    const { id } = await params;

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

    await db.delete(inspections).where(eq(inspections.id, id));

    return ok({ success: true });
  } catch (error) {
    return handleApiError(error, "DELETE /api/inspections/[id]");
  }
}
