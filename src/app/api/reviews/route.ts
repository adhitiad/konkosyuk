import { NextRequest } from "next/server";
import { db } from "@/db";
import { reviews, bookings, users, properties } from "@/db/schema";
import { eq, and, desc, sql, lt } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { validateMutationCsrf } from "@/lib/api-auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { z } from "zod";

const createReviewSchema = z.object({
  type: z.enum(["tenant", "property"]),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(1000),
  bookingId: z.string().uuid(),
  reviewedUserId: z.string().uuid().optional(),
  propertyId: z.string().uuid().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId");
    const userId = searchParams.get("userId");

    let whereClause;
    if (propertyId) {
      whereClause = and(
        eq(reviews.propertyId, propertyId),
        eq(reviews.type, "property"),
      );
    } else if (userId) {
      whereClause = and(
        eq(reviews.reviewedUserId, userId),
        eq(reviews.type, "tenant"),
      );
    } else {
      return fail("propertyId or userId is required", 400);
    }

    const data = await db
      .select({
        id: reviews.id,
        type: reviews.type,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
        reviewerName: users.name,
        reviewerImage: users.image,
        propertyName: properties.name,
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.createdById, users.id))
      .leftJoin(properties, eq(reviews.propertyId, properties.id))
      .where(whereClause)
      .orderBy(desc(reviews.createdAt));

    return ok({ data, meta: { total: data.length } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const csrfError = validateMutationCsrf(req);
    if (csrfError) return csrfError;
    const session = await requireSession();
    const body = createReviewSchema.parse(await req.json());

    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, body.bookingId))
      .limit(1);

    if (!booking) {
      return fail("Booking not found", 404);
    }

    if (booking.userId !== session.user.id) {
      return fail("Forbidden", 403);
    }

    if (booking.status !== "confirmed" && booking.status !== "completed") {
      return fail(
        "You can only review after booking is confirmed or completed",
        400,
      );
    }

    const now = new Date();
    const bookingEnd = new Date(booking.endDate);
    if (bookingEnd > now) {
      return fail("You can only review after the booking period ends", 400);
    }

    const [existingReview] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.bookingId, body.bookingId))
      .limit(1);

    if (existingReview) {
      return fail("You have already reviewed this booking", 400);
    }

    let reviewedUserId: string | undefined;
    let propertyId: string | undefined;

    if (body.type === "tenant") {
      if (!body.reviewedUserId) {
        return fail("reviewedUserId is required for tenant review", 400);
      }
      reviewedUserId = body.reviewedUserId;
      propertyId = booking.propertyId;
    } else {
      if (!body.propertyId) {
        return fail("propertyId is required for property review", 400);
      }
      reviewedUserId = undefined;
      propertyId = body.propertyId;
    }

    const result = await db.transaction(async (tx) => {
      const [review] = await db
        .insert(reviews)
        .values({
          createdById: session.user.id,
          reviewedUserId,
          propertyId,
          type: body.type,
          rating: body.rating,
          comment: body.comment,
          bookingId: body.bookingId,
        } as any)
        .returning();

      if (body.type === "tenant" && reviewedUserId) {
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
              ? body.rating
              : (currentScore * reviewCount + body.rating) / (reviewCount + 1);

          await tx
            .update(users)
            .set({ reputationScore: newScore.toFixed(2) })
            .where(eq(users.id, reviewedUserId));
        }
      }

      return review;
    });

    return ok(result, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
