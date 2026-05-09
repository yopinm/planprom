// POST /api/checkout — create order from cart + Omise PromptPay charge
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { getCartBySession, CART_COOKIE } from '@/lib/cart'
import { createPromptPayCharge } from '@/lib/omise'

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

export async function POST() {
  const cookieStore = await cookies()
  const sessionId   = cookieStore.get(CART_COOKIE)?.value
  if (!sessionId) return NextResponse.json({ error: 'cart empty' }, { status: 400 })

  const cart = await getCartBySession(sessionId)
  if (cart.items.length === 0) return NextResponse.json({ error: 'cart empty' }, { status: 400 })

  const { total } = cart.totals

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

  if (total > 0) {
    let charge
    try {
      charge = await createPromptPayCharge(total, { type: 'cart', order_uid: uid })
    } catch (err) {
      return NextResponse.json({ error: `Omise error: ${(err as Error).message}` }, { status: 502 })
    }
    qrImageUrl    = charge.source?.scannable_code?.image?.download_uri ?? ''
    omiseChargeId = charge.id
  }

  const [order] = await db<{ id: string }[]>`
    INSERT INTO orders (order_uid, total_baht, omise_charge_id, status, order_type)
    VALUES (
      ${uid},
      ${total},
      ${omiseChargeId},
      ${total === 0 ? 'paid' : 'pending_payment'},
      'cart'
    )
    RETURNING id
  `

  for (const item of itemPrices) {
    await db`
      INSERT INTO order_items (order_id, template_id, unit_price)
      VALUES (${order.id}, ${item.templateId}, ${item.unitPrice})
    `
  }

  // Free-only cart — issue tokens immediately + clear cart
  if (total === 0) {
    await issueTokens(order.id)
    await db`DELETE FROM carts WHERE session_id = ${sessionId}`
    return NextResponse.json({ orderUid: uid, qrImageUrl: '', total: 0, paid: true })
  }

  return NextResponse.json({ orderUid: uid, qrImageUrl, total, paid: false })
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
