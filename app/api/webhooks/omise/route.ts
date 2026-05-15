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
  const secret = process.env.OMISE_WEBHOOK_SECRET
  if (!secret) {
    console.error('[WEBHOOK] OMISE_WEBHOOK_SECRET not configured — rejecting all requests')
    return false
  }
  const keyBuf   = Buffer.from(secret, 'base64')
  const expected = crypto.createHmac('sha256', keyBuf).update(rawBody).digest('hex')
  try {
    if (Buffer.byteLength(expected) !== Buffer.byteLength(signature)) return false
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch (err) {
    console.error('[WEBHOOK] Signature verification error:', err)
    return false
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const sig     = req.headers.get('omise-signature') ?? ''

  if (!verifySignature(rawBody, sig)) {
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

    const [order] = await db<{ id: string; status: string; total_baht: number; customer_line_id: string | null; promo_code_id: string | null; discount_baht: number | null }[]>`
      SELECT id, status, total_baht, customer_line_id, promo_code_id, discount_baht FROM orders WHERE order_uid = ${orderUid} LIMIT 1
    `
    if (!order || order.status !== 'pending_payment') return NextResponse.json({ ok: true })

    // M-002: re-validate promo code is still active at payment confirmation time
    if (order.promo_code_id) {
      const [pc] = await db<{ is_active: boolean; expires_at: string; max_uses: number | null; used_count: number }[]>`
        SELECT is_active, expires_at, max_uses, used_count FROM promo_codes WHERE id = ${order.promo_code_id} LIMIT 1
      `.catch(() => [])
      const promoRevoked = !pc || !pc.is_active || new Date() > new Date(pc.expires_at)
        || (pc.max_uses !== null && pc.used_count > pc.max_uses)
      if (promoRevoked) {
        console.warn(`[WEBHOOK] promo ${order.promo_code_id} revoked/expired after payment — order ${orderUid} discount_baht=${order.discount_baht}`)
      }
    }

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

    const titles = await db<{ title: string }[]>`
      SELECT t.title FROM order_items oi
      JOIN templates t ON t.id = oi.template_id
      WHERE oi.order_id = ${order.id}
    `
    const titleList = titles.map((t, i) => `  ${i + 1}. ${t.title}`).join('\n')

    // Notify buyer via LINE if captured at checkout
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
