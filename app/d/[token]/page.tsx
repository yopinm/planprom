// /d/[token] — validate download token + serve PDF link + increment count
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import DownloadClient from './DownloadClient'

interface Props { params: Promise<{ token: string }> }

export default async function DownloadPage({ params }: Props) {
  const { token } = await params

  const [row] = await db<{
    id: string; order_number: string; download_expires_at: string
    download_count: number; title: string; template_slug: string
    fraud_flag: string
  }[]>`
    SELECT o.id, o.order_number, o.download_expires_at, o.download_count,
           t.title, t.slug AS template_slug, o.fraud_flag
    FROM template_orders o
    JOIN templates t ON t.id = o.template_id
    WHERE o.download_token = ${token}
      AND o.status = 'paid'
    LIMIT 1
  `

  if (!row) redirect('/templates')

  const expired  = new Date(row.download_expires_at) < new Date()
  const maxed    = row.download_count >= 3
  const revoked  = row.fraud_flag === 'revoked'

  if (revoked || expired || maxed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow p-8 max-w-sm w-full text-center space-y-3">
          <p className="text-4xl">{revoked ? '🚫' : '⏰'}</p>
          <h1 className="font-bold text-gray-900 text-lg">
            {revoked ? 'ลิงก์ถูกระงับ' : expired ? 'ลิงก์หมดอายุ' : 'ดาวน์โหลดครบ 3 ครั้งแล้ว'}
          </h1>
          <p className="text-sm text-gray-500">
            {revoked
              ? 'กรุณาติดต่อ LINE OA เพื่อขอความช่วยเหลือ'
              : 'ลิงก์ใช้ได้ 24 ชม. สูงสุด 3 ครั้ง — กรุณาติดต่อ LINE OA หากต้องการความช่วยเหลือ'}
          </p>
        </div>
      </div>
    )
  }

  const remaining = 3 - row.download_count

  return (
    <DownloadClient
      token={token}
      orderNumber={row.order_number}
      title={row.title}
remaining={remaining}
      expiresAt={row.download_expires_at}
    />
  )
}
