import { NextRequest } from "next/server";
import { db } from "@/db";
import { maintenanceTickets, units, properties } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { validateMutationCsrf } from "@/lib/api-auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { z } from "zod";

const updateTicketSchema = z.object({
  status: z
    .enum(["reported", "in_progress", "resolved", "cancelled"])
    .optional(),
  ownerNotes: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const [ticket] = await db
      .select({
        id: maintenanceTickets.id,
        unitId: maintenanceTickets.unitId,
        tenantId: maintenanceTickets.tenantId,
        title: maintenanceTickets.title,
        description: maintenanceTickets.description,
        images: maintenanceTickets.images,
        priority: maintenanceTickets.priority,
        status: maintenanceTickets.status,
        ownerNotes: maintenanceTickets.ownerNotes,
        createdAt: maintenanceTickets.createdAt,
        updatedAt: maintenanceTickets.updatedAt,
        unitName: units.name,
        propertyName: properties.name,
      })
      .from(maintenanceTickets)
      .leftJoin(units, eq(maintenanceTickets.unitId, units.id))
      .leftJoin(properties, eq(units.propertyId, properties.id))
      .where(eq(maintenanceTickets.id, id))
      .limit(1);

    if (!ticket) {
      return fail("Ticket not found", 404);
    }

    if (session.user.role === "cust" && ticket.tenantId !== session.user.id) {
      return fail("Forbidden", 403);
    }

    return ok(ticket);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const csrfError = validateMutationCsrf(req);
    if (csrfError) return csrfError;
    const session = await requireSession(["owner", "admin"]);
    const { id } = await params;
    const body = updateTicketSchema.parse(await req.json());

    const [ticket] = await db
      .select()
      .from(maintenanceTickets)
      .where(eq(maintenanceTickets.id, id))
      .limit(1);

    if (!ticket) {
      return fail("Ticket not found", 404);
    }

    if (session.user.role === "owner") {
      const [unit] = await db
        .select()
        .from(units)
        .where(eq(units.id, ticket.unitId))
        .limit(1);

      if (!unit) {
        return fail("Unit not found", 404);
      }

      const [property] = await db
        .select()
        .from(properties)
        .where(eq(properties.id, unit.propertyId))
        .limit(1);

      if (!property || property.ownerId !== session.user.id) {
        return fail("Forbidden", 403);
      }
    }

    const updateData: Record<string, unknown> = {};
    if (body.status) updateData.status = body.status;
    if (body.ownerNotes !== undefined) updateData.ownerNotes = body.ownerNotes;
    if (body.priority) updateData.priority = body.priority;

    const [updated] = await db
      .update(maintenanceTickets)
      .set(updateData)
      .where(eq(maintenanceTickets.id, id))
      .returning();

    return ok(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
