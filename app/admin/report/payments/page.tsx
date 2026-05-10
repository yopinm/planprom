import Link from 'next/link'
import type { Metadata } from 'next'
import { requireAdminSession } from '@/lib/admin-auth'
import { db } from '@/lib/db'

export const metadata: Metadata = {
  title: 'Payment Log — Admin Report',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

type RangeKey = 'today' | '7d' | '30d' | 'custom'

function getDateRange(range: RangeKey, from?: string, to?: string) {
  const now = new Date()
  const end = new Date(now); end.setHours(23, 59, 59, 999)
  if (range === 'custom' && from && to) {
    return { start: new Date(from + 'T00:00:00+07:00'), end: new Date(to + 'T23:59:59+07:00'), label: `${from} – ${to}` }
  }
  if (range === 'today') {
    const start = new Date(now); start.setHours(0, 0, 0, 0)
    return { start, end, label: 'วันนี้' }
  }
  const days = range === '30d' ? 30 : 7
  const start = new Date(now); start.setDate(start.getDate() - days + 1); start.setHours(0, 0, 0, 0)
  return { start, end, label: `${days} วันล่าสุด` }
}

const STATUS_COLOR: Record<string, string> = {
  paid:             'bg-green-100 text-green-700',
  pending_payment:  'bg-yellow-100 text-yellow-700',
  pending_verify:   'bg-blue-100 text-blue-700',
  refunded:         'bg-neutral-100 text-neutral-500',
}

export default async function PaymentLogPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string; status?: string }>
}) {
  await requireAdminSession('/admin/login')
  const sp = await searchParams
  const range = (['today', '7d', '30d', 'custom'].includes(sp.range ?? '') ? sp.range : '7d') as RangeKey
  const { start, end, label } = getDateRange(range, sp.from, sp.to)
  const filterStatus = sp.status ?? ''

  const orders = await db<{
    order_number: string
    template_title: string
    customer_line_id: string
    amount_baht: number
    status: string
    omise_charge_id: string | null
    promptpay_ref: string | null
    created_at: string
    paid_at: string | null
  }[]>`
    SELECT
      o.order_number,
      t.title AS template_title,
      o.customer_line_id,
      o.amount_baht,
      o.status,
      o.omise_charge_id,
      o.promptpay_ref,
      o.created_at,
      o.paid_at
    FROM template_orders o
    JOIN templates t ON t.id = o.template_id
    WHERE o.created_at >= ${start} AND o.created_at <= ${end}
      ${filterStatus ? db`AND o.status = ${filterStatus}` : db``}
    ORDER BY o.created_at DESC
    LIMIT 500
  `

  const [summary] = await db<{
    total: string; paid: string; pending: string; revenue: string
  }[]>`
    SELECT
      COUNT(*)                                                      AS total,
      COUNT(*) FILTER (WHERE status = 'paid')                      AS paid,
      COUNT(*) FILTER (WHERE status IN ('pending_payment','pending_verify')) AS pending,
      COALESCE(SUM(amount_baht) FILTER (WHERE status = 'paid'), 0) AS revenue
    FROM template_orders
    WHERE created_at >= ${start} AND created_at <= ${end}
  `

  const STATUSES = [
    { key: '', label: 'ทั้งหมด' },
    { key: 'paid', label: 'จ่ายแล้ว' },
    { key: 'pending_payment', label: 'รอชำระ' },
    { key: 'pending_verify', label: 'รอตรวจสอบ' },
    { key: 'refunded', label: 'คืนเงิน' },
  ]

  return (
    <main className="min-h-screen bg-neutral-50 pb-20">
      <div className="mx-auto max-w-5xl px-4 py-8">

        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-neutral-400">Report</p>
            <h1 className="text-2xl font-black text-black">💳 Payment Log</h1>
            <p className="mt-0.5 text-sm text-neutral-500">{label}</p>
          </div>
          <Link href="/admin" className="rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-xs font-black text-neutral-600 shadow-sm hover:border-black">
            ← Admin
          </Link>
        </div>

        {/* KPI */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Revenue', value: `฿${Number(summary?.revenue ?? 0).toLocaleString('th-TH')}`, color: 'text-indigo-600' },
            { label: 'จ่ายแล้ว', value: summary?.paid ?? '0', color: 'text-green-600' },
            { label: 'Pending', value: summary?.pending ?? '0', color: 'text-orange-500' },
            { label: 'ทั้งหมด', value: summary?.total ?? '0', color: 'text-neutral-600' },
          ].map(k => (
            <div key={k.label} className="rounded-2xl border border-neutral-200 bg-white px-4 py-4 text-center shadow-sm">
              <p className={`text-2xl font-black ${k.color}`}>{k.value}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">{k.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="mt-5 flex flex-wrap items-end gap-3">
          {(['today', '7d', '30d'] as RangeKey[]).map(r => (
            <Link key={r} href={`/admin/report/payments?range=${r}${filterStatus ? `&status=${filterStatus}` : ''}`}
              className={`rounded-full px-4 py-1.5 text-xs font-black transition ${range === r && range !== 'custom' ? 'bg-indigo-600 text-white' : 'bg-white border border-neutral-200 text-neutral-600 hover:border-indigo-400'}`}>
              {r === 'today' ? 'วันนี้' : r === '7d' ? '7 วัน' : '30 วัน'}
            </Link>
          ))}
          <form method="GET" action="/admin/report/payments" className="flex items-center gap-2">
            <input type="hidden" name="range" value="custom" />
            {filterStatus && <input type="hidden" name="status" value={filterStatus} />}
            <input type="date" name="from" defaultValue={sp.from ?? ''} required className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold outline-none focus:border-indigo-400" />
            <span className="text-xs text-neutral-400">–</span>
            <input type="date" name="to" defaultValue={sp.to ?? ''} required className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold outline-none focus:border-indigo-400" />
            <button type="submit" className={`rounded-full px-4 py-1.5 text-xs font-black transition ${range === 'custom' ? 'bg-indigo-600 text-white' : 'bg-white border border-neutral-200 text-neutral-600 hover:border-indigo-400'}`}>ดู</button>
          </form>
          <div className="flex gap-1.5 ml-2">
            {STATUSES.map(s => (
              <Link key={s.key} href={`/admin/report/payments?range=${range}${s.key ? `&status=${s.key}` : ''}${sp.from ? `&from=${sp.from}` : ''}${sp.to ? `&to=${sp.to}` : ''}`}
                className={`rounded-full px-3 py-1 text-[10px] font-black transition ${filterStatus === s.key ? 'bg-black text-white' : 'bg-white border border-neutral-200 text-neutral-500 hover:border-black'}`}>
                {s.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="mt-5 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          {orders.length === 0 ? (
            <p className="py-12 text-center text-sm text-neutral-400 italic">ไม่มีข้อมูลในช่วงนี้</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50 text-[10px] font-black uppercase tracking-wider text-neutral-400">
                    <th className="px-4 py-3 text-left">Order</th>
                    <th className="px-4 py-3 text-left">Template</th>
                    <th className="px-4 py-3 text-right">฿</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-left">Charge ID</th>
                    <th className="px-4 py-3 text-left">เวลา</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o, i) => (
                    <tr key={o.order_number} className={`border-b border-neutral-50 ${i % 2 === 1 ? 'bg-neutral-50/50' : ''}`}>
                      <td className="px-4 py-2.5 font-mono font-bold text-neutral-700">{o.order_number}</td>
                      <td className="px-4 py-2.5 max-w-[160px] truncate text-neutral-600">{o.template_title}</td>
                      <td className="px-4 py-2.5 text-right font-black text-indigo-600">฿{o.amount_baht}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-black ${STATUS_COLOR[o.status] ?? 'bg-neutral-100 text-neutral-500'}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[10px] text-neutral-400 max-w-[120px] truncate">
                        {o.omise_charge_id ?? o.promptpay_ref ?? '—'}
                      </td>
                      <td className="px-4 py-2.5 text-neutral-500 whitespace-nowrap">
                        {new Date(o.created_at).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {orders.length === 500 && (
                <p className="border-t border-neutral-100 px-5 py-2 text-center text-[10px] text-neutral-400">แสดง 500 รายการล่าสุด — ใช้ Order Export เพื่อดูทั้งหมด</p>
              )}
            </div>
          )}
        </div>

      </div>
    </main>
  )
}
