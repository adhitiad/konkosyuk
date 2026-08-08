import { NextRequest } from 'next/server'
import { db } from '@/db'
import { platformSettings } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { requireSession } from '@/lib/auth'
import { ok, fail, handleApiError } from '@/lib/api'
import { z } from 'zod'
import type { Role } from '@/lib/auth'

const updatePlatformFeeSchema = z.object({
  platformFeePercent: z.coerce.number().min(0).max(10),
  featuredListingPrice: z.coerce.number().nonnegative().optional(),
})

export async function GET() {
  try {
    await requireSession(['admin'] as Role[])

    const [settings] = await db
      .select()
      .from(platformSettings)
      .where(eq(platformSettings.id, 'default'))
      .limit(1)

    if (!settings) {
      return ok({
        platformFeePercent: 1.8,
        featuredListingPrice: 50000,
      })
    }

    return ok(settings)
  } catch (error) {
    return handleApiError(error, 'GET /api/admin/settings/platform-fee')
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireSession(['admin'] as Role[])
    const body = updatePlatformFeeSchema.parse(await req.json())

    const [settings] = await db
      .select()
      .from(platformSettings)
      .where(eq(platformSettings.id, 'default'))
      .limit(1)

    if (!settings) {
      const [created] = await db
        .insert(platformSettings)
        .values({
          id: 'default',
          platformFeePercent: body.platformFeePercent.toString(),
          featuredListingPrice: (body.featuredListingPrice ?? 50000).toString(),
        })
        .returning()

      return ok(created)
    }

    const [updated] = await db
      .update(platformSettings)
      .set({
        platformFeePercent: body.platformFeePercent.toString(),
        featuredListingPrice: body.featuredListingPrice !== undefined
          ? body.featuredListingPrice.toString()
          : settings.featuredListingPrice,
        updatedAt: new Date(),
      })
      .where(eq(platformSettings.id, 'default'))
      .returning()

    return ok(updated)
  } catch (error) {
    return handleApiError(error, 'PATCH /api/admin/settings/platform-fee')
  }
}
