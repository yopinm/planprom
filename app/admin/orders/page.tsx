// /admin/orders — Cart order management (template_orders tab removed)
import Link from 'next/link'
import type { Metadata } from 'next'
import { requireAdminSession } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { revokeCartOrderAction, cancelCartOrderAction } from './actions'

export const metadata: Metadata = {
  title: 'Orders — Admin',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

const STATUS_COLOR: Record<string, string> = {
  pending_payment: 'bg-yellow-100 text-yellow-700',
  paid:            'bg-green-100 text-green-700',
  revoked:         'bg-neutral-100 text-neutral-500',
}
const FRAUD_COLOR: Record<string, string> = {
  suspicious: 'bg-orange-100 text-orange-700',
  revoked:    'bg-red-100 text-red-700',
}

type CartOrder = {
  id: string
  order_uid: string
  total_baht: number
  status: string
  fraud_flag: string
  item_count: string
  item_titles: string
  created_at: string
  paid_at: string | null
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  await requireAdminSession('/admin/login')
  const { status: filterStatus } = await searchParams

  const cartOrders = await db<CartOrder[]>`
    SELECT o.id, o.order_uid, o.total_baht, o.status, o.fraud_flag,
           COUNT(oi.id)::text AS item_count,
           STRING_AGG(t.title, ' · ' ORDER BY oi.id) AS item_titles,
           o.created_at, o.paid_at
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    LEFT JOIN templates t    ON t.id = oi.template_id
    ${filterStatus ? db`WHERE o.status = ${filterStatus}` : db``}
    GROUP BY o.id
    ORDER BY o.created_at DESC
    LIMIT 200
  `.catch(() => [] as CartOrder[])

  const [stats] = await db<{ total: string; revenue: string; fee: string; pending: string }[]>`
    SELECT
      COUNT(*)::text                                                                 AS total,
      COALESCE(SUM(CASE WHEN status = 'paid' THEN total_baht ELSE 0 END), 0)::text  AS revenue,
      COALESCE(ROUND(SUM(CASE WHEN status = 'paid'
        THEN GREATEST(total_baht * 0.015, 5) ELSE 0 END)), 0)::text                 AS fee,
      COUNT(*) FILTER (WHERE status = 'pending_payment')::text                      AS pending
    FROM orders
  `.catch(() => [{ total: '0', revenue: '0', fee: '0', pending: '0' }])

  const STATUS_TABS = [
    { label: 'ทั้งหมด',  key: '' },
    { label: 'รอชำระ',   key: 'pending_payment' },
    { label: 'จ่ายแล้ว', key: 'paid' },
  ]

  return (
    <main className="min-h-screen bg-neutral-50 pb-20">
      <div className="mx-auto max-w-6xl px-4 py-8">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/admin" className="text-xs font-bold text-neutral-400 hover:text-black">← Admin</Link>
            <h1 className="mt-1 text-2xl font-black text-black">Orders</h1>
          </div>
          <Link href="/admin/orders/audit" className="rounded-xl bg-orange-50 border border-orange-200 px-4 py-2 text-sm font-bold text-orange-700 hover:bg-orange-100 transition">
            Daily Audit →
          </Link>
        </div>

        {/* KPI cards */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: 'ทั้งหมด',       value: stats.total,                                                                          color: 'text-neutral-900' },
            { label: 'รายได้รวม',     value: `฿${Number(stats.revenue).toLocaleString('th-TH')}`,                                  color: 'text-emerald-700' },
            { label: 'ยอดรับจริง',    value: `฿${(Number(stats.revenue) - Number(stats.fee)).toLocaleString('th-TH')}`,            color: 'text-indigo-700' },
            { label: 'ค่าธรรมเนียม', value: `฿${Number(stats.fee).toLocaleString('th-TH')}`,                                      color: 'text-rose-600' },
            { label: 'รอชำระ',        value: stats.pending,                                                                         color: 'text-yellow-700' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border border-neutral-200 bg-white px-4 py-4 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">{s.label}</p>
              <p className={`mt-1 text-xl font-black ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Status filter tabs */}
        <div className="mb-4 flex gap-2 overflow-x-auto">
          {STATUS_TABS.map(tab => (
            <Link
              key={tab.key}
              href={tab.key ? `/admin/orders?status=${tab.key}` : '/admin/orders'}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
                (filterStatus ?? '') === tab.key
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {/* Order list */}
        <div className="space-y-3">
          {cartOrders.length === 0 && (
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-white py-16 text-center">
              <p className="text-2xl">🛒</p>
              <p className="mt-2 text-sm font-bold text-neutral-400">ยังไม่มี order</p>
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

      </div>
    </main>
  )
}
