// POST /api/orders — create template order + Omise PromptPay charge
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { createPromptPayCharge } from '@/lib/omise'
import crypto from 'crypto'

function orderNumber(): string {
  const d   = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const seq = String(Math.floor(Math.random() * 9000) + 1000)
  return `PP-${d}-${seq}`
}

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'กรุณา Login ด้วย LINE ก่อน' }, { status: 401 })

  const lineId: string =
    (user.user_metadata?.provider_id as string) ??
    (user.identities?.find(i => i.provider.includes('line'))?.id ?? user.id)

  let body: { templateSlug?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const { templateSlug } = body
  if (!templateSlug) return NextResponse.json({ error: 'templateSlug required' }, { status: 400 })

  const [tmpl] = await db<{ id: string; title: string; price_baht: number; tier: string }[]>`
    SELECT id, title, price_baht, tier FROM templates WHERE slug = ${templateSlug} AND status = 'published' LIMIT 1
  `
  if (!tmpl) return NextResponse.json({ error: 'Template not found' }, { status: 404 })

  // Anti-fraud: pending count
  const [{ cnt: pendingCnt }] = await db<{ cnt: string }[]>`
    SELECT COUNT(*) AS cnt FROM template_orders
    WHERE customer_line_id = ${lineId} AND status = 'pending_payment'
  `
  if (Number(pendingCnt) >= 3) return NextResponse.json({ error: 'PENDING_LIMIT', code: 'PENDING_LIMIT' }, { status: 429 })

  // Anti-fraud: banned
  const [{ cnt: bannedCnt }] = await db<{ cnt: string }[]>`
    SELECT COUNT(*) AS cnt FROM template_orders
    WHERE customer_line_id = ${lineId} AND fraud_flag = 'revoked'
      AND created_at > NOW() - INTERVAL '30 days'
  `
  if (Number(bannedCnt) > 0) return NextResponse.json({ error: 'บัญชีนี้ถูกระงับ — ติดต่อ LINE OA' }, { status: 403 })

  const num = orderNumber()
  const ref = crypto.randomBytes(4).toString('hex').toUpperCase()

  // Create Omise PromptPay charge
  let charge
  try {
    charge = await createPromptPayCharge(tmpl.price_baht, {
      type:         'template',
      order_number: num,
    })
  } catch (err) {
    return NextResponse.json({ error: `Omise error: ${(err as Error).message}` }, { status: 502 })
  }

  const qrImageUrl = charge.source?.scannable_code?.image?.download_uri ?? ''

  const [order] = await db<{ id: string }[]>`
    INSERT INTO template_orders
      (order_number, template_id, customer_line_id, amount_baht, promptpay_ref, status, omise_charge_id)
    VALUES (${num}, ${tmpl.id}, ${lineId}, ${tmpl.price_baht}, ${ref}, 'pending_payment', ${charge.id})
    RETURNING id
  `

  return NextResponse.json({
    orderId:       order.id,
    orderNumber:   num,
    ref,
    amount:        tmpl.price_baht,
    chargeId:      charge.id,
    qrImageUrl,
    templateTitle: tmpl.title,
  })
}
