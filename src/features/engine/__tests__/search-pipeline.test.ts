import { describe, expect, it } from 'vitest'
import { runSearchPipeline, shapeResult } from '../search-pipeline'
import type { Coupon, CouponStackRule, Product } from '@/types'

const NOW = new Date('2026-04-13T12:00:00Z')
const FUTURE = new Date(NOW.getTime() + 30 * 24 * 3600 * 1000).toISOString()

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    platform: 'shopee',
    platform_id: '1.1',
    name: 'Samsung Galaxy A55 มือถือ',
    url: 'https://shopee.co.th/test',
    affiliate_url: null,
    category: 'มือถือ',
    price_current: 10000,
    price_original: 12000,
    price_min: null,
    price_max: null,
    shop_id: 'shop1',
    shop_name: 'Samsung Official',
    shop_type: 'official',
    rating: 4.8,
    sold_count: 5000,
    image_url: null,
    is_active: true,
    price_checked_at: NOW.toISOString(),
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeCoupon(overrides: Partial<Coupon>): Coupon {
  return {
    id: 'c1',
    code: 'TEST',
    title: 'Test Coupon',
    description: null,
    platform: 'shopee',
    tier: 1,
    type: 'fixed',
    discount_value: 100,
    max_discount: null,
    min_spend: 0,
    applicable_categories: [],
    can_stack: true,
    user_segment: 'all',
    expire_at: FUTURE,
    is_active: true,
    source: null,
    source_checked_at: NOW.toISOString(),
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeRule(overrides: Partial<CouponStackRule> = {}): CouponStackRule {
  return {
    id: 'r1',
    name: 'Default',
    description: null,
    platform: 'all',
    tier_order: [1, 2, 3, 4],
    allowed_tiers: [1, 2, 3, 4],
    max_stack: 4,
    conditions: {},
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

const BASE_INTENT = { query_type: 'product_name' as const, query: 'samsung' }
const NO_RULES: CouponStackRule[] = []

describe('runSearchPipeline - baseline', () => {
  it('returns empty results when no products', () => {
    const { results, totalBeforeLimit } = runSearchPipeline({
      intent: BASE_INTENT,
      products: [],
      coupons: [],
      stackRules: [],
      now: NOW,
    })
    expect(results).toHaveLength(0)
    expect(totalBeforeLimit).toBe(0)
  })

  it('returns product with no discount when no eligible coupons', () => {
    const product = makeProduct()
    const { results } = runSearchPipeline({
      intent: BASE_INTENT,
      products: [product],
      coupons: [],
      stackRules: [],
      now: NOW,
    })
    expect(results).toHaveLength(1)
    expect(results[0].priceResult.usedCombination).toHaveLength(0)
    expect(results[0].priceResult.payNow).toBe(product.price_current + 40)
    expect(results[0].priceResult.shippingFee).toBe(40)
    expect(results[0].priceResult.shippingFinal).toBe(40)
  })

  it('skips inactive products', () => {
    const inactive = makeProduct({ is_active: false })
    const { results } = runSearchPipeline({
      intent: BASE_INTENT,
      products: [inactive],
      coupons: [],
      stackRules: [],
      now: NOW,
    })
    expect(results).toHaveLength(0)
  })
})

describe('runSearchPipeline - intent filtering', () => {
  it('filters by query text (name match)', () => {
    const match = makeProduct({ id: 'match', name: 'Samsung Galaxy A55 มือถือ', shop_name: 'Samsung Official' })
    const noMatch = makeProduct({ id: 'nomatch', name: 'Nike Air Max รองเท้า', shop_name: 'Nike Store' })
    const intent = { query_type: 'product_name' as const, query: 'samsung' }

    const { results } = runSearchPipeline({
      intent, products: [match, noMatch], coupons: [], stackRules: [], now: NOW,
    })
    expect(results).toHaveLength(1)
    expect(results[0].product.id).toBe('match')
  })

  it('filters by query text (shop_name match)', () => {
    const shopMatch = makeProduct({
      id: 'shop-match',
      name: 'ผลิตภัณฑ์ซักผ้า Attack เข้มข้น',
      shop_name: 'Kao Home & Fabric Care',
    })
    const noMatch = makeProduct({ id: 'nomatch', name: 'Nike Air Max', shop_name: 'Nike Official' })
    const intent = { query_type: 'product_name' as const, query: 'Kao Home & Fabric Care' }

    const { results } = runSearchPipeline({
      intent, products: [shopMatch, noMatch], coupons: [], stackRules: [], now: NOW,
    })
    expect(results).toHaveLength(1)
    expect(results[0].product.id).toBe('shop-match')
  })

  it('filters by category from intent', () => {
    const phone = makeProduct({ id: 'phone', category: 'มือถือ' })
    const sports = makeProduct({ id: 'sports', category: 'กีฬา' })
    const intent = { query_type: 'product_name' as const, query: '', category: 'มือถือ' }

    const { results } = runSearchPipeline({
      intent, products: [phone, sports], coupons: [], stackRules: [], now: NOW,
    })
    expect(results.every(r => r.product.id === 'phone')).toBe(true)
  })

  it('filters by platform from intent', () => {
    const shopee = makeProduct({ id: 'shp', platform: 'shopee' })
    const lazada = makeProduct({ id: 'lzd', platform: 'lazada' })
    const intent = { query_type: 'product_name' as const, query: '', platform: 'shopee' as const }

    const { results } = runSearchPipeline({
      intent, products: [shopee, lazada], coupons: [], stackRules: [], now: NOW,
    })
    expect(results).toHaveLength(1)
    expect(results[0].product.id).toBe('shp')
  })

  it('filters by budget from intent', () => {
    const cheap = makeProduct({ id: 'cheap', price_current: 500 })
    const expensive = makeProduct({ id: 'exp', price_current: 2000 })
    const intent = { query_type: 'budget' as const, budget: 1000, query: '' }

    const { results } = runSearchPipeline({
      intent, products: [cheap, expensive], coupons: [], stackRules: [], now: NOW,
    })
    expect(results).toHaveLength(1)
    expect(results[0].product.id).toBe('cheap')
  })
})

describe('runSearchPipeline - coupon application', () => {
  it('applies eligible coupon and reduces effectiveNet', () => {
    const product = makeProduct({ price_current: 1000 })
    const coupon = makeCoupon({ type: 'fixed', discount_value: 100 })
    const rule = makeRule()

    const { results } = runSearchPipeline({
      intent: BASE_INTENT,
      products: [product],
      coupons: [coupon],
      stackRules: [rule],
      shippingFee: 0,
      now: NOW,
    })

    expect(results[0].priceResult.effectiveNet).toBe(900)
    expect(results[0].priceResult.usedCombination).toHaveLength(1)
  })

  it('skips coupon when min_spend not met', () => {
    const product = makeProduct({ price_current: 100 })
    const coupon = makeCoupon({ min_spend: 500, discount_value: 50 })

    const { results } = runSearchPipeline({
      intent: BASE_INTENT,
      products: [product],
      coupons: [coupon],
      stackRules: [makeRule()],
      shippingFee: 0,
      now: NOW,
    })

    expect(results[0].priceResult.usedCombination).toHaveLength(0)
    expect(results[0].priceResult.effectiveNet).toBe(100)
  })

  it('skips expired coupon', () => {
    const product = makeProduct({ price_current: 1000 })
    const coupon = makeCoupon({ expire_at: '2026-01-01T00:00:00Z', discount_value: 200 })

    const { results } = runSearchPipeline({
      intent: BASE_INTENT,
      products: [product],
      coupons: [coupon],
      stackRules: [makeRule()],
      shippingFee: 0,
      now: NOW,
    })

    expect(results[0].priceResult.usedCombination).toHaveLength(0)
  })
})

describe('runSearchPipeline - sorting', () => {
  const p1 = makeProduct({ id: 'p1', price_current: 500, rating: 3.0, sold_count: 100 })
  const p2 = makeProduct({ id: 'p2', price_current: 1000, rating: 5.0, sold_count: 9999 })
  const baseInput = {
    intent: { query_type: 'product_name' as const, query: '' },
    products: [p1, p2],
    coupons: [] as Coupon[],
    stackRules: NO_RULES,
    shippingFee: 0,
    now: NOW,
  }

  it('sort=price -> cheapest effectiveNet first', () => {
    const { results } = runSearchPipeline({ ...baseInput, sort: 'price' })
    expect(results[0].product.id).toBe('p1')
  })

  it('sort=rating -> highest rating first', () => {
    const { results } = runSearchPipeline({ ...baseInput, sort: 'rating' })
    expect(results[0].product.id).toBe('p2')
  })

  it('sort=sold -> highest sold_count first', () => {
    const { results } = runSearchPipeline({ ...baseInput, sort: 'sold' })
    expect(results[0].product.id).toBe('p2')
  })
})

describe('runSearchPipeline - limit', () => {
  it('returns at most `limit` results', () => {
    const products = Array.from({ length: 10 }, (_, i) =>
      makeProduct({ id: `p${i}`, name: `Product ${i} samsung` }),
    )
    const { results, totalBeforeLimit } = runSearchPipeline({
      intent: BASE_INTENT,
      products,
      coupons: [],
      stackRules: [],
      limit: 3,
      now: NOW,
    })
    expect(results).toHaveLength(3)
    expect(totalBeforeLimit).toBe(10)
  })
})

describe('shapeResult', () => {
  it('maps RankedResult to flat SearchResultItem', () => {
    const product = makeProduct({ price_checked_at: NOW.toISOString() })
    const [ranked] = runSearchPipeline({
      intent: BASE_INTENT,
      products: [product],
      coupons: [],
      stackRules: [],
      now: NOW,
    }).results

    const shaped = shapeResult(ranked, NOW)
    expect(shaped.id).toBe(product.id)
    expect(shaped.platform).toBe(product.platform)
    expect(shaped.name).toBe(product.name)
    expect(shaped.dealScore).toBeDefined()
    expect(shaped.explanation).toBeDefined()
    expect(typeof shaped.effectiveNet).toBe('number')
    expect(shaped.shippingFee).toBe(40)
    expect(shaped.shippingFinal).toBe(40)
    expect(shaped.itemDiscount).toBe(0)
    expect(shaped.shippingDiscount).toBe(0)
    expect(shaped.priceFreshness.status).toBe('fresh')
    expect(shaped.savingsReliable).toBe(true)
  })

  it('marks savings as unreliable when verified freshness timestamps are missing', () => {
    const product = makeProduct({ price_checked_at: null, updated_at: NOW.toISOString() })
    const coupon = makeCoupon({ source_checked_at: null, updated_at: NOW.toISOString() })
    const [ranked] = runSearchPipeline({
      intent: BASE_INTENT,
      products: [product],
      coupons: [coupon],
      stackRules: [makeRule()],
      shippingFee: 0,
      now: NOW,
    }).results

    const shaped = shapeResult(ranked, NOW)
    expect(shaped.priceFreshness.status).toBe('unknown')
    expect(shaped.savingsReliable).toBe(false)
  })
})
