import { NextRequest } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { validateAdminRequest } from '@/lib/api-auth'
import { ok, fail, handleApiError } from '@/lib/api'

function escapeCsv(value: string): string {
  if (
    value.includes(',') ||
    value.includes('"') ||
    value.includes('\n') ||
    value.includes('\r')
  ) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export async function GET(req: NextRequest) {
  try {
    const authResult = await validateAdminRequest(req)
    if (authResult instanceof Response) return authResult
    const { session } = authResult

    const data = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        isBanned: users.isBanned,
        kycStatus: users.kycStatus,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(users.createdAt)

    const header = [
      'ID',
      'Name',
      'Email',
      'Role',
      'Active',
      'Banned',
      'KYC Status',
      'Created At',
    ]

    const rows = data.map((user) =>
      [
        user.id,
        user.name,
        user.email,
        user.role,
        user.isActive ? 'true' : 'false',
        user.isBanned ? 'true' : 'false',
        user.kycStatus,
        user.createdAt?.toISOString?.() ?? '',
      ]
        .map((value) => escapeCsv(String(value ?? '')))
        .join(',')
    )

    const csv = [header.join(','), ...rows].join('\n')

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename=users.csv',
      },
    })
  } catch (error) {
    return handleApiError(error, 'GET /api/admin/users/export')
  }
}
