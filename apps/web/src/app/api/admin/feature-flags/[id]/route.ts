import { NextRequest } from "next/server";
import { db } from "@/db";
import { featureFlags } from "@/db/schema";
import { validateAdminRequest } from "@/lib/api-auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { z } from "zod";
import { eq } from "drizzle-orm";

const updateFeatureFlagSchema = z.object({
  key: z.string().min(1).max(100).optional(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  enabled: z.boolean().optional(),
  rolloutPercentage: z.coerce.number().int().min(0).max(100).optional(),
  allowedRoles: z.array(z.string()).optional(),
  allowedUsers: z.array(z.string().uuid()).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await validateAdminRequest(req);

    const { id } = await params;
    const [flag] = await db
      .select()
      .from(featureFlags)
      .where(eq(featureFlags.id, id))
      .limit(1);

    if (!flag) {
      return fail("Feature flag not found", 404);
    }

    return ok(flag);
  } catch (error) {
    return handleApiError(error, "GET /api/admin/feature-flags/[id]");
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await validateAdminRequest(req);

    const { id } = await params;
    const body = await req.json();
    const parsed = updateFeatureFlagSchema.parse(body);

    const [flag] = await db
      .update(featureFlags)
      .set(parsed)
      .where(eq(featureFlags.id, id))
      .returning();

    if (!flag) {
      return fail("Feature flag not found", 404);
    }

    return ok(flag);
  } catch (error) {
    return handleApiError(error, "PUT /api/admin/feature-flags/[id]");
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await validateAdminRequest(req);

    const { id } = await params;
    await db.delete(featureFlags).where(eq(featureFlags.id, id));

    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error, "DELETE /api/admin/feature-flags/[id]");
  }
}
