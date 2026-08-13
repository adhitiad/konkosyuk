import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth'
import { validateMutationCsrf } from '@/lib/api-auth'
import { db } from '@/db'
import { pushSubscriptions } from '@/db/schema'
import { z } from 'zod'
import { handleApiError } from '@/lib/api'

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(2048),
  p256dh: z.string().min(1).max(512),
  auth: z.string().min(1).max(512),
})

export async function POST(req: NextRequest) {
  try {
    const csrfError = validateMutationCsrf(req)
    if (csrfError) return csrfError
    const session = await requireSession()
    const { endpoint, p256dh, auth } = subscriptionSchema.parse(await req.json())

    await db
      .insert(pushSubscriptions)
      .values({
        userId: session.user.id,
        endpoint,
        p256dh,
        auth,
      })
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: {
          userId: session.user.id,
          p256dh,
          auth,
        },
      })

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, 'POST /api/push/subscribe')
  }
}
