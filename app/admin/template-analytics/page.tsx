// /admin/template-analytics — Template store analytics
import Link from 'next/link'
import type { Metadata } from 'next'
import { requireAdminSession } from '@/lib/admin-auth'
import { db } from '@/lib/db'

export const metadata: Metadata = {
  title: 'Template Analytics — Admin',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

type TemplateStat = {
  id: string
  title: string
  slug: string
  tier: string
  price_baht: number
  status: string
  sale_count: number
  revenue: string
  order_count: string
  download_total: string
  paid_count: string
  pending_count: string
}

type DailySale = {
  day: string
  orders: string
  revenue: string
}

type TypeStat = {
  document_type: string
  count: string
  sale_count: string
  revenue: string
}

export default async function AdminTemplateAnalyticsPage() {
  await requireAdminSession('/admin/login')

  const [summary] = await db<{
    total_revenue: string
    paid_orders: string
    pending_orders: string
    total_downloads: string
    unique_buyers: string
  }[]>`
    SELECT
      COALESCE(SUM(CASE WHEN status IN ('paid','pending_verify') THEN amount_baht ELSE 0 END), 0) AS total_revenue,
      COUNT(*) FILTER (WHERE status IN ('paid','pending_verify'))  AS paid_orders,
      COUNT(*) FILTER (WHERE status = 'pending_payment')           AS pending_orders,
      COALESCE(SUM(download_count), 0)                             AS total_downloads,
      COUNT(DISTINCT customer_line_id) FILTER (WHERE status IN ('paid','pending_verify')) AS unique_buyers
    FROM template_orders
  `.catch(() => [{
    total_revenue: '0', paid_orders: '0', pending_orders: '0',
    total_downloads: '0', unique_buyers: '0',
  }])

  const templateStats = await db<TemplateStat[]>`
    SELECT
      t.id, t.title, t.slug, t.tier, t.price_baht, t.status, t.sale_count,
      COALESCE(SUM(CASE WHEN o.status IN ('paid','pending_verify') THEN o.amount_baht ELSE 0 END), 0) AS revenue,
      COUNT(o.id)                                                                    AS order_count,
      COALESCE(SUM(o.download_count), 0)                                             AS download_total,
      COUNT(o.id) FILTER (WHERE o.status IN ('paid','pending_verify'))               AS paid_count,
      COUNT(o.id) FILTER (WHERE o.status = 'pending_payment')                        AS pending_count
    FROM templates t
    LEFT JOIN template_orders o ON o.template_id = t.id
    GROUP BY t.id
    ORDER BY revenue DESC, t.created_at DESC
  `.catch(() => [] as TemplateStat[])

  const typeStats = await db<TypeStat[]>`
    SELECT
      t.document_type,
      COUNT(DISTINCT t.id) AS count,
      COALESCE(SUM(t.sale_count), 0) AS sale_count,
      COALESCE(SUM(CASE WHEN o.status IN ('paid','pending_verify') THEN o.amount_baht ELSE 0 END), 0) AS revenue
    FROM templates t
    LEFT JOIN template_orders o ON o.template_id = t.id
    GROUP BY t.document_type
    ORDER BY revenue DESC
  `.catch(() => [] as TypeStat[])

  const dailySales = await db<DailySale[]>`
    SELECT
      DATE(created_at AT TIME ZONE 'Asia/Bangkok') AS day,
      COUNT(*) FILTER (WHERE status IN ('paid','pending_verify')) AS orders,
      COALESCE(SUM(CASE WHEN status IN ('paid','pending_verify') THEN amount_baht ELSE 0 END), 0) AS revenue
    FROM template_orders
    WHERE created_at > NOW() - INTERVAL '14 days'
    GROUP BY day ORDER BY day DESC
  `.catch(() => [] as DailySale[])

  const TIER_COLOR: Record<string, string> = {
    free:     'bg-emerald-100 text-emerald-700',
    standard: 'bg-amber-100 text-amber-700',
    premium:  'bg-violet-100 text-violet-700',
    ultra:    'bg-rose-100 text-rose-700',
  }

  return (
    <main className="min-h-screen bg-neutral-50 pb-20">
      <div className="mx-auto max-w-6xl px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <Link href="/admin" className="text-xs font-bold text-neutral-400 hover:text-black">← Admin</Link>
          <h1 className="mt-1 text-2xl font-black text-black">Template Analytics</h1>
        </div>

        {/* KPI cards */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: 'รายได้รวม',      value: `฿${Number(summary.total_revenue).toLocaleString('th-TH')}`, color: 'text-emerald-700', sub: 'all time' },
            { label: 'Orders สำเร็จ',  value: summary.paid_orders,     color: 'text-green-700',   sub: 'paid' },
            { label: 'รอชำระ',          value: summary.pending_orders,  color: 'text-yellow-700',  sub: 'pending' },
            { label: 'ดาวน์โหลด',       value: summary.total_downloads, color: 'text-blue-700',    sub: 'ครั้ง' },
            { label: 'ลูกค้า unique',   value: summary.unique_buyers,   color: 'text-violet-700',  sub: 'LINE IDs' },
          ].map(k => (
            <div key={k.label} className="rounded-2xl border border-neutral-200 bg-white px-4 py-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">{k.label}</p>
              <p className={`mt-1 text-2xl font-black ${k.color}`}>{k.value}</p>
              <p className="mt-0.5 text-[10px] text-neutral-400">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Breakdown by document type */}
        {typeStats.length > 0 && (
          <div className="mb-8 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-black text-neutral-900">ยอดขายแยกตามประเภทเอกสาร</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {typeStats.map(s => {
                const icons: Record<string, string> = { checklist: '✅', planner: '📅', form: '📝', report: '📊' }
                const colors: Record<string, string> = {
                  checklist: 'border-blue-200 bg-blue-50 text-blue-900',
                  planner:   'border-purple-200 bg-purple-50 text-purple-900',
                  form:      'border-teal-200 bg-teal-50 text-teal-900',
                  report:    'border-orange-200 bg-orange-50 text-orange-900',
                }
                return (
                  <div key={s.document_type} className={`rounded-xl border px-4 py-4 ${colors[s.document_type] ?? 'border-neutral-200 bg-neutral-50 text-neutral-900'}`}>
                    <p className="text-lg">{icons[s.document_type] ?? '📄'} <span className="font-black capitalize">{s.document_type}</span></p>
                    <p className="mt-2 text-2xl font-black">฿{Number(s.revenue).toLocaleString('th-TH')}</p>
                    <p className="mt-0.5 text-xs opacity-70">{s.sale_count} ขาย · {s.count} ชิ้น</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Daily sales — last 14 days */}
        {dailySales.length > 0 && (
          <div className="mb-8 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-black text-neutral-900">ยอดขาย 14 วันล่าสุด</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 text-left text-xs font-bold uppercase tracking-wider text-neutral-400">
                    <th className="pb-2 pr-6">วัน</th>
                    <th className="pb-2 pr-6">Orders</th>
                    <th className="pb-2">รายได้</th>
                  </tr>
                </thead>
                <tbody>
                  {dailySales.map(d => (
                    <tr key={d.day} className="border-b border-neutral-50">
                      <td className="py-2 pr-6 font-mono text-neutral-600">
                        {new Date(d.day).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="py-2 pr-6 font-bold text-neutral-900">{d.orders}</td>
                      <td className="py-2 font-bold text-emerald-700">
                        ฿{Number(d.revenue).toLocaleString('th-TH')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Per-template stats */}
        <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-neutral-100 px-5 py-4">
            <h2 className="text-sm font-black text-neutral-900">รายได้ต่อเทมเพลต</h2>
          </div>
          {templateStats.length === 0 ? (
            <div className="py-12 text-center text-sm text-neutral-400">ยังไม่มีข้อมูล</div>
          ) : (
            <div className="divide-y divide-neutral-50">
              {templateStats.map(t => (
                <div key={t.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-neutral-900 truncate">{t.title}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${TIER_COLOR[t.tier] ?? 'bg-neutral-100'}`}>
                        {t.tier}
                      </span>
                      {t.status !== 'published' && (
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-black text-neutral-500 uppercase">{t.status}</span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-neutral-400">
                      <span className="font-mono">{t.slug}</span>
                      <span>฿{t.price_baht} / ชิ้น</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-6 text-center">
                    <div>
                      <p className="text-lg font-black text-emerald-700">฿{Number(t.revenue).toLocaleString('th-TH')}</p>
                      <p className="text-[10px] text-neutral-400">รายได้</p>
                    </div>
                    <div>
                      <p className="text-lg font-black text-neutral-900">{t.paid_count}</p>
                      <p className="text-[10px] text-neutral-400">ขาย</p>
                    </div>
                    <div>
                      <p className="text-lg font-black text-blue-700">{t.download_total}</p>
                      <p className="text-[10px] text-neutral-400">⬇ download</p>
                    </div>
                    {Number(t.pending_count) > 0 && (
                      <div>
                        <p className="text-lg font-black text-yellow-600">{t.pending_count}</p>
                        <p className="text-[10px] text-neutral-400">รอชำระ</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  )
}
