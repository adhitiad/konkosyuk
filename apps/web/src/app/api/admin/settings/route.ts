import { NextRequest } from "next/server";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { validateAdminOnlyRequest } from "@/lib/api-auth";
import { validateCsrfToken } from "@/lib/csrf";
import { ok, fail, handleApiError } from "@/lib/api";
import { z } from "zod";

const settingSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
  isSecret: z.boolean().default(false),
  description: z.string().optional(),
});

export async function GET() {
  try {
    const authResult = await validateAdminOnlyRequest(new NextRequest("http://localhost"));
    if (authResult instanceof Response) return authResult;

    const settings = await db
      .select()
      .from(appSettings)
      .orderBy(appSettings.key);
    return ok({ data: settings });
  } catch (error) {
    return handleApiError(error, "GET /api/admin/settings");
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await validateAdminOnlyRequest(req);
    if (authResult instanceof Response) return authResult;

    const csrfResult = validateCsrfToken(req);
    if (!csrfResult.success) return csrfResult.error!;

    const body = await req.json();
    const validated = settingSchema.parse(body);

    const [setting] = await db
      .insert(appSettings)
      .values({
        key: validated.key,
        value: validated.value,
        isSecret: validated.isSecret,
        description: validated.description ?? null,
      })
      .onConflictDoUpdate({
        target: appSettings.key,
        set: {
          value: validated.value,
          isSecret: validated.isSecret,
          description: validated.description ?? null,
          updatedAt: new Date(),
        },
      })
      .returning();

    return ok({ data: setting });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail(error.issues[0]?.message || "Input tidak valid", 400);
    }
    return handleApiError(error, "POST /api/admin/settings");
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authResult = await validateAdminOnlyRequest(req);
    if (authResult instanceof Response) return authResult;

    const csrfResult = validateCsrfToken(req);
    if (!csrfResult.success) return csrfResult.error!;

    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    if (!key) {
      return fail("Key is required", 400);
    }

    await db.delete(appSettings).where(eq(appSettings.key, key));
    return ok({ success: true });
  } catch (error) {
    return handleApiError(error, "DELETE /api/admin/settings");
  }
}
