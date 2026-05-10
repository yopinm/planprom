import Link from 'next/link'
import type { Metadata } from 'next'
import { requireAdminSession } from '@/lib/admin-auth'
import { db } from '@/lib/db'

export const metadata: Metadata = {
  title: 'Download Log — Admin Report',
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

export default async function DownloadLogPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>
}) {
  await requireAdminSession('/admin/login')
  const sp = await searchParams
  const range = (['today', '7d', '30d', 'custom'].includes(sp.range ?? '') ? sp.range : '7d') as RangeKey
  const { start, end, label } = getDateRange(range, sp.from, sp.to)

  // Single-template orders ที่ถูกดาวน์โหลด
  const singleDownloads = await db<{
    order_number: string
    template_title: string
    customer_line_id: string
    download_count: number
    download_expires_at: string | null
    paid_at: string | null
    created_at: string
  }[]>`
    SELECT
      o.order_number,
      t.title AS template_title,
      o.customer_line_id,
      o.download_count,
      o.download_expires_at,
      o.paid_at,
      o.created_at
    FROM template_orders o
    JOIN templates t ON t.id = o.template_id
    WHERE o.status = 'paid'
      AND o.download_count > 0
      AND o.created_at >= ${start} AND o.created_at <= ${end}
    ORDER BY o.created_at DESC
    LIMIT 300
  `

  // Cart order items ที่ถูกดาวน์โหลด
  const cartDownloads = await db<{
    order_uid: string
    template_title: string
    customer_line_id: string
    download_count: number
    download_expires_at: string | null
    paid_at: string | null
    created_at: string
  }[]>`
    SELECT
      o.order_uid,
      t.title AS template_title,
      o.customer_line_id,
      oi.download_count,
      oi.download_expires_at,
      o.paid_at,
      o.created_at
    FROM order_items oi
    JOIN orders o     ON o.id = oi.order_id
    JOIN templates t  ON t.id = oi.template_id
    WHERE o.status = 'paid'
      AND oi.download_count > 0
      AND o.created_at >= ${start} AND o.created_at <= ${end}
    ORDER BY o.created_at DESC
    LIMIT 300
  `

  // Per-template stats
  const byTemplate = await db<{
    title: string
    total_downloads: string
    unique_orders: string
  }[]>`
    SELECT
      t.title,
      SUM(o.download_count)   AS total_downloads,
      COUNT(o.id)             AS unique_orders
    FROM template_orders o
    JOIN templates t ON t.id = o.template_id
    WHERE o.status = 'paid'
      AND o.download_count > 0
      AND o.created_at >= ${start} AND o.created_at <= ${end}
    GROUP BY t.title
    ORDER BY total_downloads DESC
  `

  const totalDownloads = singleDownloads.reduce((s, r) => s + r.download_count, 0)
    + cartDownloads.reduce((s, r) => s + r.download_count, 0)
  const uniqueCustomers = new Set([
    ...singleDownloads.map(r => r.customer_line_id),
    ...cartDownloads.map(r => r.customer_line_id),
  ]).size

  const allRows = [
    ...singleDownloads.map(r => ({ ref: r.order_number, title: r.template_title, customer: r.customer_line_id, count: r.download_count, expires: r.download_expires_at, at: r.created_at })),
    ...cartDownloads.map(r => ({ ref: r.order_uid, title: r.template_title, customer: r.customer_line_id, count: r.download_count, expires: r.download_expires_at, at: r.created_at })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())

  return (
    <main className="min-h-screen bg-neutral-50 pb-20">
      <div className="mx-auto max-w-5xl px-4 py-8">

        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-neutral-400">Report</p>
            <h1 className="text-2xl font-black text-black">📥 Download Log</h1>
            <p className="mt-0.5 text-sm text-neutral-500">{label}</p>
          </div>
          <Link href="/admin" className="rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-xs font-black text-neutral-600 shadow-sm hover:border-black">← Admin</Link>
        </div>

        {/* KPI */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { label: 'Total Downloads', value: totalDownloads, color: 'text-indigo-600' },
            { label: 'Unique Customers', value: uniqueCustomers, color: 'text-green-600' },
            { label: 'Templates', value: byTemplate.length, color: 'text-amber-600' },
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
            <Link key={r} href={`/admin/report/downloads?range=${r}`}
              className={`rounded-full px-4 py-1.5 text-xs font-black transition ${range === r && range !== 'custom' ? 'bg-indigo-600 text-white' : 'bg-white border border-neutral-200 text-neutral-600 hover:border-indigo-400'}`}>
              {r === 'today' ? 'วันนี้' : r === '7d' ? '7 วัน' : '30 วัน'}
            </Link>
          ))}
          <form method="GET" action="/admin/report/downloads" className="flex items-center gap-2">
            <input type="hidden" name="range" value="custom" />
            <input type="date" name="from" defaultValue={sp.from ?? ''} required className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold outline-none focus:border-indigo-400" />
            <span className="text-xs text-neutral-400">–</span>
            <input type="date" name="to" defaultValue={sp.to ?? ''} required className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold outline-none focus:border-indigo-400" />
            <button type="submit" className={`rounded-full px-4 py-1.5 text-xs font-black transition ${range === 'custom' ? 'bg-indigo-600 text-white' : 'bg-white border border-neutral-200 text-neutral-600 hover:border-indigo-400'}`}>ดู</button>
          </form>
        </div>

        {/* By template */}
        {byTemplate.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-3 text-[11px] font-black uppercase tracking-wider text-neutral-400">แยก Template</h2>
            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50 text-[10px] font-black uppercase tracking-wider text-neutral-400">
                    <th className="px-5 py-3 text-left">Template</th>
                    <th className="px-5 py-3 text-right">Downloads</th>
                    <th className="px-5 py-3 text-right">Orders</th>
                  </tr>
                </thead>
                <tbody>
                  {byTemplate.map((row, i) => (
                    <tr key={row.title} className={`border-b border-neutral-50 ${i % 2 === 1 ? 'bg-neutral-50/50' : ''}`}>
                      <td className="px-5 py-3 font-bold text-neutral-800 max-w-xs truncate">{row.title}</td>
                      <td className="px-5 py-3 text-right font-black text-indigo-600">{row.total_downloads}</td>
                      <td className="px-5 py-3 text-right text-neutral-500">{row.unique_orders}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* All download events */}
        <section className="mt-6">
          <h2 className="mb-3 text-[11px] font-black uppercase tracking-wider text-neutral-400">รายการดาวน์โหลด</h2>
          {allRows.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-400 italic">ไม่มีการดาวน์โหลดในช่วงนี้</p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-neutral-100 bg-neutral-50 text-[10px] font-black uppercase tracking-wider text-neutral-400">
                      <th className="px-4 py-3 text-left">Order</th>
                      <th className="px-4 py-3 text-left">Template</th>
                      <th className="px-4 py-3 text-center">ครั้ง</th>
                      <th className="px-4 py-3 text-left">หมดอายุ</th>
                      <th className="px-4 py-3 text-left">เวลา</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allRows.map((row, i) => (
                      <tr key={`${row.ref}-${i}`} className={`border-b border-neutral-50 ${i % 2 === 1 ? 'bg-neutral-50/50' : ''}`}>
                        <td className="px-4 py-2.5 font-mono font-bold text-neutral-600 max-w-[120px] truncate">{row.ref}</td>
                        <td className="px-4 py-2.5 text-neutral-700 max-w-[180px] truncate">{row.title}</td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`font-black ${row.count >= 3 ? 'text-red-500' : 'text-indigo-600'}`}>{row.count}/3</span>
                        </td>
                        <td className="px-4 py-2.5 text-neutral-400 whitespace-nowrap">
                          {row.expires ? new Date(row.expires).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-neutral-500 whitespace-nowrap">
                          {new Date(row.at).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

      </div>
    </main>
  )
}
