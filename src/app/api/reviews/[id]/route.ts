import { NextRequest } from 'next/server'
import { db } from '@/db'
import { reviews, users, properties } from '@/db/schema'
import { eq, and, desc, sql } from 'drizzle-orm'
import { requireSession } from '@/lib/auth'
import { validateMutationCsrf } from '@/lib/api-auth'
import { ok, fail, handleApiError } from '@/lib/api'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const csrfError = validateMutationCsrf(req)
    if (csrfError) return csrfError
    const session = await requireSession()
    const { id } = await params

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
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.reviewerId, users.id))
      .leftJoin(properties, eq(reviews.propertyId, properties.id))
      .where(eq(reviews.id, id))
      .limit(1)

    if (!review) {
      return fail('Review not found', 404)
    }

    return ok(review)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession()
    const { id } = await params
    const isAdmin = session.user.role === 'admin'

    const [review] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.id, id))
      .limit(1)

    if (!review) {
      return fail('Review not found', 404)
    }

    if (!isAdmin && review.reviewerId !== session.user.id) {
      return fail('Forbidden', 403)
    }

    await db.transaction(async (tx) => {
      await tx.delete(reviews).where(eq(reviews.id, id))

      if (review.type === 'tenant' && review.reviewedUserId) {
        const [countRow] = await tx
          .select({ count: sql<number>`count(*)` })
          .from(reviews)
          .where(and(
            eq(reviews.reviewedUserId, review.reviewedUserId),
            eq(reviews.type, 'tenant')
          ))

        const reviewCount = Number(countRow.count) || 0
        if (reviewCount > 0) {
          const [sumRow] = await tx
            .select({ sum: sql<number>`sum(${reviews.rating})` })
            .from(reviews)
            .where(and(
              eq(reviews.reviewedUserId, review.reviewedUserId),
              eq(reviews.type, 'tenant')
            ))

          const totalRating = Number(sumRow.sum) || 0
          const newScore = totalRating / reviewCount

          await tx
            .update(users)
            .set({ reputationScore: newScore.toFixed(2) })
            .where(eq(users.id, review.reviewedUserId))
        } else {
          await tx
            .update(users)
            .set({ reputationScore: '0.00' })
            .where(eq(users.id, review.reviewedUserId))
        }
      }
    })

    return ok({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
