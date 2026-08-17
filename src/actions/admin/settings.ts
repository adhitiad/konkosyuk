"use server";

import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { z } from "zod";

const settingSchema = z.object({
  key: z.string().min(1, "Key is required"),
  value: z.string().min(1, "Value is required"),
  isSecret: z.boolean().default(false),
  description: z.string().optional(),
});

export type AppSetting = typeof appSettings.$inferSelect;

export async function getSettingsAction() {
  try {
    await requireSession(["admin"] as const);
    const settings = await db
      .select()
      .from(appSettings)
      .orderBy(appSettings.key);
    return ok({ data: settings });
  } catch (error) {
    return handleApiError(error, "GET /api/admin/settings");
  }
}

export async function upsertSettingAction(
  prevState: any,
  formData: FormData,
): Promise<any> {
  try {
    await requireSession(["admin"] as const);
    const validated = settingSchema.parse({
      key: formData.get("key"),
      value: formData.get("value"),
      isSecret: formData.get("isSecret") === "true",
      description: formData.get("description"),
    });

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
    return handleApiError(error, "UPSERT /api/admin/settings");
  }
}

export async function deleteSettingAction(key: string) {
  try {
    await requireSession(["admin"] as const);
    await db.delete(appSettings).where(eq(appSettings.key, key));
    return ok({ success: true });
  } catch (error) {
    return handleApiError(error, "DELETE /api/admin/settings");
  }
}

const platformFeeSchema = z.object({
  platformFeePercent: z.string().min(1),
  featuredListingPrice: z.string().min(1),
});

export async function updatePlatformFeeAction(
  prevState: any,
  formData: FormData,
): Promise<any> {
  try {
    await requireSession(["admin"] as const);
    const validated = platformFeeSchema.parse({
      platformFeePercent: formData.get("platformFeePercent"),
      featuredListingPrice: formData.get("featuredListingPrice"),
    });

    await db
      .insert(appSettings)
      .values({
        key: "PLATFORM_FEE_PERCENT",
        value: validated.platformFeePercent,
        isSecret: false,
        description: "Platform fee percentage",
      })
      .onConflictDoUpdate({
        target: appSettings.key,
        set: { value: validated.platformFeePercent, updatedAt: new Date() },
      });

    await db
      .insert(appSettings)
      .values({
        key: "FEATURED_LISTING_PRICE",
        value: validated.featuredListingPrice,
        isSecret: false,
        description: "Featured listing price",
      })
      .onConflictDoUpdate({
        target: appSettings.key,
        set: { value: validated.featuredListingPrice, updatedAt: new Date() },
      });

    return ok({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail(error.issues[0]?.message || "Input tidak valid", 400);
    }
    return handleApiError(error, "updatePlatformFeeAction");
  }
}

export async function getSettingAction(key: string) {
  try {
    await requireSession(["admin"] as const);
    const [setting] = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, key))
      .limit(1);

    return ok({ data: setting });
  } catch (error) {
    return handleApiError(error, "GET /api/admin/settings/[key]");
  }
}
