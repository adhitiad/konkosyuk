import { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { validateMutationCsrf } from "@/lib/api-auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { z } from "zod";
import type { Role } from "@/lib/auth";

const updateUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  role: z.enum(["cust", "owner", "staff", "admin"]).optional(),
  isActive: z.boolean().optional(),
  isBanned: z.boolean().optional(),
  phone: z.string().nullable().optional(),
  whatsapp: z.string().nullable().optional(),
  telegram: z.string().nullable().optional(),
  district: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  province: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
});

const staffAllowedFields = [
  "name",
  "email",
  "phone",
  "whatsapp",
  "telegram",
  "district",
  "city",
  "province",
  "image",
] as const;

function sanitizeUpdateBody(
  body: z.infer<typeof updateUserSchema>,
  requesterRole: string,
  targetRole: string,
) {
  if (requesterRole === "admin") {
    return body;
  }

  if (targetRole !== "cust") {
    return fail("Forbidden - staff can only edit cust users", 403);
  }

  const updateData: Record<string, unknown> = {};
  for (const key of staffAllowedFields) {
    const value = body[key as keyof typeof body];
    if (value !== undefined) {
      updateData[key] = value;
    }
  }

  return updateData;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const csrfError = validateMutationCsrf(req);
    if (csrfError) return csrfError;
    const session = await requireSession(["admin", "staff"] as Role[]);
    const { id: userId } = await params;
    const body = updateUserSchema.parse(await req.json());

    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!existing) {
      return fail("User not found", 404);
    }

    const updateData = sanitizeUpdateBody(body, session.user.role, existing.role);
    if (updateData instanceof Response) return updateData;

    if (session.user.role === "staff" && existing.id === session.user.id) {
      if (body.role && body.role !== existing.role) {
        return fail("Staff cannot change their own role", 403);
      }
    }

    const [updated] = await db
      .update(users)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    return ok(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const csrfError = validateMutationCsrf(req);
    if (csrfError) return csrfError;
    const session = await requireSession(["admin", "staff"] as Role[]);
    const { id: userId } = await params;
    const body = updateUserSchema.parse(await req.json());

    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!existing) {
      return fail("User not found", 404);
    }

    const updateData = sanitizeUpdateBody(body, session.user.role, existing.role);
    if (updateData instanceof Response) return updateData;

    if (session.user.role === "staff" && existing.id === session.user.id) {
      if (body.role && body.role !== existing.role) {
        return fail("Staff cannot change their own role", 403);
      }
    }

    const [updated] = await db
      .update(users)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    return ok(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireSession(["admin", "staff"] as Role[]);
    const { id: userId } = await params;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return fail("User not found", 404);
    }

    return ok(user);
  } catch (error) {
    return handleApiError(error);
  }
}
