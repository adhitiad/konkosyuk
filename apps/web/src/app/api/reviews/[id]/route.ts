import { NextRequest } from "next/server";
import { db } from "@/db";
import { reviews, users, properties, reviewReplies } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { validateMutationCsrf } from "@/lib/api-auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { z } from "zod";

const updateReviewSchema = z.object({
  rating: z.coerce.number().min(1).max(5).optional(),
  comment: z.string().max(1000).optional(),
});

const replySchema = z.object({
  content: z.string().max(1000),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireSession();
    const { id } = await params;

    const [review] = await db
      .select({
        id: reviews.id,
        type: reviews.type,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
        reviewerName: users.name,
        reviewerImage: users.image,
        propertyName: properties.name,
        propertyId: properties.id,
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.createdById, users.id))
      .leftJoin(properties, eq(reviews.propertyId, properties.id))
      .where(eq(reviews.id, id))
      .limit(1);

    if (!review) {
      return fail("Review not found", 404);
    }

    return ok(review);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const csrfError = validateMutationCsrf(req);
    if (csrfError) return csrfError;
    const session = await requireSession();
    const { id } = await params;
    const body = updateReviewSchema.parse(await req.json());

    const [review] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.id, id))
      .limit(1);

    if (!review) {
      return fail("Review not found", 404);
    }

    if (review.createdById !== session.user.id) {
      return fail("Forbidden", 403);
    }

    const updateData: Record<string, unknown> = {
      isEdited: true,
    };

    if (body.rating !== undefined) updateData.rating = body.rating;
    if (body.comment !== undefined) updateData.comment = body.comment;

    const [updated] = await db
      .update(reviews)
      .set(updateData)
      .where(eq(reviews.id, id))
      .returning();

    return ok(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const isAdmin = session.user.role === "admin";

    const [review] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.id, id))
      .limit(1);

    if (!review) {
      return fail("Review not found", 404);
    }

    if (!isAdmin && review.createdById !== session.user.id) {
      return fail("Forbidden", 403);
    }

    await db.transaction(async (tx) => {
      await tx.delete(reviews).where(eq(reviews.id, id));

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

    return ok({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const csrfError = validateMutationCsrf(req);
    if (csrfError) return csrfError;
    const session = await requireSession();
    const { id } = await params;
    const body = replySchema.parse(await req.json());

    const [review] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.id, id))
      .limit(1);

    if (!review) {
      return fail("Review not found", 404);
    }

    const isOwner = review.propertyId && session.user.role === "owner";
    const isAdmin = session.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return fail("Only property owner or admin can reply", 403);
    }

    const [reply] = await db
      .insert(reviewReplies)
      .values({
        reviewId: id,
        userId: session.user.id,
        content: body.content,
      })
      .returning();

    await db
      .update(reviews)
      .set({ replyCount: sql`${reviews.replyCount} + 1` })
      .where(eq(reviews.id, id));

    return ok(reply, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
