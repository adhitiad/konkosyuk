import { NextRequest } from "next/server";
import { db } from "@/db";
import { savedSearches } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { z } from "zod";

const createSavedSearchSchema = z.object({
  name: z.string().optional(),
  filters: z.record(z.string(), z.unknown()),
});

export async function GET() {
  try {
    const session = await requireSession(["cust", "owner", "admin", "staff"]);

    const data = await db
      .select()
      .from(savedSearches)
      .where(eq(savedSearches.userId, session.user.id))
      .orderBy(desc(savedSearches.createdAt));

    return ok(data);
  } catch (error) {
    return handleApiError(error, "GET /api/saved-searches");
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(["cust", "owner", "admin", "staff"]);

    const body = await req.json();
    const validated = createSavedSearchSchema.parse(body);

    const filters = validated.filters as Record<string, unknown>;

    if (Array.isArray(filters)) {
      return fail("Filter harus berupa object", 422);
    }

    const [savedSearch] = await db
      .insert(savedSearches)
      .values({
        userId: session.user.id,
        name: validated.name || null,
        filters,
      })
      .returning();

    return ok(savedSearch, 201);
  } catch (error) {
    return handleApiError(error, "POST /api/saved-searches");
  }
}
