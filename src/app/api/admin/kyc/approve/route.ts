import { NextRequest } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { validateAdminOnlyRequest } from '@/lib/api-auth'
import { ok, fail, handleApiError } from '@/lib/api'
import { eq } from 'drizzle-orm'
import { logError } from '@/lib/logger'
import { z } from 'zod'
import { createAuditLog } from '@/lib/audit-log'

const approveKycSchema = z.object({
  userId: z.string().uuid(),
  action: z.enum(['verified', 'rejected']),
  adminNote: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const authResult = await validateAdminOnlyRequest(req)
    if (authResult instanceof Response) return authResult
    const { session, ipAddress, userAgent } = authResult
    const body = approveKycSchema.parse(await req.json())

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, body.userId))
      .limit(1)

    if (!user) {
      return fail('User not found', 404)
    }

    if (user.role !== 'owner') {
      return fail('User is not an owner', 400)
    }

    if (body.action === 'rejected' && !body.adminNote) {
      return fail('Alasan penolakan wajib diisi.', 400)
    }

    await db
      .update(users)
      .set({
        kycStatus: body.action,
        updatedAt: new Date(),
      })
      .where(eq(users.id, body.userId))

    await createAuditLog({
      action: body.action === 'verified' ? 'approve' : 'reject',
      targetType: 'kyc',
      targetId: body.userId,
      adminId: session.user.id,
      details: {
        targetUserId: body.userId,
        adminNote: body.adminNote,
      },
    })

    return ok({ success: true, message: `KYC berhasil ${body.action === 'verified' ? 'diverifikasi' : 'ditolak'}.` })
  } catch (error) {
    logError(error, 'POST /api/admin/kyc/approve')
    return handleApiError(error)
  }
}
