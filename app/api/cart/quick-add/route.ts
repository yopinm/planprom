// GET /api/cart/quick-add?slug=xxx — add template to cart then redirect to /checkout
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'
import { db } from '@/lib/db'
import { addItemToCart, CART_COOKIE, CART_COOKIE_OPTS } from '@/lib/cart'

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.redirect(new URL('/templates', req.url))

  const [tmpl] = await db<{ id: string }[]>`
    SELECT id FROM templates WHERE slug = ${slug} AND status = 'published' LIMIT 1
  `
  if (!tmpl) return NextResponse.redirect(new URL('/templates', req.url))

  const cookieStore = await cookies()
  const sessionId = cookieStore.get(CART_COOKIE)?.value ?? randomUUID()

  await addItemToCart(sessionId, tmpl.id)

  const res = NextResponse.redirect(new URL('/checkout', req.url))
  res.cookies.set(CART_COOKIE, sessionId, CART_COOKIE_OPTS)
  return res
}
