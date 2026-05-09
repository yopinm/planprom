// POSTLIVE-26: fetch today's auto-selected featured coupon (server-only)
// Returns null when table is empty; card stays hidden until cron populates data post go-live.
import { db } from '@/lib/db'
import type { Coupon } from '@/types'

export interface DailyFeaturedCoupon {
  date: string
  couponId: string
  code: string
  title: string
  discountValue: number
  discountType: 'fixed' | 'percent' | 'shipping' | 'cashback'
  platform: string
  expireAt: string | null
}

interface DailyFeaturedCouponRow {
  date: string
  coupons: Coupon | null
}

export async function getDailyFeaturedCoupon(): Promise<DailyFeaturedCoupon | null> {
  try {
    // Use en-CA locale to get YYYY-MM-DD in ICT timezone.
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })

    const [data] = await db<DailyFeaturedCouponRow[]>`
      SELECT
        daily_featured_coupons.date::text AS date,
        row_to_json(coupons.*) AS coupons
      FROM daily_featured_coupons
      JOIN coupons ON coupons.id = daily_featured_coupons.coupon_id
      WHERE daily_featured_coupons.date = ${today}::date
      LIMIT 1
    `

    const c = data?.coupons ?? null
    if (!data || !c || !c.is_active || !c.code) return null

    return {
      date: data.date,
      couponId: c.id,
      code: c.code,
      title: c.title,
      discountValue: c.discount_value,
      discountType: c.type as DailyFeaturedCoupon['discountType'],
      platform: c.platform,
      expireAt: c.expire_at,
    }
  } catch {
    return null
  }
}
