import { NextRequest } from "next/server";
import { db } from "@/db";
import { properties, bookings } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { validateAdminOnlyRequest } from "@/lib/api-auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { z } from "zod";
import type { Role } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit-log";

const updatePropertySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  address: z.string().min(1).max(500).optional(),
  type: z.enum(["kost", "kontrakan", "ruko"]).optional(),
  city: z.string().optional(),
  basePrice: z.string().optional(),
  packages: z.any().optional(),
  status: z.enum(["aktif", "nonaktif"]).optional(),
  amenities: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  isActive: z.boolean().optional(),
  gpsVerified: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await validateAdminOnlyRequest(req);
    if (authResult instanceof Response) return authResult;
    const { session, ipAddress, userAgent } = authResult;
    const { id: propertyId } = await params;
    const body = updatePropertySchema.parse(await req.json());

    const [existing] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, propertyId))
      .limit(1);

    if (!existing) {
      return fail("Property not found", 404);
    }

    const isAdmin = session.user.role === "admin";
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.basePrice !== undefined) updateData.basePrice = body.basePrice;
    if (body.packages !== undefined) updateData.packages = body.packages;
    if (body.amenities !== undefined) updateData.amenities = body.amenities;
    if (body.metadata !== undefined) updateData.metadata = body.metadata;
    if (body.latitude !== undefined) updateData.latitude = body.latitude;
    if (body.longitude !== undefined) updateData.longitude = body.longitude;

    if (isAdmin) {
      if (body.status !== undefined) updateData.status = body.status;
      if (body.isActive !== undefined) updateData.isActive = body.isActive;
      if (body.gpsVerified !== undefined)
        updateData.gpsVerified = body.gpsVerified;
    }

    updateData.updatedAt = new Date();

    const [updated] = await db
      .update(properties)
      .set(updateData as any)
      .where(eq(properties.id, propertyId))
      .returning();

    await createAuditLog({
      action: "update",
      targetType: "property",
      targetId: propertyId,
      adminId: session.user.id,
      details: {
        changes: updateData,
        propertyName: existing.name,
      },
    });

    return ok(updated);
  } catch (error) {
    return handleApiError(error, "PATCH /api/admin/properties/[id]");
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await validateAdminOnlyRequest(req);
    if (authResult instanceof Response) return authResult;
    const { session, ipAddress, userAgent } = authResult;
    const { id: propertyId } = await params;

    const [existing] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, propertyId))
      .limit(1);

    if (!existing) {
      return fail("Property not found", 404);
    }

    const activeBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.propertyId, propertyId),
          inArray(bookings.status, ["confirmed", "awaiting_full_payment"]),
        ),
      )
      .limit(1);

    if (activeBookings.length > 0) {
      return fail("Cannot delete property with active bookings", 400);
    }

    await db.delete(properties).where(eq(properties.id, propertyId));

    await createAuditLog({
      action: "delete",
      targetType: "property",
      targetId: propertyId,
      adminId: session.user.id,
      details: {
        propertyName: existing.name,
        propertyAddress: existing.address,
      },
    });

    return ok({ success: true });
  } catch (error) {
    return handleApiError(error, "DELETE /api/admin/properties/[id]");
  }
}
