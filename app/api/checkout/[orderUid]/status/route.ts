// GET /api/checkout/[orderUid]/status — poll cart order payment status
import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { getCharge } from '@/lib/omise'
import { CART_COOKIE } from '@/lib/cart'
import { pushLine } from '@/lib/line-messaging'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://couponkum.com'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderUid: string }> },
) {
  const { orderUid } = await params

  const [order] = await db<{ id: string; status: string; omise_charge_id: string | null; total_baht: number }[]>`
    SELECT id, status, omise_charge_id, total_baht FROM orders WHERE order_uid = ${orderUid} LIMIT 1
  `
  if (!order) return NextResponse.json({ error: 'not found' }, { status: 404 })

  if (order.status === 'paid') {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get(CART_COOKIE)?.value
    if (sessionId) await db`DELETE FROM carts WHERE session_id = ${sessionId}`
    return respondPaid(order.id)
  }

  // DB still pending — query Omise directly; self-healing without webhook
  if (order.omise_charge_id) {
    try {
      const charge = await getCharge(order.omise_charge_id)
      if (charge.status === 'successful') {
        await db`UPDATE orders SET status = 'paid', paid_at = NOW() WHERE id = ${order.id}`
        await issueTokens(order.id)
        const cookieStore = await cookies()
        const sessionId = cookieStore.get(CART_COOKIE)?.value
        if (sessionId) await db`DELETE FROM carts WHERE session_id = ${sessionId}`
        notifyOwner(order.id, orderUid, order.total_baht).catch(() => null)
        return respondPaid(order.id)
      }
      if (charge.status === 'failed' || charge.status === 'expired') {
        return NextResponse.json({ status: charge.status })
      }
    } catch {
      // Omise unreachable — fall through to DB status
    }
  }

  return NextResponse.json({ status: order.status })
}

async function respondPaid(orderId: string): Promise<NextResponse> {
  const rows = await db<{ title: string; download_token: string | null }[]>`
    SELECT t.title, oi.download_token
    FROM order_items oi
    JOIN templates t ON t.id = oi.template_id
    WHERE oi.order_id = ${orderId}
    ORDER BY oi.id
  `
  return NextResponse.json({
    status: 'paid',
    items: rows.map(r => ({
      title:       r.title,
      downloadUrl: r.download_token ? `${SITE_URL}/api/download/${r.download_token}` : null,
    })),
  })
}

async function notifyOwner(orderId: string, orderUid: string, totalBaht: number): Promise<void> {
  const ownerLineId = process.env.OWNER_LINE_USER_ID
  if (!ownerLineId) return
  const titles = await db<{ title: string }[]>`
    SELECT t.title FROM order_items oi
    JOIN templates t ON t.id = oi.template_id
    WHERE oi.order_id = ${orderId}
  `
  const titleList = titles.map((t, i) => `  ${i + 1}. ${t.title}`).join('\n')
  await pushLine(ownerLineId, [{
    type: 'text',
    text: [
      `🛒 Cart Order ใหม่ — แพลนพร้อม`,
      ``,
      `💰 ฿${totalBaht} (${titles.length} ชิ้น)`,
      `📌 ${orderUid}`,
      titleList,
      ``,
      `✅ เช็ค bank แล้ว audit ที่:`,
      `${SITE_URL}/admin/orders`,
    ].join('\n'),
  }])
}

async function issueTokens(orderId: string): Promise<void> {
  const items   = await db<{ id: string }[]>`SELECT id FROM order_items WHERE order_id = ${orderId}`
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
  for (const item of items) {
    await db`
      UPDATE order_items
      SET download_token = ${randomBytes(32).toString('hex')}, download_expires_at = ${expires}
      WHERE id = ${item.id} AND download_token IS NULL
    `
  }
}
