import type { ReactElement } from 'react'
import { createAdminClient } from '@/lib/supabase/server'

interface PgStatUserTableRow {
  relname: string | null
  n_live_tup: number | string | null
  last_vacuum: string | null
  last_autovacuum: string | null
  last_analyze: string | null
  last_autoanalyze: string | null
}

interface DbGrowthRow {
  tableName: string
  rowCount: number
  sizeMb: number | null
  lastUpdated: string | null
}

function toNumber(value: number | string | null): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function latestTimestamp(values: Array<string | null>): string | null {
  const timestamps = values
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  return timestamps[0] ?? null
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleString('th-TH', {
    month: 'short',
    day:   'numeric',
    hour:  '2-digit',
    minute: '2-digit',
  })
}

async function fetchDbGrowthRows(): Promise<DbGrowthRow[]> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('pg_stat_user_tables')
      .select('relname,n_live_tup,last_vacuum,last_autovacuum,last_analyze,last_autoanalyze')
      .order('n_live_tup', { ascending: false })
      .limit(25)

    if (error) return []

    const rows = (data ?? []) as PgStatUserTableRow[]
    return rows.map(row => ({
      tableName: row.relname ?? 'unknown',
      rowCount:  toNumber(row.n_live_tup),
      sizeMb:    null,
      lastUpdated: latestTimestamp([
        row.last_vacuum,
        row.last_autovacuum,
        row.last_analyze,
        row.last_autoanalyze,
      ]),
    }))
  } catch {
    return []
  }
}

export async function DbGrowthMonitor(): Promise<ReactElement> {
  const rows = await fetchDbGrowthRows()

  return (
    <section className="mt-8 rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-neutral-800">DB Growth Monitor (POSTLIVE-04)</h2>
          <p className="mt-0.5 text-[11px] text-neutral-400">
            pg_stat_user_tables snapshot — row growth and last maintenance activity
          </p>
        </div>
        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-black text-neutral-600">
          {rows.length} tables
        </span>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-[11px]">
          <thead>
            <tr className="border-b border-neutral-100">
              <th className="pb-1.5 pr-3 font-black text-neutral-500">Table name</th>
              <th className="pb-1.5 pr-3 text-right font-black text-neutral-500">Row count</th>
              <th className="pb-1.5 pr-3 text-right font-black text-neutral-500">Size (MB)</th>
              <th className="pb-1.5 font-black text-neutral-500">Last updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.tableName} className="border-b border-neutral-50 last:border-0">
                <td className="py-1.5 pr-3 font-mono text-[10px] text-neutral-700">{row.tableName}</td>
                <td className="py-1.5 pr-3 text-right font-black text-neutral-800">
                  {row.rowCount.toLocaleString('th-TH')}
                </td>
                <td className="py-1.5 pr-3 text-right text-neutral-500">
                  {row.sizeMb === null ? '—' : row.sizeMb.toLocaleString('th-TH', { maximumFractionDigits: 2 })}
                </td>
                <td className="py-1.5 text-neutral-500">{formatDate(row.lastUpdated)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="py-10 text-center text-xs text-neutral-400">
                  ยังไม่มีข้อมูล pg_stat_user_tables หรือ view ยังไม่ถูก expose ผ่าน Supabase
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
