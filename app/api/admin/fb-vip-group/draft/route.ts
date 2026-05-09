// DIST-03B: /api/admin/fb-vip-group/draft — POST + PATCH

import { NextRequest, NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import type { Product } from '@/types'
import {
  buildGroupSubId,
  renderGroupCaption,
  PILLAR_KEYS,
  type PillarKey,
  type GroupCaptionVars,
} from '@/lib/social/fb-group-templates'
import { buildCouponkumUrl, fmtPrice } from '@/lib/social/fb-templates'

export async function PATCH(req: NextRequest) {
  await requireAdminSession('/admin/fb-vip-group')

  const body = await req.json() as {
    id: string
    status: 'copied' | 'posted' | 'skipped'
    fb_post_url?: string
  }

  if (!body.id || !['copied', 'posted', 'skipped'].includes(body.status)) {
    return NextResponse.json({ error: 'invalid_params' }, { status: 400 })
  }

  await db`
    UPDATE fb_group_posts
    SET status      = ${body.status},
        posted_at   = ${body.status === 'posted' ? new Date() : null},
        fb_post_url = ${body.fb_post_url ?? null},
        updated_at  = NOW()
    WHERE id = ${body.id}
  `

  return NextResponse.json({ ok: true })
}

export async function POST(req: NextRequest) {
  await requireAdminSession('/admin/fb-vip-group')

  const body = await req.json() as {
    pillar: string
    template_id: string
    product_id?: string
  }

  const { pillar, template_id, product_id } = body

  if (!PILLAR_KEYS.includes(pillar as PillarKey)) {
    return NextResponse.json({ error: 'invalid_pillar' }, { status: 400 })
  }
  if (!template_id) {
    return NextResponse.json({ error: 'template_required' }, { status: 400 })
  }

  const pillarKey = pillar as PillarKey

  // Fetch template
  const [tpl] = await db<{ id: string; template: string; name: string }[]>`
    SELECT id, template, name FROM fb_group_caption_templates
    WHERE id = ${template_id} AND pillar = ${pillar} AND is_active = true
    LIMIT 1
  `
  if (!tpl) {
    return NextResponse.json({ error: 'template_not_found' }, { status: 404 })
  }

  // Count today's posts for this pillar to determine seq
  const [seqRow] = await db<{ cnt: string }[]>`
    SELECT COUNT(*) AS cnt FROM fb_group_posts
    WHERE pillar = ${pillar}
    AND DATE(created_at AT TIME ZONE 'Asia/Bangkok') = CURRENT_DATE AT TIME ZONE 'Asia/Bangkok'
  `
  const seq = parseInt(seqRow?.cnt ?? '0', 10) + 1

  const sub_id = buildGroupSubId(pillarKey, seq)

  let vars: GroupCaptionVars = {
    name: '—', original: '—', net: '—', save: '—', coupon: '—', url: '—',
  }
  let couponkum_url: string | null = null
  let coupon_code: string | null = null
  let product_name: string | null = null

  if (product_id) {
    const [product] = await db<Product[]>`
      SELECT * FROM products WHERE id = ${product_id} AND is_active = true LIMIT 1
    `
    if (product) {
      const [couponRow] = await db<{ code: string }[]>`
        SELECT code FROM coupons
        WHERE (platform = ${product.platform} OR platform = 'all')
          AND is_active = true AND code IS NOT NULL
        ORDER BY tier ASC LIMIT 1
      `
      coupon_code = couponRow?.code ?? null
      couponkum_url = buildCouponkumUrl(product.id, sub_id)
      const savings = (product.price_original ?? product.price_current) - product.price_current
      vars = {
        name:     product.name,
        original: fmtPrice(product.price_original ?? product.price_current),
        net:      fmtPrice(product.price_current),
        save:     fmtPrice(Math.max(0, savings)),
        coupon:   coupon_code || 'ดูในหน้าสินค้า',
        url:      couponkum_url,
      }
      product_name = product.name
    }
  }

  const caption = renderGroupCaption(tpl.template, vars)

  const [inserted] = await db<{ id: string }[]>`
    INSERT INTO fb_group_posts
      (sub_id, pillar, template_id, product_id, caption, couponkum_url, coupon_code)
    VALUES
      (${sub_id}, ${pillar}, ${tpl.id}, ${product_id ?? null}, ${caption},
       ${couponkum_url}, ${coupon_code})
    ON CONFLICT (sub_id) DO UPDATE
      SET caption = EXCLUDED.caption, updated_at = NOW()
    RETURNING id
  `

  return NextResponse.json({
    id:           inserted.id,
    sub_id,
    pillar,
    template_name: tpl.name,
    caption,
    couponkum_url,
    coupon_code,
    product_name,
  })
}
