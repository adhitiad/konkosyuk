import { NextRequest } from "next/server";
import { db } from "@/db";
import { inspectionItems, inspections, properties } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import type { Role } from "@/lib/auth";

const createInspectionItemSchema = z.object({
  category: z.enum([
    "furniture",
    "electrical",
    "plumbing",
    "walls",
    "floor",
    "doors_windows",
    "ac",
    "kitchen",
    "bathroom",
    "other",
  ]),
  itemName: z.string().min(1),
  condition: z
    .enum(["excellent", "good", "fair", "poor", "damaged", "missing"])
    .optional(),
  notes: z.string().optional().nullable(),
  repairCost: z.coerce.number().nonnegative().optional(),
  photoUrls: z.array(z.string().url()).default([]),
  isNewDamage: z.boolean().default(false),
});

const updateInspectionItemSchema = createInspectionItemSchema.partial().extend({
  itemId: z.string().uuid(),
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

    return ok(items);
  } catch (error) {
    return handleApiError(error, "GET /api/inspections/[id]/items");
  }
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession(["owner", "admin", "staff"] as Role[]);
    const { id } = await params;
    const body = createInspectionItemSchema.parse(await req.json());

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

    const [item] = await db
      .insert(inspectionItems)
      .values({
        inspectionId: id,
        category: body.category,
        itemName: body.itemName,
        condition: body.condition,
        notes: body.notes,
        repairCost: body.repairCost ? sql`${body.repairCost}` : null,
        photoUrls: body.photoUrls,
        isNewDamage: body.isNewDamage,
      })
      .returning();

    return ok(item, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail(error.issues[0]?.message || "Input tidak valid", 400);
    }
    return handleApiError(error, "POST /api/inspections/[id]/items");
  }
}

export async function PUT(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession(["owner", "admin", "staff"] as Role[]);
    const { id } = await params;
    const body = updateInspectionItemSchema.parse(await req.json());

    const { itemId, ...updates } = body;

    if (!itemId) {
      return fail("itemId wajib diisi", 400);
    }

    const [item] = await db
      .select()
      .from(inspectionItems)
      .where(eq(inspectionItems.id, itemId))
      .limit(1);

    if (!item || item.inspectionId !== id) {
      return fail("Item inspeksi tidak ditemukan", 404);
    }

    const [inspection] = await db
      .select()
      .from(inspections)
      .where(eq(inspections.id, id))
      .limit(1);

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

    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.itemName !== undefined) updateData.itemName = updates.itemName;
    if (updates.condition !== undefined)
      updateData.condition = updates.condition;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.repairCost !== undefined)
      updateData.repairCost = sql`${updates.repairCost}`;
    if (updates.photoUrls !== undefined)
      updateData.photoUrls = updates.photoUrls;
    if (updates.isNewDamage !== undefined)
      updateData.isNewDamage = updates.isNewDamage;

    const [updated] = await db
      .update(inspectionItems)
      .set(updateData)
      .where(eq(inspectionItems.id, itemId))
      .returning();

    return ok(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail(error.issues[0]?.message || "Input tidak valid", 400);
    }
    return handleApiError(error, "PUT /api/inspections/[id]/items");
  }
}
