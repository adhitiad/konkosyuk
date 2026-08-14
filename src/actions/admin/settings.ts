"use server";

import { db } from "@/db";
import { platformSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { createAuditLog } from "@/lib/audit-log";

const updatePlatformFeeSchema = z.object({
  platformFeePercent: z.coerce.number().min(0).max(10),
  featuredListingPrice: z.coerce.number().nonnegative().optional(),
});

export type UpdatePlatformFeeState = {
  success?: boolean;
  error?: string;
  data?: {
    id: string;
    platformFeePercent: string | null;
    featuredListingPrice: string | null;
    updatedAt: Date | null;
  };
};

export async function updatePlatformFeeAction(
  prevState: UpdatePlatformFeeState | undefined,
  formData: FormData,
): Promise<UpdatePlatformFeeState> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { error: "Tidak terotorisasi", success: false };
    }

    if (session.user.role !== "admin") {
      return { error: "Dilarang - hanya admin", success: false };
    }

    const validated = updatePlatformFeeSchema.parse({
      platformFeePercent: formData.get("platformFeePercent"),
      featuredListingPrice: formData.get("featuredListingPrice") || undefined,
    });

    const [settings] = await db
      .select()
      .from(platformSettings)
      .where(eq(platformSettings.id, "default"))
      .limit(1);

    let result;

    if (!settings) {
      const [created] = await db
        .insert(platformSettings)
        .values({
          id: "default",
          platformFeePercent: validated.platformFeePercent.toString(),
          featuredListingPrice: (validated.featuredListingPrice ?? 50000).toString(),
        })
        .returning();

      await createAuditLog({
        action: "config_change",
        targetType: "platform_setting",
        targetId: "default",
        adminId: session.user.id,
        details: {
          platformFeePercent: validated.platformFeePercent,
          featuredListingPrice: validated.featuredListingPrice ?? 50000,
          action: "created",
        },
      });

      result = created;
    } else {
      const [updated] = await db
        .update(platformSettings)
        .set({
          platformFeePercent: validated.platformFeePercent.toString(),
          featuredListingPrice:
            validated.featuredListingPrice !== undefined
              ? validated.featuredListingPrice.toString()
              : settings.featuredListingPrice,
          updatedAt: new Date(),
        })
        .where(eq(platformSettings.id, "default"))
        .returning();

      await createAuditLog({
        action: "config_change",
        targetType: "platform_setting",
        targetId: "default",
        adminId: session.user.id,
        details: {
          platformFeePercent: validated.platformFeePercent,
          featuredListingPrice:
            validated.featuredListingPrice ?? settings.featuredListingPrice,
        },
      });

      result = updated;
    }

    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message || "Input tidak valid", success: false };
    }
    return { error: "Gagal memperbarui pengaturan platform", success: false };
  }
}