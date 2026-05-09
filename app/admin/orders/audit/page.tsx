// /admin/orders/audit — daily audit: paid but unverified orders (both types)
import Link from 'next/link'
import type { Metadata } from 'next'
import { requireAdminSession } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { verifyOrderAction, revokeOrderAction, revokeCartOrderAction } from '../actions'

export const metadata: Metadata = {
  title: 'Order Audit — Admin',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function OrderAuditPage() {
  await requireAdminSession('/admin/login')

  // Template orders: paid, not verified, last 7 days
  const templateUnverified = await db<{
    id: string; order_number: string; template_title: string
    customer_line_id: string; amount_baht: number; fraud_flag: string
    download_count: number; paid_at: string | null; created_at: string
  }[]>`
    SELECT o.id, o.order_number, t.title AS template_title,
           o.customer_line_id, o.amount_baht, o.fraud_flag,
           o.download_count, o.paid_at, o.created_at
    FROM template_orders o
    JOIN templates t ON t.id = o.template_id
    WHERE o.status = 'paid'
      AND o.is_verified = false
      AND o.created_at > NOW() - INTERVAL '7 days'
    ORDER BY o.created_at DESC
  `.catch(() => [])

  // Cart orders: paid, last 7 days
  const cartUnverified = await db<{
    id: string; order_uid: string; total_baht: number; fraud_flag: string
    item_count: string; item_titles: string; paid_at: string | null; created_at: string
  }[]>`
    SELECT o.id, o.order_uid, o.total_baht, o.fraud_flag,
           COUNT(oi.id)::text AS item_count,
           STRING_AGG(t.title, ' · ' ORDER BY oi.id) AS item_titles,
           o.paid_at, o.created_at
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    LEFT JOIN templates t    ON t.id = oi.template_id
    WHERE o.status = 'paid'
      AND o.created_at > NOW() - INTERVAL '7 days'
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `.catch(() => [])

  const totalPending = templateUnverified.length + cartUnverified.length

  return (
    <main className="min-h-screen bg-neutral-50 pb-20">
      <div className="mx-auto max-w-4xl px-4 py-8">

        <div className="mb-6">
          <Link href="/admin/orders" className="text-xs font-bold text-neutral-400 hover:text-black">← Orders</Link>
          <h1 className="mt-1 text-2xl font-black text-black">Daily Audit</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Paid orders (7 วันล่าสุด) ที่ยังไม่ verified — ตรวจ bank แล้ว verify/revoke
          </p>
        </div>

        {totalPending === 0 && (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white py-20 text-center">
            <p className="text-3xl">✅</p>
            <p className="mt-2 font-bold text-neutral-400">ไม่มี order รอ verify</p>
          </div>
        )}

        {/* Template orders */}
        {templateUnverified.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-neutral-500">
              Template Orders ({templateUnverified.length})
            </h2>
            <div className="space-y-3">
              {templateUnverified.map(o => (
                <div key={o.id} className="rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-black">{o.order_number}</span>
                        {o.fraud_flag !== 'clean' && (
                          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-black text-orange-700 uppercase">
                            {o.fraud_flag}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm font-semibold text-neutral-800">{o.template_title}</p>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-neutral-400">
                        <span className="font-bold text-emerald-600">฿{o.amount_baht}</span>
                        <span>LINE: <span className="font-mono">{o.customer_line_id.slice(0, 8)}…</span></span>
                        {o.download_count > 0 && <span>⬇ {o.download_count} ครั้ง</span>}
                        {o.paid_at && <span>paid: {new Date(o.paid_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}</span>}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <form action={verifyOrderAction}>
                        <input type="hidden" name="id" value={o.id} />
                        <button type="submit" className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-100 transition">
                          ✓ Verify
                        </button>
                      </form>
                      <form action={revokeOrderAction}>
                        <input type="hidden" name="id" value={o.id} />
                        <input type="hidden" name="reason" value="ตรวจไม่พบการชำระเงิน" />
                        <button type="submit" className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-600 hover:bg-red-100 transition">
                          Revoke
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Cart orders */}
        {cartUnverified.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-neutral-500">
              Cart Orders ({cartUnverified.length})
            </h2>
            <div className="space-y-3">
              {cartUnverified.map(o => (
                <div key={o.id} className="rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-black">{o.order_uid}</span>
                        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600">
                          {o.item_count} ชิ้น
                        </span>
                        {o.fraud_flag !== 'clean' && (
                          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-black text-orange-700 uppercase">
                            {o.fraud_flag}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-neutral-500 line-clamp-1">{o.item_titles}</p>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-neutral-400">
                        <span className="font-bold text-emerald-600">฿{o.total_baht}</span>
                        {o.paid_at && <span>paid: {new Date(o.paid_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}</span>}
                        <Link href={`/order/${o.order_uid}`} className="text-indigo-500 hover:underline" target="_blank">Receipt →</Link>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <form action={revokeCartOrderAction}>
                        <input type="hidden" name="id" value={o.id} />
                        <button type="submit" className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-600 hover:bg-red-100 transition">
                          Revoke
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </main>
  )
}
