"use server";

import { db } from "@/db";
import { reviews, bookings, reviewReplies, properties } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { invalidateCacheByTag } from "@/lib/cache";
import { createNotification, sendWebPushNotification, eventEmitter } from "@/lib/notification-client";
import { logError } from "@/lib/logger";
import { validateActionCsrf } from "@/lib/api-auth";
import { sanitizeString } from "@/lib/sanitize";
import { MAX_REVIEW_LENGTH } from "@/lib/constants/actions";

const createReviewSchema = z.object({
  type: z.enum(["tenant", "property"]),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z
    .string()
    .max(MAX_REVIEW_LENGTH)
    .min(1, "Komentar tidak boleh kosong"),
  bookingId: z.string().uuid(),
  reviewedUserId: z.string().uuid().optional(),
  propertyId: z.string().uuid().optional(),
});

const updateReviewSchema = z.object({
  id: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  comment: z.string().max(1000).optional(),
});

const replyReviewSchema = z.object({
  reviewId: z.string().uuid(),
  content: z.string().max(1000),
});

export type UpdateReviewState = {
  success?: boolean;
  error?: string;
  data?: unknown;
};

export async function updateReviewAction(
  _prevState: UpdateReviewState | undefined,
  formData: FormData,
): Promise<UpdateReviewState> {
  const csrfError = await validateActionCsrf(formData);
  if (csrfError) {
    return { error: csrfError, success: false };
  }

  try {
    const validated = updateReviewSchema.parse({
      id: formData.get("id"),
      rating: formData.get("rating"),
      comment: formData.get("comment"),
    });

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { error: "Tidak terotorisasi", success: false };
    }

    const [review] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.id, validated.id))
      .limit(1);

    if (!review) {
      return { error: "Review tidak ditemukan", success: false };
    }

    if (review.createdById !== session.user.id) {
      return { error: "Dilarang", success: false };
    }

    const updateData: Record<string, unknown> = {
      isEdited: true,
    };

    if (validated.rating !== undefined)
      updateData.rating = validated.rating.toString();
    if (validated.comment !== undefined)
      updateData.comment = sanitizeString(validated.comment);

    const [updated] = await db
      .update(reviews)
      .set(updateData)
      .where(eq(reviews.id, validated.id))
      .returning();

    await invalidateCacheByTag("reviews");

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: error.issues[0]?.message || "Input tidak valid",
        success: false,
      };
    }
    return { error: "Gagal memperbarui review", success: false };
  }
}

export type DeleteReviewState = {
  success?: boolean;
  error?: string;
};

export async function deleteReviewAction(
  _prevState: DeleteReviewState | undefined,
  formData: FormData,
): Promise<DeleteReviewState> {
  const csrfError = await validateActionCsrf(formData);
  if (csrfError) {
    return { error: csrfError, success: false };
  }

  try {
    const reviewId = formData.get("id") as string;
    if (!reviewId) {
      return { error: "ID review tidak valid", success: false };
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { error: "Tidak terotorisasi", success: false };
    }

    const [review] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.id, reviewId))
      .limit(1);

    if (!review) {
      return { error: "Review tidak ditemukan", success: false };
    }

    const isAdmin = session.user.role === "admin";

    if (!isAdmin && review.createdById !== session.user.id) {
      return { error: "Dilarang", success: false };
    }

    await db.transaction(async (tx) => {
      await tx.delete(reviews).where(eq(reviews.id, reviewId));

      if (review.type === "tenant" && review.reviewedUserId) {
        await tx.execute(sql`
          UPDATE users
          SET reputation_score = (
            SELECT COALESCE(AVG(${reviews.rating}), 0)
            FROM reviews
            WHERE reviewed_user_id = ${review.reviewedUserId}
              AND type = 'tenant'
          )
          WHERE id = ${review.reviewedUserId}
        `);
      }
    });

    await invalidateCacheByTag("reviews");

    return { success: true };
  } catch (error) {
    logError(error, "deleteReviewAction error");
    return { error: "Gagal menghapus review", success: false };
  }
}

export type ReplyReviewState = {
  success?: boolean;
  error?: string;
  data?: unknown;
};

export async function replyReviewAction(
  _prevState: ReplyReviewState | undefined,
  formData: FormData,
): Promise<ReplyReviewState> {
  const csrfError = await validateActionCsrf(formData);
  if (csrfError) {
    return { error: csrfError, success: false };
  }

  try {
    const validated = replyReviewSchema.parse({
      reviewId: formData.get("reviewId"),
      content: formData.get("content"),
    });

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { error: "Tidak terotorisasi", success: false };
    }

    const [review] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.id, validated.reviewId))
      .limit(1);

    if (!review) {
      return { error: "Review tidak ditemukan", success: false };
    }

    const isAdmin = session.user.role === "admin";

    if (!isAdmin) {
      if (!review.propertyId) {
        return { error: "Dilarang", success: false };
      }

      const [property] = await db
        .select()
        .from(properties)
        .where(eq(properties.id, review.propertyId))
        .limit(1);

      if (!property || property.ownerId !== session.user.id) {
        return { error: "Dilarang", success: false };
      }
    }

    const [reply] = await db
      .insert(reviewReplies)
      .values({
        reviewId: validated.reviewId,
        userId: session.user.id,
        content: validated.content,
      })
      .returning();

    await db
      .update(reviews)
      .set({ replyCount: sql`${reviews.replyCount} + 1` })
      .where(eq(reviews.id, validated.reviewId));

    await invalidateCacheByTag("reviews");

    if (
      review.reviewedUserId &&
      review.reviewedUserId !== session.user.id &&
      review.propertyId
    ) {
      const [property] = await db
        .select({ name: properties.name })
        .from(properties)
        .where(eq(properties.id, review.propertyId))
        .limit(1);

      const replierName = session.user.name || "Owner";
      const propertyName = property?.name || "Properti";
      const title = "Owner membalas review Anda";
      const message = `${replierName} membalas review Anda untuk ${propertyName}`;

      try {
        await createNotification(
          review.reviewedUserId,
          "review_reply",
          title,
          message,
          validated.reviewId,
        );
        await eventEmitter.emit("notification", {
          userId: review.reviewedUserId,
          id: reply.id,
          type: "review_reply",
          title,
          message,
          referenceId: validated.reviewId,
        });
        await sendWebPushNotification(
          review.reviewedUserId,
          title,
          message,
        ).catch(() => {});
      } catch {
        // Notification gagal tidak boleh gagalkan reply
      }
    }

    return { success: true, data: reply };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: error.issues[0]?.message || "Input tidak valid",
        success: false,
      };
    }
    return { error: "Gagal membalas review", success: false };
  }
}

export type CreateReviewState = {
  success?: boolean;
  error?: string;
  data?: unknown;
};

export async function createReviewAction(
  _prevState: CreateReviewState | undefined,
  formData: FormData,
): Promise<CreateReviewState> {
  const csrfError = await validateActionCsrf(formData);
  if (csrfError) {
    return { error: csrfError, success: false };
  }

  try {
    const validated = createReviewSchema.parse({
      type: formData.get("type"),
      rating: formData.get("rating"),
      comment: formData.get("comment"),
      bookingId: formData.get("bookingId"),
      reviewedUserId: formData.get("reviewedUserId") || undefined,
      propertyId: formData.get("propertyId") || undefined,
    });

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { error: "Tidak terotorisasi", success: false };
    }

    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, validated.bookingId))
      .limit(1);

    if (!booking) {
      return { error: "Booking tidak ditemukan", success: false };
    }

    if (booking.userId !== session.user.id) {
      return { error: "Tidak memiliki izin", success: false };
    }

    if (booking.status !== "confirmed" && booking.status !== "completed") {
      return {
        error:
          "Anda hanya dapat review setelah booking dikonfirmasi atau selesai",
        success: false,
      };
    }

    const now = new Date();
    const bookingEnd = new Date(booking.endDate);
    if (bookingEnd > now) {
      return {
        error: "Anda hanya dapat review setelah periode booking berakhir",
        success: false,
      };
    }

    const [existingReview] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.bookingId, validated.bookingId))
      .limit(1);

    if (existingReview) {
      return { error: "Anda sudah mereview booking ini", success: false };
    }

    let reviewedUserId: string | undefined;
    let propertyId: string | undefined;

    if (validated.type === "tenant") {
      if (!validated.reviewedUserId) {
        return {
          error: "reviewedUserId diperlukan untuk review penyewa",
          success: false,
        };
      }
      reviewedUserId = validated.reviewedUserId;
      propertyId = booking.propertyId;
    } else {
      if (!validated.propertyId) {
        return {
          error: "propertyId diperlukan untuk review properti",
          success: false,
        };
      }
      reviewedUserId = undefined;
      propertyId = validated.propertyId;
    }

    const result = await db.transaction(async (tx) => {
      const [review] = await tx
        .insert(reviews)
        .values({
          createdById: session.user.id,
          reviewedUserId,
          propertyId,
          type: validated.type,
          rating: validated.rating.toString(),
          comment: sanitizeString(validated.comment) ?? validated.comment,
          bookingId: validated.bookingId,
          cleanliness: validated.rating.toString(),
          security: validated.rating.toString(),
          accuracy: validated.rating.toString(),
          communication: validated.rating.toString(),
          valueForMoney: validated.rating.toString(),
        })
        .returning();

      if (validated.type === "tenant" && reviewedUserId) {
        await tx.execute(sql`
          UPDATE users
          SET reputation_score = COALESCE((
            SELECT AVG(${reviews.rating})
            FROM reviews
            WHERE reviewed_user_id = ${reviewedUserId}
              AND type = 'tenant'
          ), 0)
          WHERE id = ${reviewedUserId}
        `);
      }

      return review;
    });

    await invalidateCacheByTag("reviews");

    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: error.issues[0]?.message || "Input tidak valid",
        success: false,
      };
    }
    return { error: "Gagal membuat review", success: false };
  }
}
