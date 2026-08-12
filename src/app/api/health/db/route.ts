import { NextResponse } from 'next/server'
import { db } from '@/db'
import { sql } from 'drizzle-orm'

export async function GET() {
  try {
    await db.execute(sql`SELECT 1`)
    return NextResponse.json({ status: 'healthy', message: 'Database connected' })
  } catch (error) {
    return NextResponse.json({ status: 'down', message: 'Database connection failed' }, { status: 500 })
  }
}
