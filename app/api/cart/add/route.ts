import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { addItemToCart, getCartBySession, CART_COOKIE, CART_COOKIE_OPTS } from '@/lib/cart'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { templateId?: string }
  if (!body.templateId) return NextResponse.json({ error: 'templateId required' }, { status: 400 })

  // Verify template exists and is published
  const [template] = await db<Array<{ id: string }>>`
    SELECT id FROM templates WHERE id = ${body.templateId} AND status = 'published' LIMIT 1
  `
  if (!template) return NextResponse.json({ error: 'template not found' }, { status: 404 })

  const cookieStore = await cookies()
  const sessionId = cookieStore.get(CART_COOKIE)?.value ?? randomUUID()

  await addItemToCart(sessionId, body.templateId)
  const cart = await getCartBySession(sessionId)

  const res = NextResponse.json(cart)
  res.cookies.set(CART_COOKIE, sessionId, CART_COOKIE_OPTS)
  return res
}
