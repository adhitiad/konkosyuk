import { NextRequest } from "next/server";
import { db } from "@/db";
import { users, accounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { validateAdminOnlyRequest } from "@/lib/api-auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { z } from "zod";
import { hashPassword } from "better-auth/crypto";
import { createAuditLog } from "@/lib/audit-log";

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  email: z.string().email("Invalid email format"),
  role: z.enum(["cust", "owner", "admin", "staff"]).default("cust"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  image: z.string().url().optional().or(z.literal("")),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  telegram: z.string().optional(),
  province: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  isActive: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  try {
    const authResult = await validateAdminOnlyRequest(req);
    if (authResult instanceof Response) return authResult;
    const { session } = authResult;
    const body = createUserSchema.parse(await req.json());

    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, body.email))
      .limit(1);

    if (existing) {
      return fail("Email already exists", 400);
    }

    const [newUser] = await db
      .insert(users)
      .values({
        name: body.name,
        email: body.email,
        role: body.role,
        image: body.image || null,
        phone: body.phone || null,
        whatsapp: body.whatsapp || null,
        telegram: body.telegram || null,
        province: body.province || null,
        city: body.city || null,
        district: body.district || null,
        isActive: body.isActive,
      })
      .returning();

    const hashedPassword = await hashPassword(body.password);

    await db.insert(accounts).values({
      id: crypto.randomUUID(),
      userId: newUser.id,
      accountId: body.email,
      providerId: "email",
      password: hashedPassword,
    });

    await createAuditLog({
      action: "create",
      targetType: "user",
      targetId: newUser.id,
      adminId: session.user.id,
      details: {
        email: newUser.email,
        role: newUser.role,
        isActive: newUser.isActive,
      },
    });

    return ok({ user: newUser });
  } catch (error) {
    return handleApiError(error, "POST /api/admin/users");
  }
}
