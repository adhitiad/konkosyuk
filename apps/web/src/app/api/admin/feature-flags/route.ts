import { NextRequest } from "next/server";
import { db } from "@/db";
import { featureFlags } from "@/db/schema";
import { validateAdminRequest } from "@/lib/api-auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { z } from "zod";
import { eq } from "drizzle-orm";

const createFeatureFlagSchema = z.object({
  key: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  enabled: z.boolean().default(false),
  rolloutPercentage: z.coerce.number().int().min(0).max(100).default(100),
  allowedRoles: z.array(z.string()).default([]),
  allowedUsers: z.array(z.string().uuid()).default([]),
});

export async function GET(req: NextRequest) {
  try {
    await validateAdminRequest(req);

    const flags = await db
      .select()
      .from(featureFlags)
      .orderBy(featureFlags.createdAt);

    return ok(flags);
  } catch (error) {
    return handleApiError(error, "GET /api/admin/feature-flags");
  }
}

export async function POST(req: NextRequest) {
  try {
    await validateAdminRequest(req);

    const body = await req.json();
    const parsed = createFeatureFlagSchema.parse(body);

    const existing = await db
      .select()
      .from(featureFlags)
      .where(eq(featureFlags.key, parsed.key))
      .limit(1);
    if (existing.length > 0) {
      return fail("Feature flag key already exists", 409);
    }

    const [flag] = await db.insert(featureFlags).values(parsed).returning();

    return ok(flag, 201);
  } catch (error) {
    return handleApiError(error, "POST /api/admin/feature-flags");
  }
}
