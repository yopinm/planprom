import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { addItemToCart, getCartBySession, CART_COOKIE, CART_COOKIE_OPTS } from '@/lib/cart'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { templateId?: string; unlockCode?: string }
  if (!body.templateId) return NextResponse.json({ error: 'templateId required' }, { status: 400 })

  const [template] = await db<Array<{ id: string; is_request_only: boolean }>>`
    SELECT id, is_request_only FROM templates WHERE id = ${body.templateId} AND status = 'published' LIMIT 1
  `
  if (!template) return NextResponse.json({ error: 'template not found' }, { status: 404 })

  if (template.is_request_only) {
    if (!body.unlockCode) return NextResponse.json({ error: 'กรุณากรอก Unlock Code' }, { status: 403 })

    const code = body.unlockCode.toUpperCase().trim()
    const [promo] = await db<Array<{ id: string; max_uses: number | null; used_count: number }>>`
      SELECT id, max_uses, used_count FROM promo_codes
      WHERE code = ${code}
        AND template_id = ${body.templateId}
        AND is_active = true
        AND expires_at > NOW()
      LIMIT 1
    `
    if (!promo)
      return NextResponse.json({ error: 'Unlock Code ไม่ถูกต้องหรือหมดอายุ' }, { status: 403 })
    if (promo.max_uses !== null && promo.used_count >= promo.max_uses)
      return NextResponse.json({ error: 'Unlock Code ถูกใช้แล้ว' }, { status: 403 })

    await db`UPDATE promo_codes SET used_count = used_count + 1 WHERE id = ${promo.id}`
  }

  const cookieStore = await cookies()
  const sessionId   = cookieStore.get(CART_COOKIE)?.value ?? randomUUID()

  await addItemToCart(sessionId, body.templateId)
  const cart = await getCartBySession(sessionId)

  const res = NextResponse.json(cart)
  res.cookies.set(CART_COOKIE, sessionId, CART_COOKIE_OPTS)
  return res
}
