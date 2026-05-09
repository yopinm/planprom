// GET /api/webhooks/omise — Omise URL validation ping
export async function GET() {
  return new Response('OK', { status: 200 })
}

// POST /api/webhooks/omise — handle charge.complete from Omise
import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { pushLine } from '@/lib/line-messaging'
import crypto from 'crypto'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://planprom.com'

function verifySignature(rawBody: string, signature: string): boolean {
  const secret = process.env.OMISE_WEBHOOK_SECRET ?? process.env.OMISE_SECRET_KEY ?? ''
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const sig     = req.headers.get('x-omise-signature') ?? ''

  if (sig && !verifySignature(rawBody, sig)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: {
    key:  string
    data: { id: string; status: string; metadata?: Record<string, string> }
  }
  try { event = JSON.parse(rawBody) } catch { return NextResponse.json({ error: 'Bad JSON' }, { status: 400 }) }

  if (event.key !== 'charge.complete') return NextResponse.json({ ok: true })

  const { status, metadata, id: chargeId } = event.data
  if (status !== 'successful') return NextResponse.json({ ok: true })

  const type = metadata?.type

  // ── Cart order (orders + order_items) ──────────────────────────────
  if (type === 'cart') {
    const orderUid = metadata?.order_uid
    if (!orderUid) return NextResponse.json({ ok: true })

    const [order] = await db<{ id: string; status: string; total_baht: number }[]>`
      SELECT id, status, total_baht FROM orders WHERE order_uid = ${orderUid} LIMIT 1
    `
    if (!order || order.status !== 'pending_payment') return NextResponse.json({ ok: true })

    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const items   = await db<{ id: string }[]>`SELECT id FROM order_items WHERE order_id = ${order.id}`
    for (const item of items) {
      await db`
        UPDATE order_items
        SET download_token = ${randomBytes(32).toString('hex')}, download_expires_at = ${expires}
        WHERE id = ${item.id} AND download_token IS NULL
      `
    }
    await db`UPDATE orders SET status = 'paid', paid_at = NOW() WHERE id = ${order.id}`

    const ownerLineId = process.env.OWNER_LINE_USER_ID
    if (ownerLineId) {
      const titles = await db<{ title: string }[]>`
        SELECT t.title FROM order_items oi
        JOIN templates t ON t.id = oi.template_id
        WHERE oi.order_id = ${order.id}
      `
      const titleList = titles.map((t, i) => `  ${i + 1}. ${t.title}`).join('\n')
      await pushLine(ownerLineId, [{
        type: 'text',
        text: [
          `🛒 Cart Order ใหม่ — แพลนพร้อม`,
          ``,
          `💰 ฿${order.total_baht} (${items.length} ชิ้น)`,
          `📌 ${orderUid}`,
          titleList,
          ``,
          `✅ ชำระผ่าน Omise QR แล้ว`,
          `${SITE_URL}/admin/orders`,
        ].join('\n'),
      }]).catch(() => null)
    }
    return NextResponse.json({ ok: true })
  }

  // ── Single template order (template_orders) ─────────────────────────
  if (type === 'template') {
    const [order] = await db<{
      id: string; order_number: string; customer_line_id: string
      amount_baht: number; template_id: string; status: string
    }[]>`
      SELECT id, order_number, customer_line_id, amount_baht, template_id, status
      FROM template_orders WHERE omise_charge_id = ${chargeId} LIMIT 1
    `
    if (!order || order.status !== 'pending_payment') return NextResponse.json({ ok: true })

    const token   = randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await db`
      UPDATE template_orders SET
        status              = 'paid',
        claimed_at          = NOW(),
        paid_at             = NOW(),
        download_token      = ${token},
        download_expires_at = ${expires},
        fraud_flag          = 'clean'
      WHERE id = ${order.id}
    `

    const [tmpl] = await db<{ title: string }[]>`SELECT title FROM templates WHERE id = ${order.template_id} LIMIT 1`
    const downloadUrl = `${SITE_URL}/d/${token}`

    await pushLine(order.customer_line_id, [{
      type: 'text',
      text: [
        `✅ ชำระเงินสำเร็จ — แพลนพร้อม!`,
        `📄 ${tmpl?.title ?? 'Template'}`,
        `🔗 ดาวน์โหลด: ${downloadUrl}`,
        `⏰ ใช้ได้ 24 ชม. · สูงสุด 3 ครั้ง`,
        `📌 ${order.order_number}`,
      ].join('\n'),
    }]).catch(() => null)

    const ownerLineId = process.env.OWNER_LINE_USER_ID
    if (ownerLineId) {
      await pushLine(ownerLineId, [{
        type: 'text',
        text: [`🛒 Template paid — ฿${order.amount_baht} · ${tmpl?.title} · ${order.order_number}`].join('\n'),
      }]).catch(() => null)
    }
    return NextResponse.json({ ok: true })
  }

  // ── Pack credits ────────────────────────────────────────────────────
  if (type === 'pack') {
    const [pack] = await db<{
      id: string; order_number: string; customer_line_id: string
      total_credits: number; amount_baht: number; status: string
    }[]>`
      SELECT id, order_number, customer_line_id, total_credits, amount_baht, status
      FROM pack_credits WHERE omise_charge_id = ${chargeId} LIMIT 1
    `
    if (!pack || pack.status !== 'pending_payment') return NextResponse.json({ ok: true })

    const expires = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    await db`
      UPDATE pack_credits SET status = 'active', claimed_at = NOW(), expires_at = ${expires}
      WHERE id = ${pack.id}
    `

    await pushLine(pack.customer_line_id, [{
      type: 'text',
      text: [
        `✅ ชำระเงินสำเร็จ — แพลนพร้อม!`,
        `🎫 ${pack.total_credits} credits พร้อมใช้`,
        `📌 ${pack.order_number}`,
        `⏰ หมดอายุ: ${expires.toLocaleDateString('th-TH')}`,
        ``,
        `ไปเลือก Template ได้เลย:`,
        `${SITE_URL}/templates`,
      ].join('\n'),
    }]).catch(() => null)

    const ownerLineId = process.env.OWNER_LINE_USER_ID
    if (ownerLineId) {
      await pushLine(ownerLineId, [{
        type: 'text',
        text: [`🛒 Pack paid — ฿${pack.amount_baht} (${pack.total_credits} credits) · ${pack.order_number}`].join('\n'),
      }]).catch(() => null)
    }
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ ok: true })
}
