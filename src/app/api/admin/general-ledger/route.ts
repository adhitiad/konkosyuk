import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { generalLedger, chartOfAccounts } from '@/db/schema'
import { eq, desc, between, sql, and } from 'drizzle-orm'
import { requireSession } from '@/lib/auth'
import { ok, fail, handleApiError } from '@/lib/api'
import type { Role } from '@/lib/auth'
import { z } from 'zod'

const createLedgerEntrySchema = z.object({
  transactionDate: z.string().min(1),
  accountCode: z.string().min(1).max(50),
  accountName: z.string().min(1).max(255),
  description: z.string().min(1).max(500),
  referenceType: z.enum(['payment', 'withdrawal', 'fee', 'refund', 'adjustment']).optional(),
  referenceId: z.string().optional(),
  debit: z.string().regex(/^\d+(\.\d{1,2})?$/).transform((val) => (Number(val) <= 0 ? '0' : val)),
  credit: z.string().regex(/^\d+(\.\d{1,2})?$/).transform((val) => (Number(val) <= 0 ? '0' : val)),
}).refine((data) => {
  const debit = Number(data.debit)
  const credit = Number(data.credit)
  return (debit > 0 && credit === 0) || (debit === 0 && credit > 0) || (debit === 0 && credit === 0)
}, {
  message: 'Entry cannot have both debit and credit greater than zero',
  path: ['debit'],
})

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession(['admin', 'staff'] as Role[])
    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const accountCode = searchParams.get('accountCode')
    const page = Math.max(1, Number(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '20')))
    const offset = (page - 1) * limit

    const conditions = [] as Array<ReturnType<typeof eq | typeof between>>

    if (startDate && endDate) {
      const start = new Date(`${startDate}T00:00:00.000Z`)
      const end = new Date(`${endDate}T23:59:59.999Z`)
      conditions.push(between(generalLedger.transactionDate, start, end))
    }

    if (accountCode) {
      conditions.push(eq(generalLedger.accountCode, accountCode))
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const [entries, [{ count: totalCount }]] = await Promise.all([
      db.select().from(generalLedger)
        .where(where)
        .orderBy(desc(generalLedger.transactionDate))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(generalLedger).where(where),
    ])

    const totalDebit = entries.reduce((sum, entry) => sum + Number(entry.debit || 0), 0)
    const totalCredit = entries.reduce((sum, entry) => sum + Number(entry.credit || 0), 0)

    return ok({
      data: entries,
      totals: {
        totalDebit,
        totalCredit,
        balance: totalDebit - totalCredit,
      },
      meta: {
        page,
        limit,
        total: Number(totalCount),
        totalPages: Math.ceil(Number(totalCount) / limit),
      },
    })
  } catch (error) {
    return handleApiError(error, 'GET /api/admin/general-ledger')
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(['admin'] as Role[])
    const body = createLedgerEntrySchema.parse(await req.json())

    const [account] = await db
      .select()
      .from(chartOfAccounts)
      .where(eq(chartOfAccounts.accountCode, body.accountCode))
      .limit(1)

    if (!account) {
      return fail('Invalid account code', 400)
    }

    const newEntry = await db
      .insert(generalLedger)
      .values({
        id: crypto.randomUUID(),
        transactionDate: new Date(`${body.transactionDate}T00:00:00.000Z`),
        accountCode: body.accountCode,
        accountName: body.accountName,
        description: body.description,
        referenceType: body.referenceType,
        referenceId: body.referenceId,
        debit: body.debit,
        credit: body.credit,
        createdBy: session.user.id,
      })
      .returning()

    return ok(newEntry[0], 201)
  } catch (error) {
    return handleApiError(error, 'POST /api/admin/general-ledger')
  }
}
