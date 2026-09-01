"use server";

import { db } from "@/db";
import {
  groupBookings,
  groupBookingMembers,
  users,
  properties,
} from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { invalidateCacheByTag } from "@/lib/cache";
import { dispatchGroupBookingInvite } from "@/lib/notification-client";
import { logError } from "@/lib/logger";
import { validateActionCsrf } from "@/lib/api-auth";
import type { CreateGroupBookingState } from "@/types/action";

type GroupBookingInsert = typeof groupBookings.$inferInsert;
type GroupBookingMemberInsert = typeof groupBookingMembers.$inferInsert;

const createGroupBookingSchema = z.object({
  propertyId: z.string().uuid(),
  unitId: z.string().uuid(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  maxMembers: z.coerce.number().int().positive().max(50),
  memberEmails: z.array(z.string().email()).min(1, "Minimal 1 anggota"),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function createGroupBookingAction(
  _prevState: CreateGroupBookingState | undefined,
  formData: FormData,
): Promise<CreateGroupBookingState> {
  const csrfError = await validateActionCsrf(formData);
  if (csrfError) {
    return { error: csrfError, success: false };
  }

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { error: "Tidak terotorisasi", success: false };
    }

    const rawMemberEmails = formData.get("memberEmails");
    const memberEmails = rawMemberEmails
      ? JSON.parse(String(rawMemberEmails))
      : [];

    const validated = createGroupBookingSchema.parse({
      propertyId: formData.get("propertyId"),
      unitId: formData.get("unitId"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      maxMembers: formData.get("maxMembers"),
      memberEmails,
    });

    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, validated.propertyId))
      .limit(1);

    if (!property) {
      return { error: "Properti tidak ditemukan", success: false };
    }

    const memberCount = validated.memberEmails.length + 1;
    const sharePercentage = memberCount > 0 ? 100 / memberCount : 100;

    const [groupBooking] = await db.transaction(async (tx) => {
      const [gb] = await tx
        .insert(groupBookings)
        .values({
          leadUserId: session.user.id,
          propertyId: validated.propertyId,
          unitId: validated.unitId,
          status: "pending",
          totalAmount: "0",
          depositAmount: "0",
          startDate: new Date(validated.startDate),
          endDate: new Date(validated.endDate),
          metadata: validated.metadata || {},
        } as GroupBookingInsert)
        .returning();

      await tx.insert(groupBookingMembers).values({
        groupBookingId: gb.id,
        userId: session.user.id,
        sharePercentage: sharePercentage.toString(),
        shareAmount: "0",
        paidAmount: "0",
        status: "accepted",
      } as GroupBookingMemberInsert);

      const memberUsers =
        validated.memberEmails.length > 0
          ? await tx
              .select()
              .from(users)
              .where(inArray(users.email, validated.memberEmails))
          : [];

      for (const user of memberUsers) {
        await tx.insert(groupBookingMembers).values({
          groupBookingId: gb.id,
          userId: user.id,
          sharePercentage: sharePercentage.toString(),
          shareAmount: "0",
          paidAmount: "0",
          status: "invited",
        } as GroupBookingMemberInsert);

        dispatchGroupBookingInvite(
          user.id,
          gb.id,
          property.name,
          session.user.name,
        ).catch(() => {});
      }

      return [gb];
    });

    await invalidateCacheByTag("group-bookings");

    return {
      success: true,
      data: {
        id: groupBooking.id,
        propertyId: groupBooking.propertyId,
        unitId: groupBooking.unitId,
        status: (groupBooking.status as string) || "pending",
        startDate: groupBooking.startDate,
        endDate: groupBooking.endDate,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: error.issues[0]?.message || "Input tidak valid",
        success: false,
      };
    }
    logError(error, "createGroupBookingAction error");
    return { error: "Gagal membuat group booking", success: false };
  }
}
