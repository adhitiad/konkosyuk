import { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { validateMutationCsrf } from "@/lib/api-auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { z } from "zod";
import type { Role } from "@/lib/auth";

const updateProfileSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter").max(255),
  phone: z.string().min(1, "Nomor telepon wajib diisi").max(20),
});

export async function PATCH(req: NextRequest) {
  try {
    const csrfError = validateMutationCsrf(req);
    if (csrfError) return csrfError;
    const session = await requireSession();
    const body = updateProfileSchema.parse(await req.json());

    const [updated] = await db
      .update(users)
      .set({
        name: body.name,
        phone: body.phone,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id))
      .returning();

    return ok({
      message: "Profil berhasil diperbarui",
      user: updated,
    });
  } catch (error) {
    return handleApiError(error, "PATCH /api/auth/update-profile");
  }
}
