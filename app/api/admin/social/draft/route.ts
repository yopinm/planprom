// POST /api/admin/social/draft — DIST-01
// Creates a fb_manual_posts row, returns caption + sub_id for owner to copy

import { NextRequest, NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import type { Product } from '@/types'
import {
  buildFbSubId,
  buildCouponkumUrl,
  renderCaption,
  fmtPrice,
  HOOK_FORMAT_KEYS,
  type HookFormatKey,
} from '@/lib/social/fb-templates'

// PATCH /api/admin/social/draft — update status (copied | posted | skipped)
export async function PATCH(req: NextRequest) {
  await requireAdminSession('/admin/social/templates')

  const body = await req.json() as {
    id: string
    status: 'copied' | 'posted' | 'skipped'
    fb_post_url?: string
  }

  if (!body.id || !['copied', 'posted', 'skipped'].includes(body.status)) {
    return NextResponse.json({ error: 'invalid_params' }, { status: 400 })
  }

  await db`
    UPDATE fb_manual_posts
    SET status     = ${body.status},
        posted_at  = ${body.status === 'posted' ? new Date() : null},
        fb_post_url = ${body.fb_post_url ?? null},
        updated_at = NOW()
    WHERE id = ${body.id}
  `

  return NextResponse.json({ ok: true })
}

export async function POST(req: NextRequest) {
  await requireAdminSession('/admin/social/templates')

  const body = await req.json() as {
    product_id: string
    hook_format: string
    slot_number: number
  }

  const { product_id, hook_format, slot_number } = body

  if (!product_id || !HOOK_FORMAT_KEYS.includes(hook_format as HookFormatKey)) {
    return NextResponse.json({ error: 'invalid_params' }, { status: 400 })
  }
  if (![1, 2, 3].includes(slot_number)) {
    return NextResponse.json({ error: 'invalid_slot' }, { status: 400 })
  }

  const hook = hook_format as HookFormatKey
  const slot = slot_number as 1 | 2 | 3

  // Fetch product
  const [product] = await db<Product[]>`
    SELECT * FROM products WHERE id = ${product_id} AND is_active = true LIMIT 1
  `
  if (!product) {
    return NextResponse.json({ error: 'product_not_found' }, { status: 404 })
  }

  // Best coupon code for this product's platform
  const [couponRow] = await db<{ code: string }[]>`
    SELECT code FROM coupons
    WHERE (platform = ${product.platform} OR platform = 'all')
      AND is_active = true AND code IS NOT NULL
    ORDER BY tier ASC LIMIT 1
  `
  const couponCode = couponRow?.code ?? ''

  const sub_id = buildFbSubId(slot, hook)
  const couponkum_url = buildCouponkumUrl(product.id, sub_id)

  const savings = (product.price_original ?? product.price_current) - product.price_current
  const caption = renderCaption(hook, {
    name:     product.name,
    original: fmtPrice(product.price_original ?? product.price_current),
    net:      fmtPrice(product.price_current),
    save:     fmtPrice(Math.max(0, savings)),
    coupon:   couponCode || 'ดูในหน้าสินค้า',
    rating:   product.rating ? product.rating.toFixed(1) : '—',
    platform: product.platform === 'shopee' ? 'Shopee' : product.platform === 'lazada' ? 'Lazada' : product.platform,
    url:      couponkum_url,
  })

  const [inserted] = await db<{ id: string }[]>`
    INSERT INTO fb_manual_posts (sub_id, hook_format, slot_number, product_id, caption, couponkum_url, coupon_code)
    VALUES (${sub_id}, ${hook}, ${slot}, ${product.id}, ${caption}, ${couponkum_url}, ${couponCode || null})
    ON CONFLICT (sub_id) DO UPDATE
      SET caption = EXCLUDED.caption, updated_at = NOW()
    RETURNING id
  `

  return NextResponse.json({
    id:           inserted.id,
    sub_id,
    caption,
    couponkum_url,
    coupon_code:  couponCode || null,
    product_name: product.name,
    hook_format:  hook,
    slot_number:  slot,
  })
}
