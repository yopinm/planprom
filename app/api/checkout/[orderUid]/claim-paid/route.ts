// POST /api/checkout/[orderUid]/claim-paid — trust-based payment claim for cart orders
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { CART_COOKIE } from '@/lib/cart'
import { getCharge } from '@/lib/omise'
import { pushLine } from '@/lib/line-messaging'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://couponkum.com'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ orderUid: string }> },
) {
  const { orderUid } = await params

  const [order] = await db<{
    id: string; status: string; total_baht: number; fraud_flag: string; omise_charge_id: string | null; customer_line_id: string | null
  }[]>`
    SELECT id, status, total_baht, fraud_flag, omise_charge_id, customer_line_id
    FROM orders WHERE order_uid = ${orderUid} LIMIT 1
  `
  if (!order) return NextResponse.json({ error: 'order not found' }, { status: 404 })
  if (order.fraud_flag === 'revoked') return NextResponse.json({ error: 'order revoked' }, { status: 403 })

  // Idempotent — already paid
  if (order.status === 'paid') return buildPaidResponse(orderUid, order.id)

  if (order.status !== 'pending_payment') {
    return NextResponse.json({ error: `order status: ${order.status}` }, { status: 400 })
  }

  // Verify payment with Omise before issuing tokens — prevents bypass without actual payment
  if (order.omise_charge_id) {
    try {
      const charge = await getCharge(order.omise_charge_id)
      if (charge.status !== 'successful') {
        return NextResponse.json({ error: 'ยังไม่ได้รับการยืนยันการชำระเงิน' }, { status: 402 })
      }
    } catch {
      return NextResponse.json({ error: 'ไม่สามารถตรวจสอบการชำระเงินได้ กรุณาลองใหม่' }, { status: 502 })
    }
  }

  // Issue download tokens for each item
  const items   = await db<{ id: string; template_id: string }[]>`
    SELECT id, template_id FROM order_items WHERE order_id = ${order.id}
  `
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
  for (const item of items) {
    await db`
      UPDATE order_items
      SET download_token      = ${randomBytes(32).toString('hex')},
          download_expires_at = ${expires}
      WHERE id = ${item.id}
    `
  }

  await db`
    UPDATE orders SET status = 'paid', paid_at = NOW()
    WHERE id = ${order.id}
  `

  // Clear cart
  const cookieStore = await cookies()
  const sessionId   = cookieStore.get(CART_COOKIE)?.value
  if (sessionId) {
    await db`DELETE FROM carts WHERE session_id = ${sessionId}`
  }

  const titles = await db<{ title: string }[]>`
    SELECT t.title FROM order_items oi
    JOIN templates t ON t.id = oi.template_id
    WHERE oi.order_id = ${order.id}
  `
  const titleList = titles.map((t, i) => `  ${i + 1}. ${t.title}`).join('\n')

  // Notify buyer via LINE if they were logged in at checkout
  if (order.customer_line_id) {
    const dlRows = await db<{ download_token: string | null }[]>`
      SELECT download_token FROM order_items WHERE order_id = ${order.id} ORDER BY id
    `
    const dlLinks = dlRows
      .filter(r => r.download_token)
      .map((r, i) => `  ${i + 1}. ${SITE_URL}/api/download/${r.download_token}`)
      .join('\n')
    await pushLine(order.customer_line_id, [{
      type: 'text',
      text: [
        `✅ ขอบคุณที่ซื้อ — แพลนพร้อม!`,
        ``,
        `💰 ฿${order.total_baht} (${items.length} ชิ้น)`,
        `📌 เลข order: ${orderUid}`,
        titleList,
        ``,
        `🔗 ดาวน์โหลดได้ที่:`,
        dlLinks || `${SITE_URL}/order/${orderUid}`,
        ``,
        `⏰ ลิงก์ใช้ได้ 24 ชม. · สูงสุด 3 ครั้งต่อไฟล์`,
      ].join('\n'),
    }]).catch(() => null)
  }

  // Notify owner
  const ownerLineId = process.env.OWNER_LINE_USER_ID
  if (ownerLineId) {
    await pushLine(ownerLineId, [{
      type: 'text',
      text: [
        `🛒 Cart Order ใหม่ — แพลนพร้อม`,
        ``,
        `💰 ฿${order.total_baht} (${items.length} ชิ้น)`,
        `📌 ${orderUid}`,
        titleList,
        ``,
        `✅ เช็ค bank แล้ว audit ที่:`,
        `${SITE_URL}/admin/orders`,
      ].join('\n'),
    }]).catch(() => null)
  }

  return buildPaidResponse(orderUid, order.id)
}

async function buildPaidResponse(orderUid: string, orderId: string) {
  const rows = await db<{ title: string; download_token: string | null }[]>`
    SELECT t.title, oi.download_token
    FROM order_items oi
    JOIN templates t ON t.id = oi.template_id
    WHERE oi.order_id = ${orderId}
    ORDER BY oi.id
  `
  return NextResponse.json({
    orderUid,
    items: rows.map(r => ({
      title:       r.title,
      downloadUrl: r.download_token ? `${SITE_URL}/api/download/${r.download_token}` : null,
    })),
  })
}
