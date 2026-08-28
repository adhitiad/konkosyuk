import { NextRequest } from "next/server";
import { db } from "@/db";
import { propertyRatings, reviews } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { ok, handleApiError } from "@/lib/api";

export async function GET(
  __req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const [rating] = await db
      .select()
      .from(propertyRatings)
      .where(eq(propertyRatings.propertyId, id))
      .limit(1);

    if (!rating) {
      return ok({
        averageRating: 0,
        totalReviews: 0,
        cleanliness: 0,
        security: 0,
        accuracy: 0,
        communication: 0,
        valueForMoney: 0,
        ratingDistribution: {},
      });
    }

    const recentReviews = await db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
        userName: reviews.createdById,
      })
      .from(reviews)
      .where(eq(reviews.propertyId, id))
      .orderBy(desc(reviews.createdAt))
      .limit(5);

    return ok({
      ...rating,
      recentReviews,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
