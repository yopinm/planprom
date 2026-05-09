import { describe, it, expect } from 'vitest'
import {
  calculateAIDealScore,
  aiLabelFromScore,
  calculateReliabilityScore,
  passesMerchantTrustFilter,
} from '../deal-score'
import type { Product } from '@/types'

// ---------------------------------------------------------------------------
// Test fixture
// ---------------------------------------------------------------------------

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    platform: 'shopee',
    platform_id: '1.1',
    name: 'Test Product',
    url: 'https://shopee.co.th/test',
    affiliate_url: null,
    category: 'electronics',
    price_current: 1000,
    price_original: 1200,
    price_min: null,
    price_max: null,
    shop_id: null,
    shop_name: 'Test Shop',
    shop_type: 'normal',
    rating: 4.5,
    sold_count: 500,
    image_url: null,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// aiLabelFromScore
// ---------------------------------------------------------------------------

describe('aiLabelFromScore', () => {
  it('returns Best Value for score >= 75', () => {
    expect(aiLabelFromScore(75)).toBe('Best Value')
    expect(aiLabelFromScore(100)).toBe('Best Value')
  })
  it('returns Good Deal for 50 <= score < 75', () => {
    expect(aiLabelFromScore(50)).toBe('Good Deal')
    expect(aiLabelFromScore(74)).toBe('Good Deal')
  })
  it('returns Fair Deal for score < 50', () => {
    expect(aiLabelFromScore(49)).toBe('Fair Deal')
    expect(aiLabelFromScore(0)).toBe('Fair Deal')
  })
})

// ---------------------------------------------------------------------------
// calculateAIDealScore — no price history
// ---------------------------------------------------------------------------

describe('calculateAIDealScore — no price history', () => {
  it('hasHistory is false when no movingAvg30d', () => {
    const result = calculateAIDealScore(makeProduct())
    expect(result.hasHistory).toBe(false)
    expect(result.priceDrop).toBe(0)
  })

  it('score is 0–100', () => {
    const result = calculateAIDealScore(makeProduct())
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  })

  it('official store scores higher than normal store (same product)', () => {
    const normal   = calculateAIDealScore(makeProduct({ shop_type: 'normal' }))
    const official = calculateAIDealScore(makeProduct({ shop_type: 'official' }))
    expect(official.score).toBeGreaterThan(normal.score)
  })

  it('higher sold_count → higher score', () => {
    const low  = calculateAIDealScore(makeProduct({ sold_count: 10 }))
    const high = calculateAIDealScore(makeProduct({ sold_count: 100_000 }))
    expect(high.score).toBeGreaterThan(low.score)
  })

  it('bigger discount → higher score', () => {
    const small  = calculateAIDealScore(makeProduct({ price_current: 1100, price_original: 1200 }))
    const big    = calculateAIDealScore(makeProduct({ price_current: 600,  price_original: 1200 }))
    expect(big.score).toBeGreaterThan(small.score)
  })

  it('null rating uses default penalty (30)', () => {
    const noRating = calculateAIDealScore(makeProduct({ rating: null }))
    const rated    = calculateAIDealScore(makeProduct({ rating: 4.5 }))
    expect(rated.score).toBeGreaterThan(noRating.score)
  })

  it('no price_original → 0 discount score', () => {
    const p = makeProduct({ price_original: null })
    const result = calculateAIDealScore(p)
    expect(result.breakdown.discount).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// calculateAIDealScore — with price history (Moving Average 30d)
// ---------------------------------------------------------------------------

describe('calculateAIDealScore — with price history', () => {
  it('hasHistory is true when movingAvg30d provided', () => {
    const result = calculateAIDealScore(makeProduct({ price_current: 800 }), 1000)
    expect(result.hasHistory).toBe(true)
  })

  it('price 20% below avg → priceDrop ≈ 20', () => {
    const result = calculateAIDealScore(makeProduct({ price_current: 800 }), 1000)
    expect(result.priceDrop).toBeCloseTo(20, 0)
  })

  it('price 50% below avg → price score = 100 (max)', () => {
    const result = calculateAIDealScore(makeProduct({ price_current: 500 }), 1000)
    expect(result.breakdown.price).toBe(100)
  })

  it('price equals avg → price score = 50', () => {
    const result = calculateAIDealScore(makeProduct({ price_current: 1000 }), 1000)
    expect(result.breakdown.price).toBe(50)
  })

  it('price 50% above avg → price score = 0 (min)', () => {
    const result = calculateAIDealScore(makeProduct({ price_current: 1500 }), 1000)
    expect(result.breakdown.price).toBe(0)
  })

  it('negative priceDrop when current > avg', () => {
    const result = calculateAIDealScore(makeProduct({ price_current: 1100 }), 1000)
    expect(result.priceDrop).toBeLessThan(0)
  })

  it('product 30% below avg + official + high sold → Best Value', () => {
    const product = makeProduct({
      price_current: 700,
      shop_type: 'official',
      sold_count: 50_000,
      rating: 4.8,
    })
    const result = calculateAIDealScore(product, 1000)
    expect(result.label).toBe('Best Value')
    expect(result.score).toBeGreaterThanOrEqual(75)
  })

  it('price above avg + low rating → Fair Deal', () => {
    const product = makeProduct({
      price_current: 1300,
      rating: 2.0,
      sold_count: 5,
      shop_type: 'normal',
    })
    const result = calculateAIDealScore(product, 1000)
    expect(result.label).toBe('Fair Deal')
  })
})

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('edge cases', () => {
  it('score never exceeds 100', () => {
    const product = makeProduct({
      price_current: 1,
      price_original: 10000,
      shop_type: 'official',
      sold_count: 1_000_000,
      rating: 5,
    })
    const result = calculateAIDealScore(product, 10000)
    expect(result.score).toBeLessThanOrEqual(100)
  })

  it('score never below 0', () => {
    const product = makeProduct({
      price_current: 99999,
      price_original: null,
      shop_type: null,
      sold_count: 0,
      rating: null,
    })
    const result = calculateAIDealScore(product, 100)
    expect(result.score).toBeGreaterThanOrEqual(0)
  })

  it('zero movingAvg30d is treated as no history', () => {
    const result = calculateAIDealScore(makeProduct(), 0)
    expect(result.hasHistory).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// TASK 2.5 — Reliability Score
// ---------------------------------------------------------------------------

describe('calculateReliabilityScore — flags', () => {
  it('suspiciousDiscount: false when discount ≤ 80%', () => {
    const p = makeProduct({ price_current: 200, price_original: 1000 }) // 80% off = border
    const r = calculateReliabilityScore(p)
    expect(r.flags.suspiciousDiscount).toBe(false)
  })

  it('suspiciousDiscount: true when discount > 80%', () => {
    const p = makeProduct({ price_current: 100, price_original: 1000 }) // 90% off
    const r = calculateReliabilityScore(p)
    expect(r.flags.suspiciousDiscount).toBe(true)
  })

  it('suspiciousDiscount: false when price_original is null', () => {
    const p = makeProduct({ price_original: null })
    const r = calculateReliabilityScore(p)
    expect(r.flags.suspiciousDiscount).toBe(false)
  })

  it('lowRating: false when rating >= 4.0', () => {
    const r = calculateReliabilityScore(makeProduct({ rating: 4.0 }))
    expect(r.flags.lowRating).toBe(false)
  })

  it('lowRating: true when rating < 4.0', () => {
    const r = calculateReliabilityScore(makeProduct({ rating: 3.9 }))
    expect(r.flags.lowRating).toBe(true)
  })

  it('lowRating: true when rating is null', () => {
    const r = calculateReliabilityScore(makeProduct({ rating: null }))
    expect(r.flags.lowRating).toBe(true)
  })

  it('lowSoldCount: false when sold_count >= 10', () => {
    const r = calculateReliabilityScore(makeProduct({ sold_count: 10 }))
    expect(r.flags.lowSoldCount).toBe(false)
  })

  it('lowSoldCount: true when sold_count < 10', () => {
    const r = calculateReliabilityScore(makeProduct({ sold_count: 9 }))
    expect(r.flags.lowSoldCount).toBe(true)
  })
})

describe('calculateReliabilityScore — score', () => {
  it('official store scores higher than normal store', () => {
    const normal   = calculateReliabilityScore(makeProduct({ shop_type: 'normal' }))
    const official = calculateReliabilityScore(makeProduct({ shop_type: 'official' }))
    expect(official.score).toBeGreaterThan(normal.score)
  })

  it('mall store scores higher than normal but lower than official', () => {
    const normal   = calculateReliabilityScore(makeProduct({ shop_type: 'normal' }))
    const mall     = calculateReliabilityScore(makeProduct({ shop_type: 'mall' }))
    const official = calculateReliabilityScore(makeProduct({ shop_type: 'official' }))
    expect(mall.score).toBeGreaterThan(normal.score)
    expect(official.score).toBeGreaterThan(mall.score)
  })

  it('score is clamped between 0 and 100', () => {
    // worst case: all penalties
    const p = makeProduct({
      price_current: 10,
      price_original: 1000,
      rating: 1.0,
      sold_count: 1,
      shop_type: 'normal',
    })
    const r = calculateReliabilityScore(p)
    expect(r.score).toBeGreaterThanOrEqual(0)
    expect(r.score).toBeLessThanOrEqual(100)
  })

  it('score never exceeds 100 for an ideal product', () => {
    const p = makeProduct({ shop_type: 'official', rating: 5, sold_count: 1_000_000 })
    const r = calculateReliabilityScore(p)
    expect(r.score).toBeLessThanOrEqual(100)
  })
})

describe('calculateReliabilityScore — warnings', () => {
  it('no warnings for a clean product', () => {
    const p = makeProduct({ rating: 4.5, sold_count: 100 })
    const r = calculateReliabilityScore(p)
    expect(r.warnings).toHaveLength(0)
  })

  it('warning added for suspicious discount', () => {
    const p = makeProduct({ price_current: 50, price_original: 1000 }) // 95% off
    const r = calculateReliabilityScore(p)
    expect(r.warnings.some(w => w.includes('สูงผิดปกติ'))).toBe(true)
  })

  it('warning added for low rating', () => {
    const p = makeProduct({ rating: 3.5 })
    const r = calculateReliabilityScore(p)
    expect(r.warnings.some(w => w.includes('คะแนนรีวิวต่ำ'))).toBe(true)
  })

  it('null rating produces "ยังไม่มีคะแนนรีวิว" warning', () => {
    const p = makeProduct({ rating: null })
    const r = calculateReliabilityScore(p)
    expect(r.warnings.some(w => w.includes('ยังไม่มีคะแนนรีวิว'))).toBe(true)
  })

  it('warning added for low sold_count', () => {
    const p = makeProduct({ sold_count: 3 })
    const r = calculateReliabilityScore(p)
    expect(r.warnings.some(w => w.includes('ยอดขายน้อย'))).toBe(true)
  })

  it('multiple warnings can coexist', () => {
    const p = makeProduct({ rating: 3.0, sold_count: 2 })
    const r = calculateReliabilityScore(p)
    expect(r.warnings.length).toBeGreaterThanOrEqual(2)
  })
})

describe('passesMerchantTrustFilter (TASK 2.5)', () => {
  it('passes when rating >= 4.5, sold >= 10, no suspicious discount', () => {
    const p = makeProduct({ rating: 4.5, sold_count: 10 })
    expect(passesMerchantTrustFilter(p)).toBe(true)
  })

  it('fails when rating < 4.5', () => {
    const p = makeProduct({ rating: 4.4, sold_count: 100 })
    expect(passesMerchantTrustFilter(p)).toBe(false)
  })

  it('passes when rating is null but sold_count >= 50 (feed-sourced fallback)', () => {
    const p = makeProduct({ rating: null, sold_count: 50 })
    expect(passesMerchantTrustFilter(p)).toBe(true)
  })

  it('fails when rating is null and sold_count < 50', () => {
    const p = makeProduct({ rating: null, sold_count: 49 })
    expect(passesMerchantTrustFilter(p)).toBe(false)
  })

  it('fails when sold_count < 10', () => {
    const p = makeProduct({ rating: 4.8, sold_count: 9 })
    expect(passesMerchantTrustFilter(p)).toBe(false)
  })

  it('fails when discount > 80%', () => {
    const p = makeProduct({ rating: 4.8, sold_count: 500, price_current: 90, price_original: 1000 })
    expect(passesMerchantTrustFilter(p)).toBe(false)
  })

  it('official store alone does not bypass trust filter if rating is low', () => {
    const p = makeProduct({ shop_type: 'official', rating: 3.0, sold_count: 1000 })
    expect(passesMerchantTrustFilter(p)).toBe(false)
  })
})
