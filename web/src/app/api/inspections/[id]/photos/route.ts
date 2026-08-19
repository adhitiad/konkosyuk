import { NextRequest } from "next/server";
import { db } from "@/db";
import { inspectionPhotos, inspections, properties } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import type { Role } from "@/lib/auth";

const createPhotoSchema = z.object({
  itemId: z.string().uuid().optional().nullable(),
  type: z.enum(["overview", "damage", "receipt", "document"]),
  url: z.string().url(),
  caption: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(
  req: NextRequest,
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

    if (session.user.role === "cust" && inspection.performedBy !== session.user.id) {
      return fail("Forbidden", 403);
    }

    if (session.user.role === "owner" && property.ownerId !== session.user.id) {
      return fail("Forbidden", 403);
    }

    const photos = await db
      .select()
      .from(inspectionPhotos)
      .where(eq(inspectionPhotos.inspectionId, id))
      .orderBy(desc(inspectionPhotos.createdAt));

    return ok(photos);
  } catch (error) {
    return handleApiError(error, "GET /api/inspections/[id]/photos");
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession(["owner", "admin", "staff"] as Role[]);
    const { id } = await params;
    const body = createPhotoSchema.parse(await req.json());

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

    if (!property || (session.user.role === "owner" && property.ownerId !== session.user.id)) {
      return fail("Forbidden", 403);
    }

    const [photo] = await db
      .insert(inspectionPhotos)
      .values({
        inspectionId: id,
        itemId: body.itemId,
        type: body.type,
        url: body.url,
        caption: body.caption,
        metadata: body.metadata ?? {},
      })
      .returning();

    return ok(photo, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail(error.issues[0]?.message || "Input tidak valid", 400);
    }
    return handleApiError(error, "POST /api/inspections/[id]/photos");
  }
}
