import { describe, expect, it } from 'vitest'
import { checkFacebookDealFreshness } from '@/lib/facebook-deal-freshness-guard'
import type { Coupon, Product } from '@/types'

const NOW = new Date('2026-04-23T12:00:00.000Z')

const PRODUCT: Product = {
  id: 'prod-001',
  platform: 'shopee',
  platform_id: 'SP001',
  name: 'Sony Headphones',
  url: 'https://shopee.co.th/product/prod-001',
  affiliate_url: null,
  category: 'audio',
  price_current: 7990,
  price_original: 9990,
  price_min: null,
  price_max: null,
  shop_id: null,
  shop_name: null,
  shop_type: null,
  rating: null,
  sold_count: 100,
  image_url: null,
  is_active: true,
  price_checked_at: NOW.toISOString(),
  created_at: NOW.toISOString(),
  updated_at: NOW.toISOString(),
}

function coupon(patch: Partial<Coupon> = {}): Coupon {
  return {
    id: 'coupon-001',
    code: 'SAVE500',
    title: 'Save 500',
    description: null,
    platform: 'shopee',
    tier: 1,
    type: 'fixed',
    discount_value: 500,
    max_discount: null,
    min_spend: 1000,
    applicable_categories: [],
    can_stack: true,
    user_segment: 'all',
    expire_at: '2026-05-01T00:00:00.000Z',
    is_active: true,
    source: 'test',
    source_checked_at: NOW.toISOString(),
    created_at: NOW.toISOString(),
    updated_at: NOW.toISOString(),
    ...patch,
  }
}

describe('facebook deal freshness guard', (): void => {
  it('passes when product, coupon, stock signal, and link health are fresh', (): void => {
    const result = checkFacebookDealFreshness(
      {
        product: PRODUCT,
        coupons: [coupon()],
        linkHealth: { ok: true, status: 200, checked_at: NOW.toISOString() },
        stockSignal: { badge: 'low_stock', last_calculated_at: NOW.toISOString() },
        caption: 'เหลือน้อย รีบก่อนหมด',
      },
      { now: NOW },
    )

    expect(result.passed).toBe(true)
  })

  it('blocks stale product price data', (): void => {
    const result = checkFacebookDealFreshness(
      {
        product: { ...PRODUCT, price_checked_at: '2026-04-21T11:59:00.000Z' },
        coupons: [],
        linkHealth: { ok: true, status: 200, checked_at: NOW.toISOString() },
      },
      { now: NOW },
    )

    expect(result.passed).toBe(false)
    expect(result.violations.map(v => v.code)).toContain('price_data_stale')
  })

  it('blocks stale coupon data used in the caption', (): void => {
    const result = checkFacebookDealFreshness(
      {
        product: PRODUCT,
        coupons: [coupon({ source_checked_at: '2026-04-21T11:59:00.000Z' })],
        linkHealth: { ok: true, status: 200, checked_at: NOW.toISOString() },
      },
      { now: NOW },
    )

    expect(result.violations.map(v => v.code)).toContain('coupon_data_stale')
  })

  it('blocks missing verified timestamps or failed link-health checks', (): void => {
    const missingVerifiedProduct = checkFacebookDealFreshness(
      {
        product: { ...PRODUCT, price_checked_at: null },
        coupons: [],
        linkHealth: { ok: true, status: 200, checked_at: NOW.toISOString() },
      },
      { now: NOW },
    )
    const missing = checkFacebookDealFreshness(
      { product: PRODUCT, coupons: [], linkHealth: null },
      { now: NOW },
    )
    const failed = checkFacebookDealFreshness(
      { product: PRODUCT, coupons: [], linkHealth: { ok: false, status: 404, checked_at: NOW.toISOString() } },
      { now: NOW },
    )

    expect(missingVerifiedProduct.violations.map(v => v.code)).toContain('price_data_unknown')
    expect(missing.violations.map(v => v.code)).toContain('link_health_unknown')
    expect(failed.violations.map(v => v.code)).toContain('link_health_failed')
  })

  it('requires fresh stock data when caption or score uses scarcity signals', (): void => {
    const result = checkFacebookDealFreshness(
      {
        product: PRODUCT,
        coupons: [],
        linkHealth: { ok: true, status: 200, checked_at: NOW.toISOString() },
        stockSignal: { badge: 'low_stock', last_calculated_at: '2026-04-21T11:59:00.000Z' },
        caption: 'เหลือน้อย รีบก่อนหมด',
      },
      { now: NOW },
    )

    expect(result.violations.map(v => v.code)).toContain('stock_data_stale')
  })
})
