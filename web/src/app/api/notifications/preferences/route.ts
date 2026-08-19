import { NextRequest } from "next/server";
import { db } from "@/db";
import { userNotificationPreferences } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { ok, handleApiError } from "@/lib/api";
import { z } from "zod";
import { eq } from "drizzle-orm";

const preferencesSchema = z.object({
  preferences: z.record(z.string(), z.object({
    inApp: z.boolean(),
    email: z.boolean(),
    push: z.boolean(),
  })),
  emailDigest: z.enum(["immediate", "daily", "weekly", "never"]).optional(),
  quietHoursStart: z.string().optional(),
  quietHoursEnd: z.string().optional(),
  timezone: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId") || session.user.id;

    const prefs = await db
      .select()
      .from(userNotificationPreferences)
      .where(eq(userNotificationPreferences.userId, userId))
      .limit(1);

    const defaultPrefs = {
      booking_created: { inApp: true, email: true, push: true },
      booking_approved: { inApp: true, email: true, push: true },
      booking_rejected: { inApp: true, email: true, push: true },
      booking_completed: { inApp: true, email: false, push: true },
      booking_cancelled: { inApp: true, email: true, push: false },
      payment_dp_paid: { inApp: true, email: false, push: true },
      payment_full_paid: { inApp: true, email: true, push: true },
      payment_failed: { inApp: true, email: true, push: true },
      payment_refunded: { inApp: true, email: true, push: true },
      maintenance_created: { inApp: true, email: true, push: true },
      maintenance_updated: { inApp: true, email: true, push: true },
      maintenance_resolved: { inApp: true, email: false, push: true },
      inspection_created: { inApp: true, email: false, push: true },
      inspection_completed: { inApp: true, email: true, push: true },
      inspection_disputed: { inApp: true, email: true, push: true },
      chat_message: { inApp: true, email: false, push: true },
      review_received: { inApp: true, email: false, push: false },
      system: { inApp: true, email: false, push: false },
    };

    if (prefs.length === 0) {
      return ok({
        preferences: defaultPrefs,
        emailDigest: "immediate",
        quietHoursStart: null,
        quietHoursEnd: null,
        timezone: "Asia/Jakarta",
      });
    }

    return ok({
      preferences: { ...defaultPrefs, ...(prefs[0].preferences as Record<string, { inApp: boolean; email: boolean; push: boolean }>) },
      emailDigest: prefs[0].emailDigest,
      quietHoursStart: prefs[0].quietHoursStart,
      quietHoursEnd: prefs[0].quietHoursEnd,
      timezone: prefs[0].timezone,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const data = preferencesSchema.parse(body);

    const existing = await db
      .select()
      .from(userNotificationPreferences)
      .where(eq(userNotificationPreferences.userId, session.user.id))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(userNotificationPreferences)
        .set({
          preferences: data.preferences,
          emailDigest: data.emailDigest ?? existing[0].emailDigest,
          quietHoursStart: data.quietHoursStart ?? existing[0].quietHoursStart,
          quietHoursEnd: data.quietHoursEnd ?? existing[0].quietHoursEnd,
          timezone: data.timezone ?? existing[0].timezone,
          updatedAt: new Date(),
        })
        .where(eq(userNotificationPreferences.userId, session.user.id));
    } else {
      await db.insert(userNotificationPreferences).values({
        userId: session.user.id,
        preferences: data.preferences,
        emailDigest: data.emailDigest ?? "immediate",
        quietHoursStart: data.quietHoursStart ?? null,
        quietHoursEnd: data.quietHoursEnd ?? null,
        timezone: data.timezone ?? "Asia/Jakarta",
      });
    }

    return ok({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
