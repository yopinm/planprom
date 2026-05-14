import Link from 'next/link'
import type { Metadata } from 'next'
import { requireAdminSession } from '@/lib/admin-auth'
import { db } from '@/lib/db'

export const metadata: Metadata = {
  title: 'ยอดผู้เข้าชม — Admin',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

type RangeKey = 'today' | '7d' | '30d' | 'custom'

function getDateRange(range: RangeKey, from?: string, to?: string) {
  const now = new Date()
  const end = new Date(now); end.setHours(23, 59, 59, 999)
  if (range === 'custom' && from && to)
    return { start: new Date(from + 'T00:00:00+07:00'), end: new Date(to + 'T23:59:59+07:00'), label: `${from} – ${to}` }
  if (range === 'today') {
    const start = new Date(now); start.setHours(0, 0, 0, 0)
    return { start, end, label: 'วันนี้' }
  }
  const days = range === '30d' ? 30 : 7
  const start = new Date(now); start.setDate(start.getDate() - days + 1); start.setHours(0, 0, 0, 0)
  return { start, end, label: `${days} วันล่าสุด` }
}

function getPrevRange(start: Date, end: Date) {
  const ms = end.getTime() - start.getTime()
  const prevEnd = new Date(start.getTime() - 1)
  const prevStart = new Date(prevEnd.getTime() - ms)
  return { prevStart, prevEnd }
}

function pctChange(curr: number, prev: number) {
  if (prev === 0) return null
  const pct = Math.round(((curr - prev) / prev) * 100)
  return {
    pct: Math.abs(pct),
    sign: pct >= 0 ? '↑' : '↓',
    color: pct >= 0 ? 'text-emerald-600' : 'text-red-500',
  }
}

// Generate last 14 calendar days (Bangkok TZ) as YYYY-MM-DD
function last14Days(): string[] {
  const days: string[] = []
  const now = new Date()
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const bkk = new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }))
    days.push(
      `${bkk.getFullYear()}-${String(bkk.getMonth() + 1).padStart(2, '0')}-${String(bkk.getDate()).padStart(2, '0')}`
    )
  }
  return days
}

export default async function PageviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>
}) {
  await requireAdminSession('/admin/login')
  const sp = await searchParams
  const range = (['today', '7d', '30d', 'custom'].includes(sp.range ?? '') ? sp.range : '7d') as RangeKey
  const { start, end, label } = getDateRange(range, sp.from, sp.to)
  const { prevStart, prevEnd } = getPrevRange(start, end)

  const [totalsRaw, prevTotalsRaw, daily14Raw, topPages, allTime] = await Promise.all([
    db<{ total_views: string; unique_sessions: string; unique_paths: string }[]>`
      SELECT
        COUNT(*)                   AS total_views,
        COUNT(DISTINCT session_id) AS unique_sessions,
        COUNT(DISTINCT path)       AS unique_paths
      FROM analytics_events
      WHERE event_name = 'page_view'
        AND created_at >= ${start} AND created_at <= ${end}
    `,

    db<{ total_views: string; unique_sessions: string; unique_paths: string }[]>`
      SELECT
        COUNT(*)                   AS total_views,
        COUNT(DISTINCT session_id) AS unique_sessions,
        COUNT(DISTINCT path)       AS unique_paths
      FROM analytics_events
      WHERE event_name = 'page_view'
        AND created_at >= ${prevStart} AND created_at <= ${prevEnd}
    `,

    db<{ day: string; views: string; sessions: string }[]>`
      SELECT
        TO_CHAR(created_at AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM-DD') AS day,
        COUNT(*)                                                        AS views,
        COUNT(DISTINCT session_id)                                      AS sessions
      FROM analytics_events
      WHERE event_name = 'page_view'
        AND created_at >= NOW() - INTERVAL '14 days'
      GROUP BY day
      ORDER BY day ASC
    `,

    db<{ path: string; views: string; sessions: string }[]>`
      SELECT
        path,
        COUNT(*)                   AS views,
        COUNT(DISTINCT session_id) AS sessions
      FROM analytics_events
      WHERE event_name = 'page_view'
        AND created_at >= ${start} AND created_at <= ${end}
      GROUP BY path
      ORDER BY views DESC
      LIMIT 30
    `,

    db<{ total: string }[]>`
      SELECT COUNT(*) AS total FROM analytics_events WHERE event_name = 'page_view'
    `,
  ])

  const kpi  = totalsRaw[0]     ?? { total_views: '0', unique_sessions: '0', unique_paths: '0' }
  const prev = prevTotalsRaw[0] ?? { total_views: '0', unique_sessions: '0', unique_paths: '0' }

  // Build 14-day filled chart data (zeros for missing days)
  const chartDays = last14Days()
  const viewsMap    = new Map(daily14Raw.map(r => [r.day, Number(r.views)]))
  const sessionsMap = new Map(daily14Raw.map(r => [r.day, Number(r.sessions)]))
  const chartData = chartDays.map((day, i) => ({
    day,
    views:    viewsMap.get(day)    ?? 0,
    sessions: sessionsMap.get(day) ?? 0,
    isThisWeek: i >= 7,
    label: new Date(day + 'T12:00:00+07:00').toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }),
  }))
  const maxBar = Math.max(...chartData.map(d => d.views), 1)

  const maxTopViews = Math.max(...topPages.map(p => Number(p.views)), 1)
  const hasAnyData  = chartData.some(d => d.views > 0)

  return (
    <main className="min-h-screen bg-neutral-50 pb-20">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-neutral-400">Report</p>
            <h1 className="text-2xl font-black text-black">👁️ ยอดผู้เข้าชม</h1>
            <p className="mt-0.5 text-sm text-neutral-500">{label}</p>
          </div>
          <Link href="/admin" className="rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-xs font-black text-neutral-600 shadow-sm hover:border-black">
            ← Admin
          </Link>
        </div>

        {/* B: 14-day bar chart */}
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[11px] font-black uppercase tracking-wider text-neutral-400">
              trend 14 วัน
            </h2>
            <div className="flex items-center gap-4 text-[10px] font-bold text-neutral-500">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-purple-300" />
                สัปดาห์ก่อน
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-indigo-500" />
                สัปดาห์นี้
              </span>
            </div>
          </div>

          {hasAnyData ? (
            <div className="flex items-end gap-[3px]" style={{ height: '96px' }}>
              {chartData.map((d, i) => {
                const heightPct = Math.round((d.views / maxBar) * 100)
                const barColor  = d.isThisWeek ? 'bg-indigo-500' : 'bg-purple-300'
                // divider between week 1 and week 2
                const showDivider = i === 7
                return (
                  <div key={d.day} className="relative flex flex-1 flex-col items-center">
                    {showDivider && (
                      <div className="absolute -left-[2px] top-0 h-full w-px bg-neutral-200 z-10" />
                    )}
                    <div className="group flex w-full flex-1 flex-col justify-end pb-5">
                      <div className="relative">
                        {d.views > 0 && (
                          <span className="pointer-events-none absolute -top-5 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded bg-black px-1 py-0.5 text-[9px] font-bold text-white opacity-0 group-hover:opacity-100 transition">
                            {d.views.toLocaleString('th-TH')}
                          </span>
                        )}
                        <div
                          className={`w-full rounded-t-sm transition-all ${barColor} ${d.views === 0 ? 'opacity-15' : ''}`}
                          style={{ height: `${Math.max(d.views === 0 ? 4 : heightPct, 4)}px`,
                                   maxHeight: '64px',
                                   minHeight: '4px' }}
                        />
                      </div>
                    </div>
                    <span className="absolute bottom-0 w-full truncate text-center text-[8px] text-neutral-400">
                      {d.label}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-neutral-400 italic">ยังไม่มีข้อมูล 14 วันล่าสุด</p>
          )}
        </section>

        {/* A: KPI cards + % comparison */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label:   'ยอดเข้าชม',
              curr:    Number(kpi.total_views),
              prevVal: Number(prev.total_views),
              color:   'text-indigo-600',
            },
            {
              label:   'เซสชันไม่ซ้ำ',
              curr:    Number(kpi.unique_sessions),
              prevVal: Number(prev.unique_sessions),
              color:   'text-emerald-600',
            },
            {
              label:   'หน้าที่เปิด',
              curr:    Number(kpi.unique_paths),
              prevVal: Number(prev.unique_paths),
              color:   'text-amber-600',
            },
            {
              label:   'ตลอดกาล',
              curr:    Number(allTime?.[0]?.total ?? 0),
              prevVal: null as number | null,
              color:   'text-neutral-500',
            },
          ].map(k => {
            const trend = k.prevVal !== null ? pctChange(k.curr, k.prevVal) : null
            return (
              <div key={k.label} className="rounded-2xl border border-neutral-200 bg-white px-4 py-5 text-center shadow-sm">
                <p className={`text-2xl font-black ${k.color}`}>{k.curr.toLocaleString('th-TH')}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">{k.label}</p>
                {trend ? (
                  <p className={`mt-1 text-[10px] font-black ${trend.color}`}>
                    {trend.sign} {trend.pct}% vs ช่วงก่อน
                  </p>
                ) : k.prevVal !== null ? (
                  <p className="mt-1 text-[10px] text-neutral-300">— ไม่มีข้อมูลก่อนหน้า</p>
                ) : null}
              </div>
            )
          })}
        </div>

        {/* Date range filter */}
        <div className="flex flex-wrap items-end gap-3">
          {(['today', '7d', '30d'] as RangeKey[]).map(r => (
            <Link key={r} href={`/admin/report/pageviews?range=${r}`}
              className={`rounded-full px-4 py-1.5 text-xs font-black transition ${
                range === r && range !== 'custom'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-neutral-200 text-neutral-600 hover:border-indigo-400'
              }`}>
              {r === 'today' ? 'วันนี้' : r === '7d' ? '7 วัน' : '30 วัน'}
            </Link>
          ))}
          <form method="GET" action="/admin/report/pageviews" className="flex items-center gap-2">
            <input type="hidden" name="range" value="custom" />
            <input type="date" name="from" defaultValue={sp.from ?? ''} required
              className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold outline-none focus:border-indigo-400" />
            <span className="text-xs text-neutral-400">–</span>
            <input type="date" name="to" defaultValue={sp.to ?? ''} required
              className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold outline-none focus:border-indigo-400" />
            <button type="submit"
              className={`rounded-full px-4 py-1.5 text-xs font-black transition ${
                range === 'custom'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-neutral-200 text-neutral-600 hover:border-indigo-400'
              }`}>
              ดู
            </button>
          </form>
        </div>

        {/* Top Pages */}
        {topPages.length > 0 && (
          <section>
            <h2 className="mb-3 text-[11px] font-black uppercase tracking-wider text-neutral-400">หน้าที่ดูมากที่สุด</h2>
            <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm divide-y divide-neutral-50">
              {topPages.map(p => (
                <div key={p.path} className="flex items-center gap-4 px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs text-neutral-700 truncate">
                      {(() => { try { return decodeURIComponent(p.path) } catch { return p.path } })()}
                    </p>
                    <div className="mt-1.5 h-1.5 rounded-full bg-neutral-100">
                      <div
                        className="h-1.5 rounded-full bg-indigo-400"
                        style={{ width: `${Math.round((Number(p.views) / maxTopViews) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-black text-sm text-indigo-600">{Number(p.views).toLocaleString('th-TH')}</p>
                    <p className="text-[10px] text-neutral-400">
                      {Math.round((Number(p.views) / maxTopViews) * 100)}% · {Number(p.sessions).toLocaleString('th-TH')} เซสชัน
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Daily detail table (14 วัน ครบ รวม 0) */}
        <section>
          <h2 className="mb-3 text-[11px] font-black uppercase tracking-wider text-neutral-400">รายวัน (14 วัน)</h2>
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50 text-[10px] font-black uppercase tracking-wider text-neutral-400">
                  <th className="px-5 py-3 text-left">วันที่</th>
                  <th className="px-5 py-3 text-right">เข้าชม</th>
                  <th className="px-5 py-3 text-right">เซสชัน</th>
                </tr>
              </thead>
              <tbody>
                {[...chartData].reverse().map((row, i) => (
                  <tr key={row.day} className={`border-b border-neutral-50 ${i % 2 === 1 ? 'bg-neutral-50/50' : ''}`}>
                    <td className="px-5 py-2.5 text-xs text-neutral-600">{row.label}</td>
                    <td className={`px-5 py-2.5 text-right font-black ${row.views > 0 ? 'text-indigo-600' : 'text-neutral-300'}`}>
                      {row.views.toLocaleString('th-TH')}
                    </td>
                    <td className={`px-5 py-2.5 text-right ${row.sessions > 0 ? 'text-neutral-600' : 'text-neutral-300'}`}>
                      {row.sessions.toLocaleString('th-TH')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </main>
  )
}
