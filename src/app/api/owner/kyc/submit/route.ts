import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { requireSession } from '@/lib/auth'
import { ok, fail, handleApiError } from '@/lib/api'
import { eq } from 'drizzle-orm'
import { logError } from '@/lib/logger'
import { z } from 'zod'

const submitKycSchema = z.object({
  ktpNumber: z.string().regex(/^\d{16}$/, 'NIK harus 16 digit angka'),
  ktpImageUrl: z.string().url('URL foto KTP tidak valid'),
})

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(['owner'] as any)
    const body = submitKycSchema.parse(await req.json())

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1)

    if (!user) {
      return fail('User not found', 404)
    }

    if (user.kycStatus === 'pending') {
      return fail('KYC Anda sedang dalam proses verifikasi.', 400)
    }

    if (user.kycStatus === 'verified') {
      return fail('KYC Anda sudah terverifikasi.', 400)
    }

    await db
      .update(users)
      .set({
        ktpNumber: body.ktpNumber,
        ktpImageUrl: body.ktpImageUrl,
        kycStatus: 'pending',
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id))

    return ok({ success: true, message: 'KYC berhasil dikirim. Menunggu verifikasi admin.' })
  } catch (error) {
    logError(error, 'POST /api/owner/kyc/submit')
    return handleApiError(error)
  }
}
