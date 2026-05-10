// WALLET-CLEAN: ลบออกถาวร 2026-05-17
// WALLET-SWEEP-1: fetch coupons by tier (1=Platform, 2=Shop, 3=Bank, 4=Shipping)
import { db } from '@/lib/db'
import type { PublicCoupon } from '@/lib/public-wallet'

interface RawTierRow {
  id:            string
  code:          string
  title:         string
  platform:      string
  discount_value: number
  type:          string
  min_spend:     number
  expire_at:     string | null
  verified_at:   string | null
  success_rate:  number | null
  last_used_at:  string | null
}

export async function getCouponsByTier(tier: 1 | 2 | 3 | 4, limit = 30): Promise<PublicCoupon[]> {
  try {
    const rows = await db<RawTierRow[]>`
      SELECT id, code, title, platform, discount_value, type, min_spend,
             expire_at, verified_at, success_rate,
             (SELECT MAX(cv.created_at) FROM coupon_votes cv
              WHERE cv.coupon_code = coupons.code AND cv.vote = 'up') AS last_used_at
      FROM coupons
      WHERE tier = ${tier}
        AND is_active = true
        AND code IS NOT NULL
        AND (expire_at IS NULL OR expire_at > NOW())
      ORDER BY
        CASE WHEN verified_at > NOW() - INTERVAL '2 hours' THEN 0 ELSE 1 END,
        success_rate DESC NULLS LAST,
        expire_at ASC NULLS LAST
      LIMIT ${limit}
    `
    return rows.map(r => ({
      id:            r.id,
      code:          r.code,
      title:         r.title,
      platform:      r.platform,
      discountValue: Number(r.discount_value),
      discountType:  r.type as PublicCoupon['discountType'],
      minSpend:      Number(r.min_spend),
      expireAt:      r.expire_at,
      isFeatured:    false,
      verifiedAt:    r.verified_at,
      successRate:   r.success_rate !== null ? Number(r.success_rate) : null,
      lastUsedAt:    r.last_used_at,
    }))
  } catch {
    return []
  }
}

export interface WalletSweepData {
  platform: PublicCoupon[]
  shop:     PublicCoupon[]
  bank:     PublicCoupon[]
  shipping: PublicCoupon[]
}

export async function getWalletSweepData(): Promise<WalletSweepData> {
  const [platform, shop, bank, shipping] = await Promise.all([
    getCouponsByTier(1, 30),
    getCouponsByTier(2, 30),
    getCouponsByTier(3, 30),
    getCouponsByTier(4, 30),
  ])
  return { platform, shop, bank, shipping }
}

export function sweepTotalCount(data: WalletSweepData): number {
  return data.platform.length + data.shop.length + data.bank.length + data.shipping.length
}

export function sweepLastVerified(data: WalletSweepData): string | null {
  const all = [...data.platform, ...data.shop, ...data.bank, ...data.shipping]
  const dates = all.map(c => c.verifiedAt).filter(Boolean) as string[]
  if (dates.length === 0) return null
  return dates.reduce((a, b) => (a > b ? a : b))
}
