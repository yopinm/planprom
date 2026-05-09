// /orders — customer order history
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'

export const metadata: Metadata = { title: 'คำสั่งซื้อของฉัน — คูปองคุ้ม' }
export const dynamic = 'force-dynamic'

type MyOrder = {
  id: string
  order_number: string
  template_title: string
  template_slug: string
  amount_baht: number
  status: string
  fraud_flag: string
  download_count: number
  download_expires_at: string | null
  download_token: string | null
  claimed_at: string | null
  created_at: string
}

const STATUS_LABEL: Record<string, string> = {
  pending_payment: 'รอชำระเงิน',
  paid:            'ชำระแล้ว',
  pending_verify:  'รอตรวจสอบ',
}
const STATUS_COLOR: Record<string, string> = {
  pending_payment: 'bg-yellow-100 text-yellow-700',
  paid:            'bg-green-100 text-green-700',
  pending_verify:  'bg-blue-100 text-blue-700',
}

export default async function OrdersPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/api/auth/line?next=${encodeURIComponent('/orders')}`)

  const lineId: string =
    (user.user_metadata?.provider_id as string) ??
    (user.identities?.find(i => i.provider.includes('line'))?.id ?? user.id)

  const orders = await db<MyOrder[]>`
    SELECT o.id, o.order_number, t.title AS template_title, t.slug AS template_slug,
           o.amount_baht, o.status, o.fraud_flag, o.download_count,
           o.download_expires_at, o.download_token, o.claimed_at, o.created_at
    FROM template_orders o
    JOIN templates t ON t.id = o.template_id
    WHERE o.customer_line_id = ${lineId}
    ORDER BY o.created_at DESC
  `.catch(() => [] as MyOrder[])

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-2xl px-4 py-8">

        <div className="mb-6">
          <Link href="/" className="text-xs font-bold text-neutral-400 hover:text-black">← หน้าแรก</Link>
          <h1 className="mt-1 text-2xl font-black text-neutral-900">คำสั่งซื้อของฉัน</h1>
          <p className="mt-0.5 text-sm text-neutral-500">{orders.length} รายการ</p>
        </div>

        {orders.length === 0 && (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white py-16 text-center">
            <p className="text-3xl">🛒</p>
            <p className="mt-2 font-bold text-neutral-400">ยังไม่มีคำสั่งซื้อ</p>
            <Link href="/" className="mt-4 inline-block rounded-xl bg-amber-500 px-5 py-2 text-sm font-black text-white hover:bg-amber-600">
              ดูเทมเพลต
            </Link>
          </div>
        )}

        <div className="space-y-3">
          {orders.map(o => {
            const isRevoked  = o.fraud_flag === 'revoked'
            const isExpired  = o.download_expires_at ? new Date(o.download_expires_at) < new Date() : false
            const isMaxed    = o.download_count >= 3
            const canDownload = o.status === 'paid' && o.download_token && !isRevoked && !isExpired && !isMaxed

            return (
              <div key={o.id} className="rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-neutral-400">{o.order_number}</span>
                      {isRevoked ? (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-black text-red-700">ยกเลิก</span>
                      ) : (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${STATUS_COLOR[o.status] ?? 'bg-neutral-100 text-neutral-500'}`}>
                          {STATUS_LABEL[o.status] ?? o.status}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 font-semibold text-neutral-900">{o.template_title}</p>
                    <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-neutral-400">
                      <span className="font-bold text-emerald-600">฿{o.amount_baht}</span>
                      <span>{new Date(o.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}</span>
                      {o.download_count > 0 && <span>ดาวน์โหลด {o.download_count}/3 ครั้ง</span>}
                      {isExpired && !isRevoked && <span className="text-orange-500">ลิงก์หมดอายุ</span>}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {canDownload && (
                      <Link
                        href={`/d/${o.download_token}`}
                        className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-black text-white hover:bg-emerald-600 transition"
                      >
                        ⬇ ดาวน์โหลด
                      </Link>
                    )}
                    {o.status === 'pending_payment' && (
                      <Link
                        href={`/checkout/${o.template_slug}`}
                        className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-black text-white hover:bg-amber-600 transition"
                      >
                        ชำระเงิน
                      </Link>
                    )}
                    {(isRevoked || (o.status === 'paid' && (isExpired || isMaxed))) && (
                      <a
                        href="https://line.me/R/ti/p/%40216xobzv?gid=7820ade2-85c7-430f-b000-3b74292fe6f1"
                        target="_blank" rel="noopener noreferrer"
                        className="rounded-xl bg-neutral-100 px-4 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-200 transition"
                      >
                        ติดต่อ LINE OA
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </main>
  )
}
