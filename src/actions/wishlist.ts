"use server";

import { db } from "@/db";
import { wishlists, properties } from "@/db/schema";
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
      return { error: "Unauthorized", success: false };
    }

    const [existing] = await db
      .select()
      .from(wishlists)
      .where(
        and(
          eq(wishlists.userId, session.user.id),
          eq(wishlists.propertyId, validated.propertyId),
        ),
      )
      .limit(1);

    if (existing) {
      await db
        .delete(wishlists)
        .where(
          and(
            eq(wishlists.userId, session.user.id),
            eq(wishlists.propertyId, validated.propertyId),
          ),
        );

      return { success: true, favorited: false };
    }

    await db.insert(wishlists).values({
      userId: session.user.id,
      propertyId: validated.propertyId,
    });

    return { success: true, favorited: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message || "Invalid input", success: false };
    }
    return { error: "Failed to update wishlist", success: false };
  }
}

export async function getWishlist() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { error: "Unauthorized", success: false };
    }

    const data = await db
      .select({
        id: wishlists.id,
        propertyId: wishlists.propertyId,
        createdAt: wishlists.createdAt,
        propertyName: properties.name,
        propertyAddress: properties.address,
        propertyType: properties.type,
        propertyBasePrice: properties.basePrice,
        propertyImages: properties.images,
      })
      .from(wishlists)
      .leftJoin(properties, eq(wishlists.propertyId, properties.id))
      .where(eq(wishlists.userId, session.user.id))
      .orderBy(desc(wishlists.createdAt));

    return { success: true, data, meta: { total: data.length } };
  } catch (error) {
    return { error: "Failed to fetch wishlist", success: false };
  }
}
