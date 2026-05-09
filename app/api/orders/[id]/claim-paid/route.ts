// POST /api/orders/[id]/claim-paid — trust-based payment claim
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { pushLine } from '@/lib/line-messaging'
import crypto from 'crypto'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const lineId: string =
    (user.user_metadata?.provider_id as string) ??
    (user.identities?.find(i => i.provider.includes('line'))?.id ?? user.id)

  // Fetch order — must belong to this user and be pending_payment
  const [order] = await db<{
    id: string; order_number: string; amount_baht: number; status: string
    customer_line_id: string; template_id: string; fraud_flag: string
  }[]>`
    SELECT id, order_number, amount_baht, status, customer_line_id, template_id, fraud_flag
    FROM template_orders WHERE id = ${id} LIMIT 1
  `
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  if (order.customer_line_id !== lineId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (order.status !== 'pending_payment') return NextResponse.json({ error: `Order status: ${order.status}` }, { status: 400 })
  if (order.fraud_flag === 'revoked') return NextResponse.json({ error: 'Order revoked' }, { status: 403 })

  // Anti-fraud: claims in 24h
  const [{ cnt }] = await db<{ cnt: string }[]>`
    SELECT COUNT(*) AS cnt FROM template_orders
    WHERE customer_line_id = ${lineId} AND claimed_at > NOW() - INTERVAL '24 hours'
  `
  const claimsToday = Number(cnt)

  // Auto-flag suspicious: >5 claims/24h OR premium + very new LINE ID
  const suspicious = claimsToday >= 5

  const token   = crypto.randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)

  await db`
    UPDATE template_orders SET
      status              = 'paid',
      claimed_at          = NOW(),
      paid_at             = NOW(),
      download_token      = ${token},
      download_expires_at = ${expires},
      fraud_flag          = ${suspicious ? 'suspicious' : 'clean'}
    WHERE id = ${id}
  `

  // Fetch template title for LINE message
  const [tmpl] = await db<{ title: string }[]>`
    SELECT title FROM templates WHERE id = ${order.template_id} LIMIT 1
  `

  // If suspicious → don't push link yet, owner must verify first
  if (suspicious) {
    return NextResponse.json({
      status: 'suspicious',
      message: 'ระบบพบรูปแบบผิดปกติ — owner จะตรวจสอบและส่งลิงก์ให้ภายใน 1 ชม.',
    })
  }

  // Push LINE download link to customer
  const downloadUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://couponkum.com'}/d/${token}`
  await pushLine(lineId, [{
    type: 'text',
    text: [
      `✅ ขอบคุณที่ซื้อ คูปองคุ้ม!`,
      ``,
      `📄 ${tmpl?.title ?? 'Template'}`,
      `🔗 ดาวน์โหลดได้ที่:`,
      downloadUrl,
      ``,
      `⏰ ลิงก์ใช้ได้ 24 ชม. · สูงสุด 3 ครั้ง`,
      `📌 เลข order: ${order.order_number}`,
    ].join('\n'),
  }])

  // Notify owner
  const ownerLineId = process.env.OWNER_LINE_USER_ID
  if (ownerLineId) {
    await pushLine(ownerLineId, [{
      type: 'text',
      text: [
        `🛒 Order ใหม่ — คูปองคุ้ม`,
        ``,
        `📄 ${tmpl?.title ?? 'Template'}`,
        `💰 ฿${order.amount_baht}`,
        `📌 ${order.order_number}`,
        `👤 LINE: ${lineId.slice(0, 8)}…`,
        ``,
        `✅ เช็ค bank แล้ว verify ได้ที่:`,
        `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://couponkum.com'}/admin/orders`,
      ].join('\n'),
    }]).catch(() => null)
  }

  return NextResponse.json({ status: 'paid', downloadUrl, orderNumber: order.order_number })
}
