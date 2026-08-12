import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { requireSession } from '@/lib/auth'
import { ok, handleApiError } from '@/lib/api'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession(['cust', 'owner', 'admin', 'staff'] as any)

    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        image: users.image,
        phone: users.phone,
        whatsapp: users.whatsapp,
        telegram: users.telegram,
        province: users.province,
        city: users.city,
        district: users.district,
        kycStatus: users.kycStatus,
        ktpNumber: users.ktpNumber,
        ktpImageUrl: users.ktpImageUrl,
        reputationScore: users.reputationScore,
        balance: users.balance,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return ok(user)
  } catch (error) {
    return handleApiError(error)
  }
}
