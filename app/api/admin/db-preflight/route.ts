import { NextResponse } from 'next/server'

import { getAdminUser } from '@/lib/admin-auth'
import { db } from '@/lib/db'

interface DbPreflightTable {
  name: string
  rows: number
}

interface DbPreflightResponse {
  ok: boolean
  tables: DbPreflightTable[]
  missing: string[]
  checked_at: string
  error?: string
}

const REQUIRED_TABLES = [
  'products',
  'coupons',
  'click_logs',
  'revenue_tracking',
  'user_profiles',
] as const

interface PgStatTableRow {
  relname: string
  n_live_tup: number
}

export async function GET(): Promise<NextResponse<DbPreflightResponse | { error: string }>> {
  if (!await getAdminUser()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const checkedAt = new Date().toISOString()

  try {
    const rows = await db<PgStatTableRow[]>`
      SELECT relname, n_live_tup::int
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
      ORDER BY n_live_tup DESC
    `

    const statsByTable = new Map(rows.map(row => [row.relname, row.n_live_tup]))
    const tables = REQUIRED_TABLES
      .filter(tableName => statsByTable.has(tableName))
      .map(tableName => ({ name: tableName, rows: statsByTable.get(tableName) ?? 0 }))
    const missing = REQUIRED_TABLES.filter(tableName => !statsByTable.has(tableName))

    return NextResponse.json({
      ok: missing.length === 0,
      tables,
      missing,
      checked_at: checkedAt,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'DB preflight query failed'
    return NextResponse.json({
      ok: false,
      tables: [],
      missing: [...REQUIRED_TABLES],
      checked_at: checkedAt,
      error: message,
    })
  }
}
