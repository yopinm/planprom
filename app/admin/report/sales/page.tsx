import Link from 'next/link'
import type { Metadata } from 'next'
import { requireAdminSession } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { revokeCartOrderAction, cancelCartOrderAction } from './actions'

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

const STATUS_COLOR: Record<string, string> = {
  pending_payment: 'bg-yellow-100 text-yellow-700',
  paid:            'bg-green-100 text-green-700',
  revoked:         'bg-neutral-100 text-neutral-500',
}
const FRAUD_COLOR: Record<string, string> = {
  suspicious: 'bg-orange-100 text-orange-700',
  revoked:    'bg-red-100 text-red-700',
}

const TYPE_META: Record<string, { label: string; icon: string; color: string }> = {
  checklist: { label: 'Checklist', icon: '✅', color: 'text-emerald-700' },
  planner:   { label: 'Planner',   icon: '📋', color: 'text-indigo-700' },
  form:      { label: 'Form',      icon: '📝', color: 'text-violet-700' },
  report:    { label: 'Report',    icon: '📊', color: 'text-sky-700' },
}
const ALL_TYPE_KEYS = ['checklist', 'planner', 'form', 'report'] as const

type PromoRow = {
  code: string; label: string; is_secret: boolean
  uses: string; discount_total: string; revenue: string
}

type CartOrder = {
  id: string; order_uid: string; total_baht: number; status: string; fraud_flag: string
  item_count: string; item_titles: string; created_at: string; paid_at: string | null
}
type TypeRow = { type_group: string; orders: string; paid: string; revenue: string }

export default async function SalesReportPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string; status?: string }>
}) {
  await requireAdminSession('/admin/login')
  const sp = await searchParams
  const range = (['today', '7d', '30d', 'custom'].includes(sp.range ?? '') ? sp.range : '7d') as RangeKey
  const { start, end, label } = getDateRange(range, sp.from, sp.to)
  const filterStatus = sp.status ?? ''

  // base URL params for tabs (preserves date range)
  const rangeParams = range === 'custom' && sp.from && sp.to
    ? `range=custom&from=${sp.from}&to=${sp.to}`
    : `range=${range}`

  // ── Queries ────────────────────────────────────────────────────────────────

  const [kpi] = await db<{
    total_orders: string; paid_orders: string; revenue: string
    avg_order: string; pending_orders: string; omise_revenue: string
  }[]>`
    SELECT
      COUNT(*)                                                                                          AS total_orders,
      COUNT(*) FILTER (WHERE status = 'paid')                                                          AS paid_orders,
      COALESCE(SUM(total_baht) FILTER (WHERE status = 'paid'), 0)                                     AS revenue,
      COALESCE(AVG(total_baht) FILTER (WHERE status = 'paid'), 0)                                     AS avg_order,
      COUNT(*) FILTER (WHERE status = 'pending_payment')                                               AS pending_orders,
      COALESCE(SUM(total_baht) FILTER (WHERE status = 'paid' AND omise_charge_id IS NOT NULL), 0)     AS omise_revenue
    FROM orders
    WHERE created_at >= ${start} AND created_at <= ${end}
  `

  const daily = await db<{ day: string; orders: string; paid: string; revenue: string }[]>`
    SELECT
      DATE(created_at AT TIME ZONE 'Asia/Bangkok') AS day,
      COUNT(*)                                      AS orders,
      COUNT(*) FILTER (WHERE status = 'paid')       AS paid,
      COALESCE(SUM(total_baht) FILTER (WHERE status = 'paid'), 0) AS revenue
    FROM orders
    WHERE created_at >= ${start} AND created_at <= ${end}
    GROUP BY day ORDER BY day DESC
  `

  const byTemplate = await db<{ title: string; orders: string; paid: string; revenue: string }[]>`
    SELECT
      t.title,
      COUNT(DISTINCT oi.order_id)                                                   AS orders,
      COUNT(DISTINCT oi.order_id) FILTER (WHERE o.status = 'paid')                 AS paid,
      COALESCE(SUM(t.price_baht) FILTER (WHERE o.status = 'paid'), 0)             AS revenue
    FROM order_items oi
    JOIN orders    o ON o.id = oi.order_id
    JOIN templates t ON t.id = oi.template_id
    WHERE o.created_at >= ${start} AND o.created_at <= ${end}
    GROUP BY t.title ORDER BY revenue DESC
  `

  const cartOrders = await db<CartOrder[]>`
    SELECT o.id, o.order_uid, o.total_baht, o.status, o.fraud_flag,
           COUNT(oi.id)::text AS item_count,
           STRING_AGG(t.title, ' · ' ORDER BY oi.id) AS item_titles,
           o.created_at, o.paid_at
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    LEFT JOIN templates  t   ON t.id = oi.template_id
    WHERE o.created_at >= ${start} AND o.created_at <= ${end}
    ${filterStatus ? db`AND o.status = ${filterStatus}` : db``}
    GROUP BY o.id
    ORDER BY o.created_at DESC
    LIMIT 200
  `.catch(() => [] as CartOrder[])

  const promoStats = await db<PromoRow[]>`
    SELECT
      p.code, p.label, p.is_secret,
      COUNT(o.id)::text                                                       AS uses,
      COALESCE(SUM(o.discount_baht) FILTER (WHERE o.status = 'paid'), 0)::text AS discount_total,
      COALESCE(SUM(o.total_baht)    FILTER (WHERE o.status = 'paid'), 0)::text AS revenue
    FROM promo_codes p
    JOIN orders o ON o.promo_code_id = p.id
    WHERE o.created_at >= ${start} AND o.created_at <= ${end}
    GROUP BY p.id, p.code, p.label, p.is_secret
    ORDER BY COALESCE(SUM(o.total_baht) FILTER (WHERE o.status = 'paid'), 0) DESC
  `.catch(() => [] as PromoRow[])

  const [freeRow] = await db<{ free_count: string }[]>`
    SELECT COUNT(*)::text AS free_count
    FROM template_orders
    WHERE payment_method = 'free'
      AND created_at >= ${start} AND created_at <= ${end}
  `.catch(() => [{ free_count: '0' }])

  const byEngineType = await db<TypeRow[]>`
    WITH item_share AS (
      SELECT
        oi.id, oi.template_id, oi.order_id, o.status, o.created_at,
        ROUND(o.total_baht::numeric / COUNT(*) OVER (PARTITION BY o.id)) AS share
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.created_at >= ${start} AND o.created_at <= ${end}
    )
    SELECT
      CASE
        WHEN t.engine_type IN ('planner', 'planner-pipeline', 'pipeline') THEN 'planner'
        WHEN t.engine_type IN ('checklist', 'form', 'report') THEN t.engine_type
        ELSE 'other'
      END AS type_group,
      COUNT(DISTINCT s.order_id)::text                                     AS orders,
      COUNT(DISTINCT s.order_id) FILTER (WHERE s.status = 'paid')::text   AS paid,
      COALESCE(SUM(s.share) FILTER (WHERE s.status = 'paid'), 0)::text    AS revenue
    FROM item_share s
    JOIN templates t ON t.id = s.template_id
    GROUP BY type_group
  `.catch(() => [] as TypeRow[])

  // ── Derived values ─────────────────────────────────────────────────────────

  const totalRevenue  = Number(kpi?.revenue        ?? 0)
  const totalOrders   = Number(kpi?.total_orders   ?? 0)
  const paidOrders    = Number(kpi?.paid_orders    ?? 0)
  const avgOrder      = Number(kpi?.avg_order      ?? 0)
  const pendingOrders = Number(kpi?.pending_orders ?? 0)
  const omiseRevenue  = Number(kpi?.omise_revenue  ?? 0)
  const freeCount     = Number(freeRow?.free_count ?? 0)
  // Omise PromptPay: 1.65% transaction fee + 7% VAT = 1.7655% of Omise-charged orders only
  const fee           = Math.round(omiseRevenue * 0.017655)
  const netRevenue    = totalRevenue - fee
  const typeMap       = new Map(byEngineType.map(r => [r.type_group, r]))

  const STATUS_TABS = [
    { label: 'ทั้งหมด', key: '' },
    { label: 'รอชำระ',  key: 'pending_payment' },
    { label: 'จ่ายแล้ว', key: 'paid' },
  ]

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-neutral-50 pb-20">
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-10">

        {/* ── S1: Header + Date filter ── */}
        <div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-neutral-400">Report</p>
              <h1 className="text-2xl font-black text-black">📈 ยอดขาย</h1>
              <p className="mt-0.5 text-sm text-neutral-500">{label}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/admin/orders/audit"
                className="rounded-xl bg-orange-50 border border-orange-200 px-3 py-1.5 text-xs font-bold text-orange-700 hover:bg-orange-100 transition">
                Daily Audit →
              </Link>
              <Link href="/admin"
                className="rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-xs font-black text-neutral-600 shadow-sm hover:border-black">
                ← Admin
              </Link>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-end gap-3">
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
        </div>

        {/* ── S2: KPI 6 cards ── */}
        <section>
          <h2 className="mb-3 text-[11px] font-black uppercase tracking-wider text-neutral-400">ภาพรวม</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { label: 'Revenue',        value: `฿${totalRevenue.toLocaleString('th-TH')}`,  color: totalRevenue > 0   ? 'text-indigo-600'  : 'text-neutral-300' },
              { label: 'Orders จ่ายแล้ว', value: String(paidOrders),                          color: paidOrders > 0    ? 'text-green-600'   : 'text-neutral-300' },
              { label: 'Avg / Order',    value: `฿${avgOrder.toFixed(0)}`,                   color: avgOrder > 0      ? 'text-amber-600'   : 'text-neutral-300' },
              { label: 'Pending',        value: String(pendingOrders),                        color: pendingOrders > 0 ? 'text-orange-500'  : 'text-neutral-300' },
              { label: 'ยอดรับจริง',    value: `฿${netRevenue.toLocaleString('th-TH')}`,    color: netRevenue > 0    ? 'text-emerald-700' : 'text-neutral-300', hint: undefined },
              { label: 'ค่าธรรมเนียม',  value: `฿${fee.toLocaleString('th-TH')}`,           color: fee > 0           ? 'text-rose-500'    : 'text-neutral-300', hint: 'PromptPay via Omise: 1.65% + VAT 7% = 1.7655%\n(คิดจากยอด paid ที่มี omise_charge_id เท่านั้น)' },
              { label: 'ดาวน์โหลดฟรี', value: String(freeCount),                              color: freeCount > 0     ? 'text-emerald-600' : 'text-neutral-300', hint: 'จาก template tier=free ที่กด "รับฟรี" โดยตรง (ไม่ผ่าน cart)' },
            ].map(k => (
              <div key={k.label} title={k.hint} className={`rounded-2xl border border-neutral-200 bg-white px-4 py-5 text-center shadow-sm ${k.hint ? 'cursor-help' : ''}`}>
                <p className={`text-2xl font-black ${k.color}`}>{k.value}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  {k.label}{k.hint && <span className="ml-1 text-neutral-300">ⓘ</span>}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── S3: Revenue by Type ── */}
        <section>
          <h2 className="mb-3 text-[11px] font-black uppercase tracking-wider text-neutral-400">Revenue by Type</h2>
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50 text-[10px] font-black uppercase tracking-wider text-neutral-400">
                  <th className="px-5 py-3 text-left">ประเภท</th>
                  <th className="px-5 py-3 text-right">Orders</th>
                  <th className="px-5 py-3 text-right">จ่ายแล้ว</th>
                  <th className="px-5 py-3 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {ALL_TYPE_KEYS.map((t, i) => {
                  const row  = typeMap.get(t)
                  const meta = TYPE_META[t]
                  return (
                    <tr key={t} className={`border-b border-neutral-50 ${i % 2 === 1 ? 'bg-neutral-50/50' : ''}`}>
                      <td className="px-5 py-3">
                        <span className={`font-bold ${meta.color}`}>{meta.icon} {meta.label}</span>
                      </td>
                      <td className="px-5 py-3 text-right text-neutral-500">{row?.orders ?? '0'}</td>
                      <td className="px-5 py-3 text-right font-bold text-green-600">{row?.paid ?? '0'}</td>
                      <td className={`px-5 py-3 text-right font-black ${row ? 'text-indigo-600' : 'text-neutral-300'}`}>
                        ฿{Number(row?.revenue ?? 0).toLocaleString('th-TH')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── S4: Promo Code Performance ── */}
        {promoStats.length > 0 && (
          <section>
            <h2 className="mb-3 text-[11px] font-black uppercase tracking-wider text-neutral-400">Promo Code Performance</h2>
            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50 text-[10px] font-black uppercase tracking-wider text-neutral-400">
                    <th className="px-5 py-3 text-left">Code</th>
                    <th className="px-5 py-3 text-left">Label</th>
                    <th className="px-5 py-3 text-left">Channel</th>
                    <th className="px-5 py-3 text-right">ใช้</th>
                    <th className="px-5 py-3 text-right">ส่วนลดรวม</th>
                    <th className="px-5 py-3 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {promoStats.map((row, i) => (
                    <tr key={row.code} className={`border-b border-neutral-50 ${i % 2 === 1 ? 'bg-neutral-50/50' : ''}`}>
                      <td className="px-5 py-3 font-mono font-black text-neutral-900">{row.code}</td>
                      <td className="px-5 py-3 text-neutral-600">{row.label}</td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${row.is_secret ? 'bg-rose-50 text-rose-500' : 'bg-sky-50 text-sky-600'}`}>
                          {row.is_secret ? '🔒 Secret' : '🌐 Public'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-neutral-500">{row.uses}</td>
                      <td className="px-5 py-3 text-right font-bold text-rose-500">-฿{Number(row.discount_total).toLocaleString('th-TH')}</td>
                      <td className="px-5 py-3 text-right font-black text-indigo-600">฿{Number(row.revenue).toLocaleString('th-TH')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ── S5: Daily breakdown ── */}
        <section>
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

        {/* ── S6: Per-template breakdown ── */}
        {byTemplate.length > 0 && (
          <section>
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

        {/* ── S7: Order list ── */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[11px] font-black uppercase tracking-wider text-neutral-400">รายการ Orders</h2>
            <span className="text-[10px] text-neutral-400">{cartOrders.length} รายการ</span>
          </div>

          {/* Status tabs */}
          <div className="mb-4 flex gap-2 overflow-x-auto">
            {STATUS_TABS.map(tab => (
              <Link
                key={tab.key}
                href={tab.key
                  ? `/admin/report/sales?${rangeParams}&status=${tab.key}`
                  : `/admin/report/sales?${rangeParams}`}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
                  filterStatus === tab.key
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>

          <div className="space-y-3">
            {cartOrders.length === 0 && (
              <div className="rounded-2xl border border-dashed border-neutral-300 bg-white py-16 text-center">
                <p className="text-2xl">🛒</p>
                <p className="mt-2 text-sm font-bold text-neutral-400">ไม่มี order ในช่วงนี้</p>
              </div>
            )}
            {cartOrders.map(o => (
              <div key={o.id} className="rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-black text-neutral-900">{o.order_uid}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${STATUS_COLOR[o.status] ?? 'bg-neutral-100 text-neutral-500'}`}>
                        {o.status === 'pending_payment' ? 'รอชำระ' : o.status === 'paid' ? 'PAID' : o.status}
                      </span>
                      {o.fraud_flag !== 'clean' && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${FRAUD_COLOR[o.fraud_flag] ?? ''}`}>
                          {o.fraud_flag}
                        </span>
                      )}
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600">
                        {o.item_count} ชิ้น
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-neutral-500 line-clamp-1">{o.item_titles}</p>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-neutral-400">
                      <span className="font-bold text-emerald-600">฿{o.total_baht}</span>
                      {o.paid_at && <span>paid: {new Date(o.paid_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}</span>}
                      <span>{new Date(o.created_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}</span>
                      <Link href={`/order/${o.order_uid}`} className="text-indigo-500 hover:underline" target="_blank">Receipt →</Link>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {o.status === 'pending_payment' && (
                      <form action={cancelCartOrderAction}>
                        <input type="hidden" name="id" value={o.id} />
                        <button type="submit" className="rounded-xl bg-neutral-100 px-3 py-2 text-xs font-black text-neutral-600 hover:bg-neutral-200 transition">ยกเลิก</button>
                      </form>
                    )}
                    {o.status === 'paid' && o.fraud_flag !== 'revoked' && (
                      <form action={revokeCartOrderAction}>
                        <input type="hidden" name="id" value={o.id} />
                        <button type="submit" className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-600 hover:bg-red-100 transition">Revoke</button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  )
}
