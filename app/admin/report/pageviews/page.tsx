import Link from 'next/link'
import type { Metadata } from 'next'
import { requireAdminSession } from '@/lib/admin-auth'
import { db } from '@/lib/db'

export const metadata: Metadata = {
  title: 'Pageviews — Admin Report',
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

export default async function PageviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>
}) {
  await requireAdminSession('/admin/login')
  const sp = await searchParams
  const range = (['today', '7d', '30d', 'custom'].includes(sp.range ?? '') ? sp.range : '7d') as RangeKey
  const { start, end, label } = getDateRange(range, sp.from, sp.to)

  // KPI totals
  const [totals] = await db<{ total_views: string; unique_sessions: string; unique_paths: string }[]>`
    SELECT
      COUNT(*)                       AS total_views,
      COUNT(DISTINCT session_id)     AS unique_sessions,
      COUNT(DISTINCT path)           AS unique_paths
    FROM analytics_events
    WHERE event_name = 'page_view'
      AND created_at >= ${start} AND created_at <= ${end}
  `

  // Daily breakdown
  const daily = await db<{ day: string; views: string; sessions: string }[]>`
    SELECT
      TO_CHAR(created_at AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM-DD') AS day,
      COUNT(*)                                                        AS views,
      COUNT(DISTINCT session_id)                                      AS sessions
    FROM analytics_events
    WHERE event_name = 'page_view'
      AND created_at >= ${start} AND created_at <= ${end}
    GROUP BY day
    ORDER BY day DESC
  `

  // Top pages
  const topPages = await db<{ path: string; views: string; sessions: string }[]>`
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
  `

  // All-time total (for context)
  const [allTime] = await db<{ total: string }[]>`
    SELECT COUNT(*) AS total FROM analytics_events WHERE event_name = 'page_view'
  `

  const maxViews = Math.max(...topPages.map(p => Number(p.views)), 1)

  return (
    <main className="min-h-screen bg-neutral-50 pb-20">
      <div className="mx-auto max-w-5xl px-4 py-8">

        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-neutral-400">Report</p>
            <h1 className="text-2xl font-black text-black">👁️ Pageviews</h1>
            <p className="mt-0.5 text-sm text-neutral-500">{label} · ทั้งหมดตลอดกาล: <strong>{Number(allTime?.total ?? 0).toLocaleString()}</strong> views</p>
          </div>
          <Link href="/admin" className="rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-xs font-black text-neutral-600 shadow-sm hover:border-black">← Admin</Link>
        </div>

        {/* KPI */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { label: 'Page Views', value: Number(totals?.total_views ?? 0).toLocaleString(), color: 'text-indigo-600' },
            { label: 'Unique Sessions', value: Number(totals?.unique_sessions ?? 0).toLocaleString(), color: 'text-emerald-600' },
            { label: 'Unique Pages', value: Number(totals?.unique_paths ?? 0).toLocaleString(), color: 'text-amber-600' },
          ].map(k => (
            <div key={k.label} className="rounded-2xl border border-neutral-200 bg-white px-4 py-5 text-center shadow-sm">
              <p className={`text-2xl font-black ${k.color}`}>{k.value}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">{k.label}</p>
            </div>
          ))}
        </div>

        {/* Date range filter */}
        <div className="mt-5 flex flex-wrap items-end gap-3">
          {(['today', '7d', '30d'] as RangeKey[]).map(r => (
            <Link key={r} href={`/admin/report/pageviews?range=${r}`}
              className={`rounded-full px-4 py-1.5 text-xs font-black transition ${range === r && range !== 'custom' ? 'bg-indigo-600 text-white' : 'bg-white border border-neutral-200 text-neutral-600 hover:border-indigo-400'}`}>
              {r === 'today' ? 'วันนี้' : r === '7d' ? '7 วัน' : '30 วัน'}
            </Link>
          ))}
          <form method="GET" action="/admin/report/pageviews" className="flex items-center gap-2">
            <input type="hidden" name="range" value="custom" />
            <input type="date" name="from" defaultValue={sp.from ?? ''} required className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold outline-none focus:border-indigo-400" />
            <span className="text-xs text-neutral-400">–</span>
            <input type="date" name="to" defaultValue={sp.to ?? ''} required className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold outline-none focus:border-indigo-400" />
            <button type="submit" className={`rounded-full px-4 py-1.5 text-xs font-black transition ${range === 'custom' ? 'bg-indigo-600 text-white' : 'bg-white border border-neutral-200 text-neutral-600 hover:border-indigo-400'}`}>ดู</button>
          </form>
        </div>

        {/* Top Pages */}
        {topPages.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-3 text-[11px] font-black uppercase tracking-wider text-neutral-400">หน้าที่ดูมากที่สุด</h2>
            <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm divide-y divide-neutral-50">
              {topPages.map(p => (
                <div key={p.path} className="flex items-center gap-4 px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs text-neutral-700 truncate">{p.path}</p>
                    <div className="mt-1.5 h-1.5 rounded-full bg-neutral-100">
                      <div
                        className="h-1.5 rounded-full bg-indigo-400"
                        style={{ width: `${Math.round((Number(p.views) / maxViews) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-sm text-indigo-600">{Number(p.views).toLocaleString()}</p>
                    <p className="text-[10px] text-neutral-400">{Number(p.sessions).toLocaleString()} sessions</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Daily breakdown */}
        {daily.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-3 text-[11px] font-black uppercase tracking-wider text-neutral-400">รายวัน</h2>
            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50 text-[10px] font-black uppercase tracking-wider text-neutral-400">
                    <th className="px-5 py-3 text-left">วันที่</th>
                    <th className="px-5 py-3 text-right">Views</th>
                    <th className="px-5 py-3 text-right">Sessions</th>
                  </tr>
                </thead>
                <tbody>
                  {daily.map((row, i) => (
                    <tr key={row.day} className={`border-b border-neutral-50 ${i % 2 === 1 ? 'bg-neutral-50/50' : ''}`}>
                      <td className="px-5 py-2.5 font-mono text-xs text-neutral-600">{row.day}</td>
                      <td className="px-5 py-2.5 text-right font-black text-indigo-600">{Number(row.views).toLocaleString()}</td>
                      <td className="px-5 py-2.5 text-right text-neutral-500">{Number(row.sessions).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {daily.length === 0 && (
          <p className="mt-10 py-8 text-center text-sm text-neutral-400 italic">ไม่มีข้อมูลในช่วงนี้</p>
        )}

      </div>
    </main>
  )
}
