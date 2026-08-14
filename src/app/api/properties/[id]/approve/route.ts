import { NextRequest } from "next/server";
import { db } from "@/db";
import { properties, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { validateAdminRequest } from "@/lib/api-auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { z } from "zod";
import type { Role } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit-log";

const approvePropertySchema = z.object({
  isActive: z.boolean(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await validateAdminRequest(req);
    if (authResult instanceof Response) return authResult;
    const { session, ipAddress, userAgent } = authResult;
    const { id: propertyId } = await params;
    const body = approvePropertySchema.parse(await req.json());

    const [existing] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, propertyId))
      .limit(1);

    if (!existing) {
      return fail("Property not found", 404);
    }

    const [updated] = await db
      .update(properties)
      .set({
        isActive: body.isActive,
        updatedAt: new Date(),
      })
      .where(eq(properties.id, propertyId))
      .returning();

    if (body.isActive) {
      await db.insert(notifications).values({
        id: crypto.randomUUID(),
        userId: existing.ownerId,
        title: "Properti Disetujui",
        message: `Properti "${existing.name}" telah disetujui dan kini aktif di platform.`,
        type: "system",
        isRead: false,
      });
    }

    await createAuditLog({
      action: body.isActive ? "approve" : "reject",
      targetType: "property",
      targetId: propertyId,
      adminId: session.user.id,
      details: {
        propertyName: existing.name,
        isActive: body.isActive,
      },
    });

    return ok(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
