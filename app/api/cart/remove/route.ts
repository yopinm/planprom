import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { removeItemFromCart, getCartBySession, CART_COOKIE } from '@/lib/cart'

export async function DELETE(request: Request) {
  const body = await request.json().catch(() => ({})) as { templateId?: string }
  if (!body.templateId) return NextResponse.json({ error: 'templateId required' }, { status: 400 })

  const cookieStore = await cookies()
  const sessionId = cookieStore.get(CART_COOKIE)?.value
  if (!sessionId) return NextResponse.json({ error: 'no cart' }, { status: 404 })

  await removeItemFromCart(sessionId, body.templateId)
  const cart = await getCartBySession(sessionId)
  return NextResponse.json(cart)
}
