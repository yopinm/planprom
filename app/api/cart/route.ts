import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getCartBySession, CART_COOKIE } from '@/lib/cart'

export const dynamic = 'force-dynamic'

export async function GET() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(CART_COOKIE)?.value
  if (!sessionId) return NextResponse.json({ items: [], totals: { total: 0, nextItemPrice: 10, savedVsFullPrice: 0, paidItemCount: 0 } })
  try {
    const cart = await getCartBySession(sessionId)
    return NextResponse.json(cart)
  } catch {
    return NextResponse.json({ items: [], totals: { total: 0, nextItemPrice: 10, savedVsFullPrice: 0, paidItemCount: 0 } })
  }
}
