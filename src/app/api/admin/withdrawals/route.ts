import { NextRequest } from 'next/server'
import { db } from '@/db'
import { users, withdrawals, ownerBankAccounts } from '@/db/schema'
import { validateAdminRequest, validateAdminOnlyRequest } from '@/lib/api-auth'
import { ok, fail, handleApiError } from '@/lib/api'
import { eq, desc, and, sql } from 'drizzle-orm'
import { z } from 'zod'
import { logError } from '@/lib/logger'
import type { Role } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit-log'

const processWithdrawalSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(['success', 'rejected']),
  adminNote: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const authResult = await validateAdminRequest(req)
    if (authResult instanceof Response) return authResult
    const { session } = authResult

    const data = await db
      .select({
        id: withdrawals.id,
        amount: withdrawals.amount,
        status: withdrawals.status,
        adminNote: withdrawals.adminNote,
        createdAt: withdrawals.createdAt,
        updatedAt: withdrawals.updatedAt,
        owner: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
        bankAccount: {
          id: ownerBankAccounts.id,
          providerName: ownerBankAccounts.providerName,
          accountNumber: ownerBankAccounts.accountNumber,
          accountName: ownerBankAccounts.accountName,
          accountType: ownerBankAccounts.accountType,
        },
      })
      .from(withdrawals)
      .leftJoin(users, eq(users.id, withdrawals.ownerId))
      .leftJoin(ownerBankAccounts, eq(ownerBankAccounts.id, withdrawals.bankAccountId))
      .where(eq(withdrawals.status, 'pending'))
      .orderBy(desc(withdrawals.createdAt))

    return ok({ data })
  } catch (error) {
    logError(error, 'GET /api/admin/withdrawals')
    return handleApiError(error)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authResult = await validateAdminOnlyRequest(req)
    if (authResult instanceof Response) return authResult
    const { session, ipAddress, userAgent } = authResult
    const body = processWithdrawalSchema.parse(await req.json())

    const [withdrawal] = await db
      .select()
      .from(withdrawals)
      .where(eq(withdrawals.id, body.id))
      .limit(1)

    if (!withdrawal) {
      return fail('Withdrawal not found', 404)
    }

    if (withdrawal.status !== 'pending') {
      return fail('Withdrawal sudah diproses', 400)
    }

    if (body.action === 'rejected' && !body.adminNote?.trim()) {
      return fail('Alasan penolakan wajib diisi', 400)
    }

    await db.transaction(async (tx) => {
      await tx
        .update(withdrawals)
        .set({
          status: body.action,
          adminNote: body.adminNote?.trim() || null,
          updatedAt: new Date(),
        })
        .where(eq(withdrawals.id, body.id))

      if (body.action === 'rejected') {
        await tx
          .update(users)
          .set({
            balance: sql`${users.balance} + ${withdrawal.amount}`,
            updatedAt: new Date(),
          })
          .where(eq(users.id, withdrawal.ownerId))
      }
    })

    await createAuditLog({
      action: body.action === 'success' ? 'approve' : 'reject',
      targetType: 'withdrawal',
      targetId: withdrawal.id,
      adminId: session.user.id,
      details: {
        ownerId: withdrawal.ownerId,
        amount: withdrawal.amount,
        adminNote: body.adminNote,
      },
    })

    return ok({ success: true, message: `Withdrawal ${body.action === 'success' ? 'disetujui' : 'ditolak'}.` })
  } catch (error) {
    logError(error, 'PATCH /api/admin/withdrawals')
    return handleApiError(error)
  }
}
