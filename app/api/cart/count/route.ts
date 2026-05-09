import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getCartBySession, CART_COOKIE } from '@/lib/cart'

export const dynamic = 'force-dynamic'

export async function GET() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(CART_COOKIE)?.value
  if (!sessionId) return NextResponse.json({ count: 0 })
  try {
    const cart = await getCartBySession(sessionId)
    return NextResponse.json({ count: cart.items.length })
  } catch {
    return NextResponse.json({ count: 0 })
  }
}
