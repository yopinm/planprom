import Link from 'next/link'
import type { Metadata } from 'next'
import { requireAdminSession } from '@/lib/admin-auth'
import { db } from '@/lib/db'

export const metadata: Metadata = {
  title: 'ยอดขาย — Admin Report',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

type RangeKey = 'today' | '7d' | '30d' | 'custom'

const RANGE_LABELS: Record<RangeKey, string> = {
  today:  'วันนี้',
  '7d':   '7 วัน',
  '30d':  '30 วัน',
  custom: 'กำหนดเอง',
}

function getDateRange(range: RangeKey, from?: string, to?: string): { start: Date; end: Date; label: string } {
  const now = new Date()
  const endOfDay = new Date(now)
  endOfDay.setHours(23, 59, 59, 999)

  if (range === 'custom' && from && to) {
    return { start: new Date(from + 'T00:00:00+07:00'), end: new Date(to + 'T23:59:59+07:00'), label: `${from} – ${to}` }
  }
  if (range === 'today') {
    const start = new Date(now); start.setHours(0, 0, 0, 0)
    return { start, end: endOfDay, label: 'วันนี้' }
  }
  const days = range === '30d' ? 30 : 7
  const start = new Date(now); start.setDate(start.getDate() - days + 1); start.setHours(0, 0, 0, 0)
  return { start, end: endOfDay, label: `${days} วันล่าสุด` }
}

export default async function SalesReportPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>
}) {
  await requireAdminSession('/admin/login')
  const sp = await searchParams
  const range = (['today', '7d', '30d', 'custom'].includes(sp.range ?? '') ? sp.range : '7d') as RangeKey
  const { start, end, label } = getDateRange(range, sp.from, sp.to)

  const [kpi] = await db<{
    total_orders:   string
    paid_orders:    string
    revenue:        string
    avg_order:      string
    pending_orders: string
  }[]>`
    SELECT
      COUNT(*)                                                        AS total_orders,
      COUNT(*) FILTER (WHERE status = 'paid')                        AS paid_orders,
      COALESCE(SUM(total_baht) FILTER (WHERE status = 'paid'), 0)   AS revenue,
      COALESCE(AVG(total_baht) FILTER (WHERE status = 'paid'), 0)   AS avg_order,
      COUNT(*) FILTER (WHERE status = 'pending_payment')             AS pending_orders
    FROM orders
    WHERE created_at >= ${start} AND created_at <= ${end}
  `

  const daily = await db<{ day: string; orders: string; paid: string; revenue: string }[]>`
    SELECT
      DATE(created_at AT TIME ZONE 'Asia/Bangkok')                   AS day,
      COUNT(*)                                                        AS orders,
      COUNT(*) FILTER (WHERE status = 'paid')                        AS paid,
      COALESCE(SUM(total_baht) FILTER (WHERE status = 'paid'), 0)   AS revenue
    FROM orders
    WHERE created_at >= ${start} AND created_at <= ${end}
    GROUP BY day
    ORDER BY day DESC
  `

  const byTemplate = await db<{ title: string; orders: string; paid: string; revenue: string }[]>`
    SELECT
      t.title,
      COUNT(DISTINCT oi.order_id)                                                    AS orders,
      COUNT(DISTINCT oi.order_id) FILTER (WHERE o.status = 'paid')                  AS paid,
      COALESCE(SUM(t.price_baht) FILTER (WHERE o.status = 'paid'), 0)              AS revenue
    FROM order_items oi
    JOIN orders    o ON o.id  = oi.order_id
    JOIN templates t ON t.id  = oi.template_id
    WHERE o.created_at >= ${start} AND o.created_at <= ${end}
    GROUP BY t.title
    ORDER BY revenue DESC
  `

  const totalRevenue  = Number(kpi?.revenue      ?? 0)
  const totalOrders   = Number(kpi?.total_orders  ?? 0)
  const paidOrders    = Number(kpi?.paid_orders   ?? 0)
  const avgOrder      = Number(kpi?.avg_order     ?? 0)
  const pendingOrders = Number(kpi?.pending_orders ?? 0)

  return (
    <main className="min-h-screen bg-neutral-50 pb-20">
      <div className="mx-auto max-w-4xl px-4 py-8">

        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-neutral-400">Report</p>
            <h1 className="text-2xl font-black text-black">📈 ยอดขาย</h1>
            <p className="mt-0.5 text-sm text-neutral-500">{label}</p>
          </div>
          <Link href="/admin" className="rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-xs font-black text-neutral-600 shadow-sm hover:border-black">
            ← Admin
          </Link>
        </div>

        {/* Date range filter */}
        <div className="mt-6 flex flex-wrap items-end gap-3">
          {(['today', '7d', '30d'] as RangeKey[]).map(r => (
            <Link key={r} href={`/admin/report/sales?range=${r}`}
              className={`rounded-full px-4 py-1.5 text-xs font-black transition ${
                range === r && range !== 'custom'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-neutral-200 text-neutral-600 hover:border-indigo-400'
              }`}>
              {RANGE_LABELS[r]}
            </Link>
          ))}
          <form method="GET" action="/admin/report/sales" className="flex items-center gap-2">
            <input type="hidden" name="range" value="custom" />
            <input type="date" name="from" defaultValue={sp.from ?? ''} required
              className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold outline-none focus:border-indigo-400" />
            <span className="text-xs text-neutral-400">–</span>
            <input type="date" name="to" defaultValue={sp.to ?? ''} required
              className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold outline-none focus:border-indigo-400" />
            <button type="submit"
              className={`rounded-full px-4 py-1.5 text-xs font-black transition ${
                range === 'custom' ? 'bg-indigo-600 text-white' : 'bg-white border border-neutral-200 text-neutral-600 hover:border-indigo-400'
              }`}>
              ดู
            </button>
          </form>
        </div>

        {/* KPI */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Revenue',        value: `฿${totalRevenue.toLocaleString('th-TH')}`, color: totalRevenue > 0 ? 'text-indigo-600' : 'text-neutral-300' },
            { label: 'Orders จ่ายแล้ว', value: String(paidOrders),                        color: paidOrders > 0  ? 'text-green-600'  : 'text-neutral-300' },
            { label: 'Avg / Order',    value: `฿${avgOrder.toFixed(0)}`,                  color: avgOrder > 0    ? 'text-amber-600'  : 'text-neutral-300' },
            { label: 'Pending',        value: String(pendingOrders),                       color: pendingOrders > 0 ? 'text-orange-500' : 'text-neutral-300' },
          ].map(k => (
            <div key={k.label} className="rounded-2xl border border-neutral-200 bg-white px-4 py-5 text-center shadow-sm">
              <p className={`text-2xl font-black ${k.color}`}>{k.value}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">{k.label}</p>
            </div>
          ))}
        </div>

        {/* Daily breakdown */}
        <section className="mt-8">
          <h2 className="mb-3 text-[11px] font-black uppercase tracking-wider text-neutral-400">รายวัน</h2>
          {daily.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-400 italic">ไม่มีข้อมูลในช่วงนี้</p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50 text-[10px] font-black uppercase tracking-wider text-neutral-400">
                    <th className="px-5 py-3 text-left">วันที่</th>
                    <th className="px-5 py-3 text-right">Orders</th>
                    <th className="px-5 py-3 text-right">จ่ายแล้ว</th>
                    <th className="px-5 py-3 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {daily.map((row, i) => (
                    <tr key={row.day} className={`border-b border-neutral-50 ${i % 2 === 1 ? 'bg-neutral-50/50' : ''}`}>
                      <td className="px-5 py-3 font-bold text-neutral-700">
                        {new Date(row.day).toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </td>
                      <td className="px-5 py-3 text-right text-neutral-500">{row.orders}</td>
                      <td className="px-5 py-3 text-right font-bold text-green-600">{row.paid}</td>
                      <td className="px-5 py-3 text-right font-black text-indigo-600">฿{Number(row.revenue).toLocaleString('th-TH')}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-neutral-200 bg-neutral-50 font-black">
                    <td className="px-5 py-3 text-neutral-600">รวม</td>
                    <td className="px-5 py-3 text-right text-neutral-600">{totalOrders}</td>
                    <td className="px-5 py-3 text-right text-green-700">{paidOrders}</td>
                    <td className="px-5 py-3 text-right text-indigo-700">฿{totalRevenue.toLocaleString('th-TH')}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>

        {/* Per-template breakdown */}
        {byTemplate.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-[11px] font-black uppercase tracking-wider text-neutral-400">แยก Template</h2>
            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50 text-[10px] font-black uppercase tracking-wider text-neutral-400">
                    <th className="px-5 py-3 text-left">Template</th>
                    <th className="px-5 py-3 text-right">Orders</th>
                    <th className="px-5 py-3 text-right">จ่ายแล้ว</th>
                    <th className="px-5 py-3 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {byTemplate.map((row, i) => (
                    <tr key={row.title} className={`border-b border-neutral-50 ${i % 2 === 1 ? 'bg-neutral-50/50' : ''}`}>
                      <td className="px-5 py-3 font-bold text-neutral-800 max-w-xs truncate">{row.title}</td>
                      <td className="px-5 py-3 text-right text-neutral-500">{row.orders}</td>
                      <td className="px-5 py-3 text-right font-bold text-green-600">{row.paid}</td>
                      <td className="px-5 py-3 text-right font-black text-indigo-600">฿{Number(row.revenue).toLocaleString('th-TH')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

      </div>
    </main>
  )
}
