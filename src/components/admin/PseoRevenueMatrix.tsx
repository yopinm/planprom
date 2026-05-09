// POSTLIVE-08: pSEO Revenue Matrix
// Flags pages with pageview ≥ 100 but outbound clicks = 0.
//
// pageviews  = analytics_events WHERE event_name='page_view'       GROUP BY path
// out-clicks = analytics_events WHERE event_name='intermediate_continue' GROUP BY referrer-path
//
// Both tables live on VPS postgres → uses db, NOT Supabase.

import type { ReactElement } from 'react'
import { db } from '@/lib/db'

export interface PseoMatrixRow {
  path:        string
  view_count:  number
  click_count: number
  ctr_pct:     number
  flagged:     boolean
}

export function computePseoFlag(viewCount: number, clickCount: number): boolean {
  return viewCount >= 100 && clickCount === 0
}

async function fetchMatrix(): Promise<PseoMatrixRow[]> {
  try {
    const rows = await db<PseoMatrixRow[]>`
      WITH pageviews AS (
        SELECT
          path,
          COUNT(*)::int AS view_count
        FROM analytics_events
        WHERE event_name = 'page_view'
          AND path IS NOT NULL
          AND path NOT LIKE '/go/%'
          AND path NOT LIKE '/admin%'
          AND path NOT LIKE '/api%'
          AND path NOT LIKE '/auth%'
        GROUP BY path
      ),
      outbound AS (
        SELECT
          regexp_replace(referrer, '^https?://[^/]+', '') AS path,
          COUNT(*)::int AS click_count
        FROM analytics_events
        WHERE event_name = 'intermediate_continue'
          AND referrer IS NOT NULL
          AND referrer <> ''
        GROUP BY 1
      )
      SELECT
        p.path,
        p.view_count,
        COALESCE(o.click_count, 0) AS click_count,
        CASE
          WHEN p.view_count > 0
          THEN ROUND(
            COALESCE(o.click_count, 0)::numeric / p.view_count * 100, 1
          )
          ELSE 0
        END AS ctr_pct,
        (p.view_count >= 100 AND COALESCE(o.click_count, 0) = 0) AS flagged
      FROM pageviews p
      LEFT JOIN outbound o ON p.path = o.path
      ORDER BY
        (p.view_count >= 100 AND COALESCE(o.click_count, 0) = 0) DESC,
        p.view_count DESC
      LIMIT 50
    `
    return rows
  } catch {
    return []
  }
}

export async function PseoRevenueMatrix(): Promise<ReactElement> {
  const rows = await fetchMatrix()
  const flagged = rows.filter(r => r.flagged)
  const totalViews = rows.reduce((s, r) => s + r.view_count, 0)

  return (
    <section className="mt-8 rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-neutral-800">pSEO Revenue Matrix (POSTLIVE-08)</h2>
          <p className="mt-0.5 text-[11px] text-neutral-400">
            หน้าที่ pageview ≥ 100 แต่ยังไม่มี outbound click → auto-flag
          </p>
        </div>
        {flagged.length > 0 && (
          <span className="rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-black text-red-600">
            {flagged.length} หน้าต้องแก้
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          { label: 'หน้าทั้งหมด',    value: String(rows.length),                   warn: false },
          { label: 'Flagged',         value: String(flagged.length),                warn: flagged.length > 0 },
          { label: 'Total Pageviews', value: totalViews.toLocaleString('th-TH'),    warn: false },
        ].map(s => (
          <div key={s.label} className="rounded-2xl bg-neutral-50 px-3 py-2 text-center">
            <p className={`text-lg font-black ${s.warn ? 'text-red-600' : 'text-black'}`}>{s.value}</p>
            <p className="mt-0.5 text-[10px] font-semibold text-neutral-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[580px] text-left text-[11px]">
          <thead>
            <tr className="border-b border-neutral-100">
              <th className="pb-1.5 pr-3 font-black text-neutral-500">Path</th>
              <th className="pb-1.5 pr-3 text-right font-black text-neutral-500">Views</th>
              <th className="pb-1.5 pr-3 text-right font-black text-neutral-500">Clicks</th>
              <th className="pb-1.5 pr-3 text-right font-black text-neutral-500">CTR%</th>
              <th className="pb-1.5 text-center font-black text-neutral-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.path} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50">
                <td className="max-w-[240px] truncate py-1.5 pr-3 font-mono text-[10px] text-neutral-700">
                  {row.path}
                </td>
                <td className="py-1.5 pr-3 text-right text-neutral-600">
                  {row.view_count.toLocaleString('th-TH')}
                </td>
                <td className="py-1.5 pr-3 text-right text-neutral-600">
                  {row.click_count.toLocaleString('th-TH')}
                </td>
                <td className={`py-1.5 pr-3 text-right font-bold ${
                  row.ctr_pct >= 5 ? 'text-green-700' :
                  row.ctr_pct >= 1 ? 'text-yellow-600' :
                  row.click_count > 0 ? 'text-neutral-500' : 'text-neutral-300'
                }`}>
                  {Number(row.ctr_pct).toFixed(1)}%
                </td>
                <td className="py-1.5 text-center">
                  {row.flagged ? (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-black text-red-600">FLAG</span>
                  ) : (
                    <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">OK</span>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-xs text-neutral-400">
                  ยังไม่มีข้อมูล pageview
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
