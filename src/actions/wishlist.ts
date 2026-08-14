"use server";

import { db } from "@/db";
import { favorites, properties } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";

const toggleWishlistSchema = z.object({
  propertyId: z.string().uuid(),
});

export type ToggleWishlistState = {
  success?: boolean;
  error?: string;
  favorited?: boolean;
};

export async function toggleWishlist(
  prevState: ToggleWishlistState | undefined,
  formData: FormData,
): Promise<ToggleWishlistState> {
  try {
    const validated = toggleWishlistSchema.parse({
      propertyId: formData.get("propertyId"),
    });

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { error: "Tidak terotorisasi", success: false };
    }

    const [existing] = await db
      .select()
      .from(favorites)
      .where(
        and(
          eq(favorites.userId, session.user.id),
          eq(favorites.propertyId, validated.propertyId),
        ),
      )
      .limit(1);

    if (existing) {
      await db
        .delete(favorites)
        .where(
          and(
            eq(favorites.userId, session.user.id),
            eq(favorites.propertyId, validated.propertyId),
          ),
        );

      return { success: true, favorited: false };
    }

    await db.insert(favorites).values({
      userId: session.user.id,
      propertyId: validated.propertyId,
    });

    return { success: true, favorited: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message || "Input tidak valid", success: false };
    }
    return { error: "Gagal memperbarui favorit", success: false };
  }
}

export async function getFavorites() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { error: "Tidak terotorisasi", success: false };
    }

    const data = await db
      .select({
        id: favorites.id,
        propertyId: favorites.propertyId,
        createdAt: favorites.createdAt,
        propertyName: properties.name,
        propertyAddress: properties.address,
        propertyType: properties.type,
        propertyBasePrice: properties.basePrice,
        propertyImages: properties.images,
      })
      .from(favorites)
      .leftJoin(properties, eq(favorites.propertyId, properties.id))
      .where(eq(favorites.userId, session.user.id))
      .orderBy(desc(favorites.createdAt));

    return { success: true, data, meta: { total: data.length } };
  } catch (error) {
    return { error: "Gagal mengambil favorit", success: false };
  }
}
