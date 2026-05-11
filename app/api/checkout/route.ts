// POST /api/checkout — create order from cart + Omise PromptPay charge
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { getCartBySession, CART_COOKIE } from '@/lib/cart'
import { createPromptPayCharge } from '@/lib/omise'
import { createServerClient } from '@/lib/supabase/server'

async function newOrderUid(): Promise<string> {
  const d = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const [{ n }] = await db<{ n: number }[]>`SELECT nextval('order_seq')::int AS n`
  return `CK-${d}-${String(n).padStart(4, '0')}`
}

function tierPriceForItem(position: number): number {
  if (position === 1) return 20
  if (position <= 5)  return 8
  return 7
}

export async function POST(req: NextRequest) {
  const body        = await req.json().catch(() => ({})) as { promo_code?: string }
  const promoCodeStr = body?.promo_code?.toUpperCase().trim() ?? null

  const cookieStore = await cookies()
  const sessionId   = cookieStore.get(CART_COOKIE)?.value
  if (!sessionId) return NextResponse.json({ error: 'cart empty' }, { status: 400 })

  // Capture buyer LINE ID if logged in via LINE — optional, guest checkout still works
  let customerLineId: string | null = null
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      customerLineId =
        (user.user_metadata?.provider_id as string | undefined) ??
        (user.identities?.find(i => i.provider.includes('line'))?.id ?? null)
    }
  } catch { /* guest checkout — no LINE ID */ }

  const cart = await getCartBySession(sessionId)
  if (cart.items.length === 0) return NextResponse.json({ error: 'cart empty' }, { status: 400 })

  const { total } = cart.totals

  // Validate promo code server-side
  let promoCodeId: string | null = null
  let discountBaht = 0
  if (promoCodeStr) {
    const [pc] = await db<{
      id: string; discount_type: string; discount_value: number
      min_cart_value: number; max_uses: number | null; used_count: number
      starts_at: string; expires_at: string; is_active: boolean
    }[]>`
      SELECT * FROM promo_codes WHERE code = ${promoCodeStr} AND is_active = true LIMIT 1
    `.catch(() => [])
    if (pc && new Date() >= new Date(pc.starts_at) && new Date() <= new Date(pc.expires_at)
        && (pc.max_uses === null || pc.used_count < pc.max_uses)
        && total >= pc.min_cart_value) {
      const raw = pc.discount_type === 'percent'
        ? Math.round(total * (pc.discount_value / 100) * 100) / 100
        : pc.discount_value
      discountBaht = Math.min(raw, total)
      promoCodeId  = pc.id
    }
  }
  const chargeTotal = Math.max(0, total - discountBaht)

  // Assign per-item unit prices
  let paidIdx = 0
  const itemPrices = cart.items.map(item => {
    if (item.tier === 'free') return { ...item, unitPrice: 0 }
    paidIdx++
    return { ...item, unitPrice: tierPriceForItem(paidIdx) }
  })

  const uid = await newOrderUid()

  let qrImageUrl   = ''
  let omiseChargeId: string | null = null

  if (chargeTotal > 0) {
    let charge
    try {
      charge = await createPromptPayCharge(chargeTotal, { type: 'cart', order_uid: uid })
    } catch (err) {
      return NextResponse.json({ error: `Omise error: ${(err as Error).message}` }, { status: 502 })
    }
    qrImageUrl    = charge.source?.scannable_code?.image?.download_uri ?? ''
    omiseChargeId = charge.id
  }

  const [order] = await db<{ id: string }[]>`
    INSERT INTO orders (order_uid, total_baht, omise_charge_id, status, order_type, customer_line_id, promo_code_id, discount_baht)
    VALUES (
      ${uid},
      ${chargeTotal},
      ${omiseChargeId},
      ${chargeTotal === 0 ? 'paid' : 'pending_payment'},
      'cart',
      ${customerLineId},
      ${promoCodeId},
      ${discountBaht}
    )
    RETURNING id
  `

  for (const item of itemPrices) {
    await db`
      INSERT INTO order_items (order_id, template_id, unit_price)
      VALUES (${order.id}, ${item.templateId}, ${item.unitPrice})
    `
  }

  // Record promo usage
  if (promoCodeId && discountBaht > 0) {
    await db`
      INSERT INTO promo_code_uses (promo_code_id, order_id, session_id, discount_applied)
      VALUES (${promoCodeId}, ${order.id}, ${sessionId}, ${discountBaht})
      ON CONFLICT (promo_code_id, order_id) DO NOTHING
    `
    await db`UPDATE promo_codes SET used_count = used_count + 1 WHERE id = ${promoCodeId}`
  }

  // Free-only cart — issue tokens immediately + clear cart
  if (chargeTotal === 0) {
    await issueTokens(order.id)
    await db`DELETE FROM carts WHERE session_id = ${sessionId}`
    return NextResponse.json({ orderUid: uid, qrImageUrl: '', total: 0, paid: true })
  }

  return NextResponse.json({ orderUid: uid, qrImageUrl, total: chargeTotal, paid: false })
}

async function issueTokens(orderId: string): Promise<void> {
  const items   = await db<{ id: string }[]>`SELECT id FROM order_items WHERE order_id = ${orderId}`
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
  for (const item of items) {
    await db`
      UPDATE order_items
      SET download_token = ${randomBytes(32).toString('hex')}, download_expires_at = ${expires}
      WHERE id = ${item.id}
    `
  }
}
