// WALLET-CLEAN: ลบออกถาวร 2026-05-17
// WALLET-PUB-1: fetch top-5 public coupons for /wallet page (no auth required)
// Featured coupon (today's daily_featured_coupons pick) is always first.
// Remaining slots filled by highest-value active coupons.

import { db } from '@/lib/db'

export interface PublicCoupon {
  id: string
  code: string
  title: string
  platform: string
  discountValue: number
  discountType: 'fixed' | 'percent' | 'shipping' | 'cashback'
  minSpend: number
  expireAt: string | null
  isFeatured: boolean
  verifiedAt: string | null
  successRate: number | null
  lastUsedAt: string | null
}

interface RawRow {
  id: string
  code: string
  title: string
  platform: string
  discount_value: number
  type: string
  min_spend: number
  expire_at: string | null
  is_featured: boolean
  verified_at: string | null
  success_rate: number | null
  last_used_at: string | null
}

export async function getPublicWalletCoupons(): Promise<PublicCoupon[]> {
  try {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })

    const rows = await db<RawRow[]>`
      WITH featured AS (
        SELECT coupon_id FROM daily_featured_coupons
        WHERE date = ${today}::date
        LIMIT 1
      )
      SELECT
        c.id, c.code, c.title, c.platform,
        c.discount_value, c.type, c.min_spend, c.expire_at,
        (c.id IN (SELECT coupon_id FROM featured)) AS is_featured,
        c.verified_at, c.success_rate,
        (SELECT MAX(cv.created_at) FROM coupon_votes cv
         WHERE cv.coupon_code = c.code AND cv.vote = 'up') AS last_used_at
      FROM coupons c
      WHERE c.is_active = true
        AND c.code IS NOT NULL
        AND (c.expire_at IS NULL OR c.expire_at > NOW())
      ORDER BY
        (c.id IN (SELECT coupon_id FROM featured)) DESC,
        c.discount_value DESC
      LIMIT 5
    `

    return rows.map(r => ({
      id:            r.id,
      code:          r.code,
      title:         r.title,
      platform:      r.platform,
      discountValue: r.discount_value,
      discountType:  r.type as PublicCoupon['discountType'],
      minSpend:      r.min_spend,
      expireAt:      r.expire_at,
      isFeatured:    r.is_featured,
      verifiedAt:    r.verified_at,
      successRate:   r.success_rate,
      lastUsedAt:    r.last_used_at,
    }))
  } catch {
    return []
  }
}
