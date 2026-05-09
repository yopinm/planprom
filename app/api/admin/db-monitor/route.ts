import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin-auth'
import { db } from '@/lib/db'

const WARN_BYTES = 500 * 1024 * 1024   // 500 MB
const CRIT_BYTES = 1024 * 1024 * 1024  // 1 GB

interface DbSizeRow {
  total_bytes: string
  size_pretty: string
}

interface TableSizeRow {
  table_name: string
  total_bytes: string
  size_pretty: string
  row_count: string
  last_autovacuum: string | null
  last_autoanalyze: string | null
}

export interface DbMonitorResponse {
  total_bytes: number
  size_pretty: string
  warn_bytes: number
  crit_bytes: number
  tables: Array<{
    name: string
    total_bytes: number
    size_pretty: string
    row_count: number
    last_autovacuum: string | null
    last_autoanalyze: string | null
  }>
  checked_at: string
  error?: string
}

export async function GET(): Promise<NextResponse<DbMonitorResponse | { error: string }>> {
  if (!await getAdminUser()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const checkedAt = new Date().toISOString()

  try {
    const [sizeRows, tableRows] = await Promise.all([
      db<DbSizeRow[]>`
        SELECT
          pg_database_size(current_database())::text AS total_bytes,
          pg_size_pretty(pg_database_size(current_database())) AS size_pretty
      `,
      db<TableSizeRow[]>`
        SELECT
          pst.relname AS table_name,
          pg_total_relation_size(pst.schemaname || '.' || pst.relname)::text AS total_bytes,
          pg_size_pretty(pg_total_relation_size(pst.schemaname || '.' || pst.relname)) AS size_pretty,
          pst.n_live_tup::text AS row_count,
          pst.last_autovacuum,
          pst.last_autoanalyze
        FROM pg_stat_user_tables pst
        WHERE pst.schemaname = 'public'
        ORDER BY pg_total_relation_size(pst.schemaname || '.' || pst.relname) DESC
        LIMIT 25
      `,
    ])

    return NextResponse.json({
      total_bytes: Number(sizeRows[0]?.total_bytes ?? 0),
      size_pretty: sizeRows[0]?.size_pretty ?? '0 bytes',
      warn_bytes: WARN_BYTES,
      crit_bytes: CRIT_BYTES,
      tables: tableRows.map(r => ({
        name: r.table_name,
        total_bytes: Number(r.total_bytes),
        size_pretty: r.size_pretty,
        row_count: Number(r.row_count),
        last_autovacuum: r.last_autovacuum,
        last_autoanalyze: r.last_autoanalyze,
      })),
      checked_at: checkedAt,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'DB monitor query failed'
    return NextResponse.json({
      total_bytes: 0,
      size_pretty: '0 bytes',
      warn_bytes: WARN_BYTES,
      crit_bytes: CRIT_BYTES,
      tables: [],
      checked_at: checkedAt,
      error: message,
    })
  }
}
