"use server";

import { db } from "@/db";
import {
  reviews,
  bookings,
  users,
  reviewReplies,
  properties,
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";

const createReviewSchema = z.object({
  type: z.enum(["tenant", "property"]),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(1000).min(1, "Komentar tidak boleh kosong"),
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
  prevState: UpdateReviewState | undefined,
  formData: FormData,
): Promise<UpdateReviewState> {
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
    if (validated.comment !== undefined) updateData.comment = validated.comment;

    const [updated] = await db
      .update(reviews)
      .set(updateData)
      .where(eq(reviews.id, validated.id))
      .returning();

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
  prevState: DeleteReviewState | undefined,
  formData: FormData,
): Promise<DeleteReviewState> {
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
        const [countRow] = await tx
          .select({ count: sql<number>`count(*)` })
          .from(reviews)
          .where(
            and(
              eq(reviews.reviewedUserId, review.reviewedUserId),
              eq(reviews.type, "tenant"),
            ),
          );

        const reviewCount = Number(countRow.count) || 0;
        if (reviewCount > 0) {
          const [sumRow] = await tx
            .select({ sum: sql<number>`sum(${reviews.rating})` })
            .from(reviews)
            .where(
              and(
                eq(reviews.reviewedUserId, review.reviewedUserId),
                eq(reviews.type, "tenant"),
              ),
            );

          const totalRating = Number(sumRow.sum) || 0;
          const newScore = totalRating / reviewCount;

          await tx
            .update(users)
            .set({ reputationScore: newScore.toFixed(2) })
            .where(eq(users.id, review.reviewedUserId));
        } else {
          await tx
            .update(users)
            .set({ reputationScore: "0.00" })
            .where(eq(users.id, review.reviewedUserId));
        }
      }
    });

    return { success: true };
  } catch (error) {
    console.error("deleteReviewAction error:", error);
    return { error: "Gagal menghapus review", success: false };
  }
}

export type ReplyReviewState = {
  success?: boolean;
  error?: string;
  data?: unknown;
};

export async function replyReviewAction(
  prevState: ReplyReviewState | undefined,
  formData: FormData,
): Promise<ReplyReviewState> {
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
  prevState: CreateReviewState | undefined,
  formData: FormData,
): Promise<CreateReviewState> {
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
          comment: validated.comment,
          bookingId: validated.bookingId,
          cleanliness: validated.rating.toString(),
          security: validated.rating.toString(),
          accuracy: validated.rating.toString(),
          communication: validated.rating.toString(),
          valueForMoney: validated.rating.toString(),
        })
        .returning();

      if (validated.type === "tenant" && reviewedUserId) {
        const [user] = await tx
          .select({
            reputationScore: users.reputationScore,
          })
          .from(users)
          .where(eq(users.id, reviewedUserId))
          .limit(1);

        if (user) {
          const currentScore = Number(user.reputationScore) || 0;
          const [countRow] = await tx
            .select({ count: sql<number>`count(*)` })
            .from(reviews)
            .where(
              and(
                eq(reviews.reviewedUserId, reviewedUserId),
                eq(reviews.type, "tenant"),
              ),
            );

          const reviewCount = Number(countRow.count) || 0;
          const newScore =
            reviewCount === 0
              ? validated.rating
              : (currentScore * reviewCount + validated.rating) /
                (reviewCount + 1);

          await tx
            .update(users)
            .set({ reputationScore: newScore.toFixed(2) })
            .where(eq(users.id, reviewedUserId));
        }
      }

      return review;
    });

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
