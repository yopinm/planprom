import Link from 'next/link'
import type { Metadata } from 'next'
import { requireAdminSession } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { ExportClient } from '../export/ExportClient'

export const metadata: Metadata = {
  title: 'Orders & Payment Log — Admin Report',
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

const STATUS_COLOR: Record<string, string> = {
  paid:            'bg-green-100 text-green-700',
  pending_payment: 'bg-yellow-100 text-yellow-700',
  revoked:         'bg-neutral-100 text-neutral-500',
}

const STATUSES = [
  { key: '', label: 'ทั้งหมด' },
  { key: 'paid', label: 'จ่ายแล้ว' },
  { key: 'pending_payment', label: 'รอชำระ' },
  { key: 'revoked', label: 'ยกเลิก' },
]

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

  const [summary] = await db<{ total: string; paid: string; pending: string; revenue: string; fee: string }[]>`
    SELECT
      COUNT(*)::text                                                                                                      AS total,
      COUNT(*) FILTER (WHERE status = 'paid')::text                                                                      AS paid,
      COUNT(*) FILTER (WHERE status = 'pending_payment')::text                                                           AS pending,
      COALESCE(SUM(total_baht) FILTER (WHERE status = 'paid'), 0)::text                                                 AS revenue,
      COALESCE(ROUND(SUM(total_baht * 0.017655) FILTER (WHERE status = 'paid' AND omise_charge_id IS NOT NULL)), 0)::text AS fee
    FROM orders
    WHERE created_at >= ${start} AND created_at <= ${end}
  `

  const orders = await db<{
    order_uid:       string
    item_titles:     string
    item_count:      string
    total_baht:      number
    status:          string
    fraud_flag:      string
    created_at:      string
    paid_at:         string | null
    omise_charge_id: string | null
  }[]>`
    SELECT
      o.order_uid,
      STRING_AGG(t.title, ' · ' ORDER BY oi.id) AS item_titles,
      COUNT(oi.id)::text                          AS item_count,
      o.total_baht,
      o.status,
      o.fraud_flag,
      o.created_at,
      o.paid_at,
      o.omise_charge_id
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    LEFT JOIN templates   t  ON t.id = oi.template_id
    WHERE o.created_at >= ${start} AND o.created_at <= ${end}
      ${filterStatus ? db`AND o.status = ${filterStatus}` : db``}
    GROUP BY o.id
    ORDER BY o.created_at DESC
    LIMIT 500
  `

  const revenue = Number(summary?.revenue ?? 0)
  const fee     = Number(summary?.fee     ?? 0)

  const csvRows = [
    ['order_uid', 'templates', 'total_baht', 'net_baht', 'status', 'fraud_flag', 'paid_at', 'created_at'],
    ...orders.map(o => [
      o.order_uid,
      `"${(o.item_titles ?? '').replace(/"/g, '""')}"`,
      String(o.total_baht),
      o.status === 'paid' ? String(Math.round(o.total_baht - (o.omise_charge_id ? o.total_baht * 0.017655 : 0))) : '',
      o.status,
      o.fraud_flag,
      o.paid_at ?? '',
      o.created_at,
    ]),
  ].map(r => r.join(',')).join('\n')

  return (
    <main className="min-h-screen bg-neutral-50 pb-20">
      <div className="mx-auto max-w-5xl px-4 py-8">

        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-neutral-400">Report</p>
            <h1 className="text-2xl font-black text-black">💳 Orders &amp; Payment Log</h1>
            <p className="mt-0.5 text-sm text-neutral-500">{label} · {orders.length} รายการ</p>
          </div>
          <Link href="/admin" className="rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-xs font-black text-neutral-600 shadow-sm hover:border-black">
            ← แอดมิน
          </Link>
        </div>

        {/* KPI */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: 'รายได้',        value: `฿${revenue.toLocaleString('th-TH')}`,                   color: 'text-indigo-600',  hint: undefined },
            { label: 'ยอดรับจริง',    value: `฿${(revenue - fee).toLocaleString('th-TH')}`,            color: 'text-emerald-600', hint: undefined },
            { label: 'ค่าธรรมเนียม', value: `฿${fee.toLocaleString('th-TH')}`,                        color: 'text-rose-500',    hint: 'PromptPay via Omise: 1.65% + VAT 7% = 1.7655%\n(คิดจากยอด paid ที่มี omise_charge_id เท่านั้น)' },
            { label: 'จ่ายแล้ว',     value: summary?.paid ?? '0',                                      color: 'text-green-600',   hint: undefined },
            { label: 'รอชำระ',        value: summary?.pending ?? '0',                                   color: 'text-orange-500',  hint: undefined },
          ].map(k => (
            <div key={k.label} title={k.hint} className={`rounded-2xl border border-neutral-200 bg-white px-4 py-4 text-center shadow-sm ${k.hint ? 'cursor-help' : ''}`}>
              <p className={`text-xl font-black ${k.color}`}>{k.value}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                {k.label}{k.hint && <span className="ml-1 text-neutral-300">ⓘ</span>}
              </p>
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
              <Link key={s.key}
                href={`/admin/report/payments?range=${range}${s.key ? `&status=${s.key}` : ''}${sp.from ? `&from=${sp.from}` : ''}${sp.to ? `&to=${sp.to}` : ''}`}
                className={`rounded-full px-3 py-1 text-[10px] font-black transition ${filterStatus === s.key ? 'bg-black text-white' : 'bg-white border border-neutral-200 text-neutral-500 hover:border-black'}`}>
                {s.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Export CSV */}
        <ExportClient csv={csvRows} filename={`orders-${label.replace(/\s–\s/g, '_')}.csv`} count={orders.length} />

        {/* Table */}
        <div className="mt-4 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          {orders.length === 0 ? (
            <p className="py-12 text-center text-sm text-neutral-400 italic">ไม่มีข้อมูลในช่วงนี้</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50 text-[10px] font-black uppercase tracking-wider text-neutral-400">
                    <th className="px-4 py-3 text-left">ออเดอร์</th>
                    <th className="px-4 py-3 text-left">Templates</th>
                    <th className="px-4 py-3 text-right">฿</th>
                    <th className="px-4 py-3 text-center">สถานะ</th>
                    <th className="px-4 py-3 text-left">เวลา</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o, i) => (
                    <tr key={o.order_uid} className={`border-b border-neutral-50 ${i % 2 === 1 ? 'bg-neutral-50/50' : ''}`}>
                      <td className="px-4 py-2.5 font-mono font-bold text-neutral-700">{o.order_uid}</td>
                      <td className="px-4 py-2.5 max-w-[200px] truncate text-neutral-600">
                        <span className="text-neutral-400 mr-1">{o.item_count}×</span>{o.item_titles ?? '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right font-black text-indigo-600">฿{o.total_baht}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-black ${STATUS_COLOR[o.status] ?? 'bg-neutral-100 text-neutral-500'}`}>
                          {o.status === 'pending_payment' ? 'รอชำระ' : o.status === 'paid' ? 'PAID' : o.status}
                        </span>
                        {o.fraud_flag !== 'clean' && (
                          <span className="ml-1 rounded-full bg-orange-100 px-1.5 py-0.5 text-[9px] font-black text-orange-600">{o.fraud_flag}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-neutral-500 whitespace-nowrap">
                        {new Date(o.created_at).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {orders.length === 500 && (
                <p className="border-t border-neutral-100 px-5 py-2 text-center text-[10px] text-neutral-400">แสดง 500 รายการล่าสุด — Export CSV เพื่อดูทั้งหมด</p>
              )}
            </div>
          )}
        </div>

      </div>
    </main>
  )
}
