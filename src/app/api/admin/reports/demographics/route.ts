import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users, properties } from '@/db/schema'
import { sql, and } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { ok, fail, handleApiError } from '@/lib/api'

interface RegionItem {
  province: string
  city: string
  district: string
  count: number
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const filterType = (searchParams.get('filterType') || 'user') as 'user' | 'owner'
    const provinceFilter = searchParams.get('province') || ''
    const cityFilter = searchParams.get('city') || ''
    const districtFilter = searchParams.get('district') || ''

    const conditions: any[] = []
    if (provinceFilter) {
      const field = filterType === 'user' ? users.province : properties.province
      conditions.push(sql`${field} ILIKE ${`%${provinceFilter}%`}`)
    }
    if (cityFilter) {
      const field = filterType === 'user' ? users.city : properties.city
      conditions.push(sql`${field} ILIKE ${`%${cityFilter}%`}`)
    }
    if (districtFilter && filterType === 'user') {
      conditions.push(sql`${users.district} ILIKE ${`%${districtFilter}%`}`)
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    let data: RegionItem[] = []
    let total = 0

    if (filterType === 'user') {
      const rows = await db
        .select({
          province: users.province,
          city: users.city,
          district: users.district,
          count: sql<number>`count(${users.id})`,
        })
        .from(users)
        .where(whereClause)
        .groupBy(users.province, users.city, users.district)
        .orderBy(sql<number>`count(${users.id})`)

      data = rows.map((row) => ({
        province: row.province || '-',
        city: row.city || '-',
        district: row.district || '-',
        count: Number(row.count),
      }))
      total = data.reduce((sum, item) => sum + item.count, 0)
    } else {
      const rows = await db
        .select({
          province: properties.province,
          city: properties.city,
          count: sql<number>`count(DISTINCT ${properties.ownerId})`,
        })
        .from(properties)
        .where(whereClause)
        .groupBy(properties.province, properties.city)
        .orderBy(sql<number>`count(DISTINCT ${properties.ownerId})`)

      data = rows.map((row) => ({
        province: row.province || '-',
        city: row.city || '-',
        district: '-',
        count: Number(row.count),
      }))
      total = data.reduce((sum, item) => sum + item.count, 0)
    }

    return ok({ data, total, filterType })
  } catch (error) {
    return handleApiError(error, 'GET /api/admin/reports/demographics')
  }
}
