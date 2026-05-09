import { db } from '@/lib/db'
import { calculateCartTotal, type CartTotals } from './pricing'

export interface CartItem {
  cartItemId: string
  templateId: string
  title: string
  slug: string
  tier: string
  thumbnailPath: string | null
}

export interface CartData {
  sessionId: string
  items: CartItem[]
  totals: CartTotals
}

export async function getCartBySession(sessionId: string): Promise<CartData> {
  const rows = await db<Array<{
    cart_item_id: string
    template_id: string
    title: string
    slug: string
    tier: string
    thumbnail_path: string | null
  }>>`
    SELECT ci.id AS cart_item_id, t.id AS template_id,
           t.title, t.slug, t.tier, t.thumbnail_path
    FROM carts c
    JOIN cart_items ci ON ci.cart_id = c.id
    JOIN templates t   ON t.id = ci.template_id AND t.status = 'published'
    WHERE c.session_id = ${sessionId}
      AND c.expires_at > NOW()
    ORDER BY ci.added_at ASC
  `
  const items: CartItem[] = rows.map(r => ({
    cartItemId:    r.cart_item_id,
    templateId:    r.template_id,
    title:         r.title,
    slug:          r.slug,
    tier:          r.tier,
    thumbnailPath: r.thumbnail_path,
  }))
  const paidCount = items.filter(i => i.tier !== 'free').length
  return { sessionId, items, totals: calculateCartTotal(paidCount) }
}

export async function upsertCart(sessionId: string): Promise<void> {
  await db`
    INSERT INTO carts (session_id)
    VALUES (${sessionId})
    ON CONFLICT (session_id) DO UPDATE
      SET expires_at = NOW() + INTERVAL '7 days'
  `
}

export async function addItemToCart(sessionId: string, templateId: string): Promise<void> {
  await upsertCart(sessionId)
  await db`
    INSERT INTO cart_items (cart_id, template_id)
    SELECT c.id, ${templateId}
    FROM carts c
    WHERE c.session_id = ${sessionId}
    ON CONFLICT (cart_id, template_id) DO NOTHING
  `
}

export async function removeItemFromCart(sessionId: string, templateId: string): Promise<void> {
  await db`
    DELETE FROM cart_items
    WHERE template_id = ${templateId}
      AND cart_id = (SELECT id FROM carts WHERE session_id = ${sessionId})
  `
}

export const CART_COOKIE = '_cart_sid'
export const CART_COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
}
