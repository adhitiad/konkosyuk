"use server";

import { db } from "@/db";
import { savedSearches } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";

const createSavedSearchSchema = z.object({
  name: z.string().optional(),
  filters: z.record(z.string(), z.unknown()),
});

export type ActionState = {
  success?: boolean;
  error?: string;
  data?: unknown;
};

export async function createSavedSearch(
  _prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { error: "Tidak terotorisasi", success: false };
    }

    const validated = createSavedSearchSchema.parse({
      name: formData.get("name"),
      filters: formData.get("filters"),
    });

    const filters = validated.filters as Record<string, unknown>;

    if (Array.isArray(filters)) {
      return { error: "Filter harus berupa object", success: false };
    }

    const [savedSearch] = await db
      .insert(savedSearches)
      .values({
        userId: session.user.id,
        name: validated.name || null,
        filters,
      })
      .returning();

    return { success: true, data: savedSearch };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: error.issues[0]?.message || "Input tidak valid",
        success: false,
      };
    }
    return { error: "Gagal menyimpan pencarian", success: false };
  }
}

export async function getSavedSearches() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { error: "Tidak terotorisasi", success: false };
    }

    const data = await db
      .select()
      .from(savedSearches)
      .where(eq(savedSearches.userId, session.user.id))
      .orderBy(desc(savedSearches.createdAt));

    return { success: true, data };
  } catch {
    return { error: "Gagal mengambil pencarian tersimpan", success: false };
  }
}

export async function deleteSavedSearch(id: string): Promise<ActionState> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { error: "Tidak terotorisasi", success: false };
    }

    await db
      .delete(savedSearches)
      .where(
        and(
          eq(savedSearches.id, id),
          eq(savedSearches.userId, session.user.id),
        ),
      );

    return { success: true };
  } catch {
    return { error: "Gagal menghapus pencarian", success: false };
  }
}

export async function toggleSavedSearchActive(
  id: string,
): Promise<ActionState> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { error: "Tidak terotorisasi", success: false };
    }

    const [existing] = await db
      .select()
      .from(savedSearches)
      .where(
        and(
          eq(savedSearches.id, id),
          eq(savedSearches.userId, session.user.id),
        ),
      )
      .limit(1);

    if (!existing) {
      return { error: "Pencarian tidak ditemukan", success: false };
    }

    const [updated] = await db
      .update(savedSearches)
      .set({ isActive: !existing.isActive, updatedAt: new Date() })
      .where(eq(savedSearches.id, id))
      .returning();

    return { success: true, data: { isActive: updated.isActive } };
  } catch {
    return { error: "Gagal memperbarui status pencarian", success: false };
  }
}
