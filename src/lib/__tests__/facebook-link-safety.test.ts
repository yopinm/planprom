// TASK 3.22 — 3-Point Matching & Link Safety

import { describe, expect, it } from 'vitest'
import {
  extractBahtAmounts,
  extractCaptionUrls,
  extractCouponCodes,
  runLinkSafetyCheck,
} from '@/lib/facebook-link-safety'
import type { Coupon, Product } from '@/types'

const NOW = new Date('2026-04-20T00:00:00.000Z')

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
  sold_count: 0,
  image_url: null,
  is_active: true,
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
    created_at: NOW.toISOString(),
    updated_at: NOW.toISOString(),
    ...patch,
  }
}

function caption(body: string): string {
  return `${body}\n# โฆษณา`
}

describe('caption extractors', () => {
  it('extracts product URLs and strips trailing punctuation', () => {
    const urls = extractCaptionUrls('ดู https://couponkum.com/product/prod-001.')
    expect(urls).toEqual(['https://couponkum.com/product/prod-001'])
  })

  it('extracts coupon codes from Thai and English labels', () => {
    expect(extractCouponCodes('โค้ด: save500\nCode: DEAL_10')).toEqual(['SAVE500', 'DEAL_10'])
  })

  it('extracts baht amounts with commas', () => {
    expect(extractBahtAmounts('ปกติ 9,990 บาท เหลือ 7,990 บาท')).toEqual([9990, 7990])
  })
})

describe('runLinkSafetyCheck', () => {
  it('passes when URL, coupon, and price match current data', () => {
    const result = runLinkSafetyCheck(
      caption('Sony Headphones เหลือ 7,990 บาท\nโค้ด: SAVE500\nhttps://couponkum.com/product/prod-001'),
      PRODUCT,
      [coupon()],
      { now: NOW },
    )
    expect(result.passed).toBe(true)
    expect(result.violations).toHaveLength(0)
  })

  it('blocks when product URL is missing', () => {
    const result = runLinkSafetyCheck(caption('Sony Headphones เหลือ 7,990 บาท'), PRODUCT, [], { now: NOW })
    expect(result.passed).toBe(false)
    expect(result.violations.some(v => v.code === 'product_url_missing')).toBe(true)
  })

  it('blocks when product URL points to a different product', () => {
    const result = runLinkSafetyCheck(
      caption('Sony Headphones เหลือ 7,990 บาท\nhttps://couponkum.com/product/prod-999'),
      PRODUCT,
      [],
      { now: NOW },
    )
    expect(result.violations.some(v => v.code === 'product_url_mismatch')).toBe(true)
  })

  it('blocks external product-looking URLs', () => {
    const result = runLinkSafetyCheck(
      caption('Sony Headphones เหลือ 7,990 บาท\nhttps://evil.example/product/prod-001'),
      PRODUCT,
      [],
      { now: NOW },
    )
    expect(result.violations.some(v => v.code === 'product_url_invalid')).toBe(true)
  })

  it('blocks invalid coupon codes in the caption', () => {
    const result = runLinkSafetyCheck(
      caption('Sony Headphones เหลือ 7,990 บาท\nโค้ด: EXPIRED\nhttps://couponkum.com/product/prod-001'),
      PRODUCT,
      [coupon({ code: 'SAVE500' })],
      { now: NOW },
    )
    expect(result.violations.some(v => v.code === 'coupon_invalid')).toBe(true)
  })

  it('blocks expired coupon codes', () => {
    const result = runLinkSafetyCheck(
      caption('Sony Headphones เหลือ 7,990 บาท\nโค้ด: SAVE500\nhttps://couponkum.com/product/prod-001'),
      PRODUCT,
      [coupon({ expire_at: '2026-04-01T00:00:00.000Z' })],
      { now: NOW },
    )
    expect(result.violations.some(v => v.code === 'coupon_invalid')).toBe(true)
  })

  it('allows captions without coupon codes', () => {
    const result = runLinkSafetyCheck(
      caption('Sony Headphones เหลือ 7,990 บาท\nhttps://couponkum.com/product/prod-001'),
      PRODUCT,
      [],
      { now: NOW },
    )
    expect(result.violations.some(v => v.code === 'coupon_invalid')).toBe(false)
  })

  it('blocks when no baht price is present', () => {
    const result = runLinkSafetyCheck(
      caption('Sony Headphones ดีลดี\nhttps://couponkum.com/product/prod-001'),
      PRODUCT,
      [],
      { now: NOW },
    )
    expect(result.violations.some(v => v.code === 'price_missing')).toBe(true)
  })

  it('blocks when all caption prices are outside the 5 percent tolerance', () => {
    const result = runLinkSafetyCheck(
      caption('Sony Headphones เหลือ 6,500 บาท\nhttps://couponkum.com/product/prod-001'),
      PRODUCT,
      [],
      { now: NOW },
    )
    expect(result.violations.some(v => v.code === 'price_mismatch')).toBe(true)
  })

  it('passes when one of multiple prices is within the 5 percent tolerance', () => {
    const result = runLinkSafetyCheck(
      caption('ปกติ 9,990 บาท เหลือ 7,700 บาท\nhttps://couponkum.com/product/prod-001'),
      PRODUCT,
      [],
      { now: NOW },
    )
    expect(result.violations.some(v => v.code === 'price_mismatch')).toBe(false)
  })
})
