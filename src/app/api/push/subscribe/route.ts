import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth'
import { db } from '@/db'
import { pushSubscriptions } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: Request) {
  try {
    const session = await requireSession()
    const body = await req.json()

    const { endpoint, p256dh, auth } = body as {
      endpoint: string
      p256dh: string
      auth: string
    }

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json(
        { success: false, error: 'Missing subscription fields' },
        { status: 400 }
      )
    }

    await db
      .insert(pushSubscriptions)
      .values({
        userId: session.user.id,
        endpoint,
        p256dh,
        auth,
      })
      .onConflictDoNothing({
        target: pushSubscriptions.endpoint,
      })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Push subscribe failed:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}