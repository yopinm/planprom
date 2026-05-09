// /order/[orderUid] — order receipt + download links (URL as receipt)
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { db } from '@/lib/db'
import OrderDownloads from './OrderDownloads'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://couponkum.com'

interface Props {
  params: Promise<{ orderUid: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orderUid } = await params
  return {
    title:  `Order ${orderUid} — คูปองคุ้ม`,
    robots: 'noindex',
  }
}

export default async function OrderPage({ params }: Props) {
  const { orderUid } = await params

  const [order] = await db<{
    id: string; status: string; total_baht: number; paid_at: string | null; created_at: string
  }[]>`
    SELECT id, status, total_baht, paid_at, created_at
    FROM orders WHERE order_uid = ${orderUid} LIMIT 1
  `
  if (!order) notFound()

  const items = await db<{
    title: string
    download_token: string | null
    download_expires_at: string | null
    download_count: number
  }[]>`
    SELECT t.title, oi.download_token, oi.download_expires_at, oi.download_count
    FROM order_items oi
    JOIN templates t ON t.id = oi.template_id
    WHERE oi.order_id = ${order.id}
    ORDER BY oi.id
  `

  const downloadItems = items.map(i => ({
    title:       i.title,
    downloadUrl: i.download_token ? `${SITE_URL}/api/download/${i.download_token}` : null,
    expiresAt:   i.download_expires_at,
    count:       i.download_count,
  }))

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-sm space-y-4">

        <div className="bg-white rounded-2xl shadow p-6 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{order.status === 'paid' ? '✅' : '⏳'}</span>
            <div>
              <p className="font-bold text-gray-900">Order {orderUid}</p>
              <p className="text-xs text-gray-400">
                {order.status === 'paid' ? 'ชำระแล้ว' : 'รอชำระ'} · ฿{order.total_baht}
              </p>
            </div>
          </div>
        </div>

        {order.status === 'paid' && (
          <OrderDownloads items={downloadItems} />
        )}

        {order.status !== 'paid' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800 text-center">
            ยังไม่ได้ชำระเงิน — กลับไปที่หน้า checkout
          </div>
        )}

      </div>
    </main>
  )
}
