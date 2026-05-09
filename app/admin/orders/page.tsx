// /admin/orders — Template + Cart order management
import Link from 'next/link'
import type { Metadata } from 'next'
import { requireAdminSession } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { verifyOrderAction, revokeOrderAction, cancelPendingOrderAction, revokeCartOrderAction, cancelCartOrderAction } from './actions'

export const metadata: Metadata = {
  title: 'Orders — Admin',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

type Order = {
  id: string
  order_number: string
  template_title: string
  customer_line_id: string
  amount_baht: number
  status: string
  fraud_flag: string
  is_verified: boolean
  download_count: number
  claimed_at: string | null
  created_at: string
  promptpay_ref: string
}

const STATUS_COLOR: Record<string, string> = {
  pending_payment: 'bg-yellow-100 text-yellow-700',
  paid:            'bg-green-100 text-green-700',
  pending_verify:  'bg-blue-100 text-blue-700',
  refunded:        'bg-neutral-100 text-neutral-500',
}
const FRAUD_COLOR: Record<string, string> = {
  clean:      'bg-emerald-50 text-emerald-600',
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
  searchParams: Promise<{ status?: string; type?: string }>
}) {
  await requireAdminSession('/admin/login')
  const { status: filterStatus, type: orderType = 'template' } = await searchParams

  const orders = await db<Order[]>`
    SELECT o.id, o.order_number, t.title AS template_title,
           o.customer_line_id, o.amount_baht, o.status, o.fraud_flag,
           o.is_verified, o.download_count, o.claimed_at, o.created_at,
           o.promptpay_ref
    FROM template_orders o
    JOIN templates t ON t.id = o.template_id
    ${filterStatus ? db`WHERE o.status = ${filterStatus}` : db``}
    ORDER BY o.created_at DESC
    LIMIT 200
  `.catch(() => [] as Order[])

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

  const [stats] = await db<{ total: string; revenue: string; pending: string; suspicious: string }[]>`
    SELECT
      COUNT(*)                                              AS total,
      COALESCE(SUM(CASE WHEN status = 'paid' THEN amount_baht ELSE 0 END), 0) AS revenue,
      COUNT(*) FILTER (WHERE status = 'pending_payment')   AS pending,
      COUNT(*) FILTER (WHERE fraud_flag = 'suspicious')    AS suspicious
    FROM template_orders
  `.catch(() => [{ total: '0', revenue: '0', pending: '0', suspicious: '0' }])

  const [cartStats] = await db<{ total: string; revenue: string; pending: string }[]>`
    SELECT
      COUNT(*)::text                                                        AS total,
      COALESCE(SUM(CASE WHEN status = 'paid' THEN total_baht ELSE 0 END), 0)::text AS revenue,
      COUNT(*) FILTER (WHERE status = 'pending_payment')::text             AS pending
    FROM orders
  `.catch(() => [{ total: '0', revenue: '0', pending: '0' }])

  const STATUS_TABS = [
    { label: 'ทั้งหมด',   key: '' },
    { label: 'รอชำระ',    key: 'pending_payment' },
    { label: 'จ่ายแล้ว',  key: 'paid' },
  ]

  const typeBase = (type: string) =>
    type === 'cart' ? `/admin/orders?type=cart` : `/admin/orders`

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

        {/* Order type tabs */}
        <div className="mb-4 flex gap-2">
          <Link
            href="/admin/orders"
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              orderType === 'template' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            Template Orders ({stats.total})
          </Link>
          <Link
            href="/admin/orders?type=cart"
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              orderType === 'cart' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            Cart Orders ({cartStats.total})
          </Link>
        </div>

        {/* Stats */}
        {orderType !== 'cart' ? (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'ทั้งหมด',   value: stats.total,                                        color: 'text-neutral-900' },
              { label: 'รายได้',    value: `฿${Number(stats.revenue).toLocaleString('th-TH')}`, color: 'text-emerald-700' },
              { label: 'รอชำระ',   value: stats.pending,                                        color: 'text-yellow-700' },
              { label: 'น่าสงสัย', value: stats.suspicious,                                     color: 'text-orange-700' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">{s.label}</p>
                <p className={`mt-1 text-2xl font-black ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="mb-6 grid grid-cols-3 gap-3">
            {[
              { label: 'ทั้งหมด',  value: cartStats.total,                                         color: 'text-neutral-900' },
              { label: 'รายได้',   value: `฿${Number(cartStats.revenue).toLocaleString('th-TH')}`,  color: 'text-emerald-700' },
              { label: 'รอชำระ',  value: cartStats.pending,                                         color: 'text-yellow-700' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">{s.label}</p>
                <p className={`mt-1 text-2xl font-black ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Status filter tabs */}
        <div className="mb-4 flex gap-2 overflow-x-auto">
          {STATUS_TABS.map(tab => (
            <Link
              key={tab.key}
              href={tab.key ? `${typeBase(orderType)}&status=${tab.key}` : typeBase(orderType)}
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

        {/* Template Orders list */}
        {orderType !== 'cart' && (
          <div className="space-y-3">
            {orders.length === 0 && (
              <div className="rounded-2xl border border-dashed border-neutral-300 bg-white py-16 text-center">
                <p className="text-2xl">📦</p>
                <p className="mt-2 text-sm font-bold text-neutral-400">ยังไม่มี order</p>
              </div>
            )}
            {orders.map(o => (
              <div key={o.id} className="rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-black text-neutral-900">{o.order_number}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${STATUS_COLOR[o.status] ?? 'bg-neutral-100 text-neutral-500'}`}>
                        {o.status}
                      </span>
                      {o.fraud_flag !== 'clean' && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${FRAUD_COLOR[o.fraud_flag]}`}>
                          {o.fraud_flag}
                        </span>
                      )}
                      {o.is_verified && (
                        <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-black text-white">✓ verified</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm font-semibold text-neutral-800">{o.template_title}</p>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-neutral-400">
                      <span>LINE: <span className="font-mono">{o.customer_line_id.slice(0, 8)}…</span></span>
                      <span className="font-bold text-emerald-600">฿{o.amount_baht}</span>
                      <span>ref: <span className="font-mono">{o.promptpay_ref}</span></span>
                      {o.download_count > 0 && <span>⬇ {o.download_count} ครั้ง</span>}
                      {o.claimed_at && <span>claimed: {new Date(o.claimed_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}</span>}
                      <span>{new Date(o.created_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {o.status === 'pending_payment' && (
                      <form action={cancelPendingOrderAction}>
                        <input type="hidden" name="id" value={o.id} />
                        <button type="submit" className="rounded-xl bg-neutral-100 px-3 py-2 text-xs font-black text-neutral-600 hover:bg-neutral-200 transition">ยกเลิก</button>
                      </form>
                    )}
                    {o.status === 'paid' && o.fraud_flag !== 'revoked' && (
                      <>
                        {!o.is_verified && (
                          <form action={verifyOrderAction}>
                            <input type="hidden" name="id" value={o.id} />
                            <button type="submit" className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-100 transition">✓ Verify</button>
                          </form>
                        )}
                        <form action={revokeOrderAction}>
                          <input type="hidden" name="id" value={o.id} />
                          <input type="hidden" name="reason" value="ตรวจไม่พบการชำระเงิน" />
                          <button type="submit" className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-600 hover:bg-red-100 transition">Revoke</button>
                        </form>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cart Orders list */}
        {orderType === 'cart' && (
          <div className="space-y-3">
            {cartOrders.length === 0 && (
              <div className="rounded-2xl border border-dashed border-neutral-300 bg-white py-16 text-center">
                <p className="text-2xl">🛒</p>
                <p className="mt-2 text-sm font-bold text-neutral-400">ยังไม่มี cart order</p>
              </div>
            )}
            {cartOrders.map(o => (
              <div key={o.id} className="rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-black text-neutral-900">{o.order_uid}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${STATUS_COLOR[o.status] ?? 'bg-neutral-100 text-neutral-500'}`}>
                        {o.status}
                      </span>
                      {o.fraud_flag !== 'clean' && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${FRAUD_COLOR[o.fraud_flag]}`}>
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
        )}

      </div>
    </main>
  )
}
