// DIST-03: /api/admin/outreach/draft — POST (create) + PATCH (update status)

import { NextRequest, NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import type { Product } from '@/types'
import {
  OUTREACH_FORMAT_KEYS,
  buildOutreachSubId,
  renderOutreachCaption,
  cooldownDaysRemaining,
  type OutreachFormatKey,
  type OutreachCaptionVars,
} from '@/lib/social/outreach'
import { buildCouponkumUrl, fmtPrice } from '@/lib/social/fb-templates'

interface OutreachGroup {
  id: string
  platform: string
  short_id: string
  name: string
  weekly_limit: number
}

export async function PATCH(req: NextRequest) {
  await requireAdminSession('/admin/outreach')

  const body = await req.json() as {
    id: string
    status: 'copied' | 'posted' | 'skipped'
    post_url?: string
  }

  if (!body.id || !['copied', 'posted', 'skipped'].includes(body.status)) {
    return NextResponse.json({ error: 'invalid_params' }, { status: 400 })
  }

  await db`
    UPDATE outreach_posts
    SET status     = ${body.status},
        posted_at  = ${body.status === 'posted' ? new Date() : null},
        post_url   = ${body.post_url ?? null},
        updated_at = NOW()
    WHERE id = ${body.id}
  `

  return NextResponse.json({ ok: true })
}

export async function POST(req: NextRequest) {
  await requireAdminSession('/admin/outreach')

  const body = await req.json() as {
    group_id: string
    format: string
    product_id?: string
  }

  const { group_id, format, product_id } = body

  if (!OUTREACH_FORMAT_KEYS.includes(format as OutreachFormatKey)) {
    return NextResponse.json({ error: 'invalid_format' }, { status: 400 })
  }
  if (!group_id) {
    return NextResponse.json({ error: 'group_required' }, { status: 400 })
  }

  const formatKey = format as OutreachFormatKey

  const [group] = await db<OutreachGroup[]>`
    SELECT id, platform, short_id, name, weekly_limit
    FROM outreach_groups
    WHERE id = ${group_id} AND is_active = true
    LIMIT 1
  `
  if (!group) {
    return NextResponse.json({ error: 'group_not_found' }, { status: 404 })
  }

  // Anti-spam: weekly cooldown check
  const [lastPostRow] = await db<{ last_posted_at: Date | null }[]>`
    SELECT MAX(posted_at) AS last_posted_at
    FROM outreach_posts
    WHERE group_id = ${group_id} AND status = 'posted'
  `
  const cooldown = cooldownDaysRemaining(lastPostRow?.last_posted_at ?? null, group.weekly_limit)
  if (cooldown > 0) {
    return NextResponse.json(
      { error: 'cooldown', message: `กลุ่มนี้โพสต์ได้อีก ${cooldown} วัน` },
      { status: 409 }
    )
  }

  // Product 30-day duplicate guard for same group
  if (product_id) {
    const [dupRow] = await db<{ cnt: string }[]>`
      SELECT COUNT(*) AS cnt FROM outreach_posts
      WHERE group_id  = ${group_id}
        AND product_id = ${product_id}
        AND status    = 'posted'
        AND created_at >= NOW() - INTERVAL '30 days'
    `
    if (parseInt(dupRow?.cnt ?? '0', 10) > 0) {
      return NextResponse.json(
        { error: 'duplicate_product', message: 'สินค้านี้โพสต์ในกลุ่มนี้ไปแล้วใน 30 วัน' },
        { status: 409 }
      )
    }
  }

  // Build sub_id — handle same-day collision with seq suffix
  const baseSubId = buildOutreachSubId(group.short_id)
  const [seqRow] = await db<{ cnt: string }[]>`
    SELECT COUNT(*) AS cnt FROM outreach_posts
    WHERE group_id = ${group_id}
      AND DATE(created_at AT TIME ZONE 'Asia/Bangkok') = CURRENT_DATE AT TIME ZONE 'Asia/Bangkok'
  `
  const seqCount = parseInt(seqRow?.cnt ?? '0', 10)
  const sub_id = seqCount > 0 ? `${baseSubId}_${seqCount + 1}` : baseSubId

  let vars: OutreachCaptionVars = {
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
        coupon:   coupon_code ?? 'ดูในหน้าสินค้า',
        url:      couponkum_url,
      }
      product_name = product.name
    }
  }

  const caption = renderOutreachCaption(formatKey, vars)

  const [inserted] = await db<{ id: string }[]>`
    INSERT INTO outreach_posts
      (group_id, sub_id, product_id, format, caption, couponkum_url, coupon_code)
    VALUES
      (${group_id}, ${sub_id}, ${product_id ?? null}, ${format},
       ${caption}, ${couponkum_url}, ${coupon_code})
    ON CONFLICT (sub_id) DO UPDATE
      SET caption = EXCLUDED.caption, updated_at = NOW()
    RETURNING id
  `

  return NextResponse.json({
    id:            inserted.id,
    sub_id,
    group_name:    group.name,
    format,
    caption,
    couponkum_url,
    coupon_code,
    product_name,
  })
}
