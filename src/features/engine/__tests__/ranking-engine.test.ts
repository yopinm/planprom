import { describe, it, expect } from 'vitest'
import {
  scoreRating,
  scoreSold,
  scoreDiscount,
  scoreStore,
  scoreCoupon,
  computePriceScores,
  labelFromScore,
  confidenceFromScore,
  buildHowToUse,
  buildSummary,
  buildAlternative,
  rankResults,
} from '../ranking-engine'
import type { Coupon, Product, PriceResult } from '@/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const NOW = new Date('2026-04-13T12:00:00Z')

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    platform: 'shopee',
    platform_id: '1.1',
    name: 'Test Product',
    url: 'https://shopee.co.th/test',
    affiliate_url: null,
    category: 'มือถือ',
    price_current: 1000,
    price_original: 1200,
    price_min: null,
    price_max: null,
    shop_id: 'shop1',
    shop_name: 'Test Shop',
    shop_type: 'normal',
    rating: 4.5,
    sold_count: 1000,
    image_url: null,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function makePriceResult(overrides: Partial<PriceResult> = {}): PriceResult {
  return {
    originalPrice: 1000,
    payNow: 900,
    effectiveNet: 850,
    usedCombination: [],
    ...overrides,
  }
}

function makeCoupon(overrides: Partial<Coupon>): Coupon {
  return {
    id: 'c1',
    code: null,
    title: 'Coupon',
    description: null,
    platform: 'shopee',
    tier: 1,
    type: 'fixed',
    discount_value: 50,
    max_discount: null,
    min_spend: 0,
    applicable_categories: [],
    can_stack: true,
    user_segment: 'all',
    expire_at: null,
    is_active: true,
    source: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

// =============================================================
// 1. scoreRating
// =============================================================
describe('scoreRating', () => {
  it('null rating → 30 (no data penalty)', () => {
    expect(scoreRating(null)).toBe(30)
  })

  it('rating 0 → 0', () => {
    expect(scoreRating(0)).toBe(0)
  })

  it('rating 5 → 100', () => {
    expect(scoreRating(5)).toBe(100)
  })

  it('rating 2.5 → 50', () => {
    expect(scoreRating(2.5)).toBe(50)
  })

  it('rating 4.5 → 90', () => {
    expect(scoreRating(4.5)).toBe(90)
  })
})

// =============================================================
// 2. scoreSold
// =============================================================
describe('scoreSold', () => {
  it('0 sold → 0', () => {
    expect(scoreSold(0)).toBe(0)
  })

  it('negative → 0', () => {
    expect(scoreSold(-1)).toBe(0)
  })

  it('100 sold → between 30 and 50', () => {
    const s = scoreSold(100)
    expect(s).toBeGreaterThan(30)
    expect(s).toBeLessThan(55)
  })

  it('1 000 000 sold → 100 (cap)', () => {
    expect(scoreSold(1_000_000)).toBe(100)
  })

  it('higher sold count → higher score (monotonic)', () => {
    expect(scoreSold(10_000)).toBeGreaterThan(scoreSold(1_000))
    expect(scoreSold(1_000)).toBeGreaterThan(scoreSold(100))
  })
})

// =============================================================
// 3. scoreDiscount
// =============================================================
describe('scoreDiscount', () => {
  it('no discount (effectiveNet = originalPrice) → 0', () => {
    expect(scoreDiscount(1000, 1000)).toBe(0)
  })

  it('25% discount → 50', () => {
    expect(scoreDiscount(1000, 750)).toBe(50)
  })

  it('50% discount → 100 (cap)', () => {
    expect(scoreDiscount(1000, 500)).toBe(100)
  })

  it('discount > 50% still → 100 (cap)', () => {
    expect(scoreDiscount(1000, 100)).toBe(100)
  })

  it('originalPrice 0 → 0 (avoid division by zero)', () => {
    expect(scoreDiscount(0, 0)).toBe(0)
  })

  it('effectiveNet > originalPrice (edge) → 0, not negative', () => {
    expect(scoreDiscount(1000, 1200)).toBe(0)
  })
})

// =============================================================
// 4. scoreStore
// =============================================================
describe('scoreStore', () => {
  it('official → 100', () => {
    expect(scoreStore('official')).toBe(100)
  })

  it('mall → 70', () => {
    expect(scoreStore('mall')).toBe(70)
  })

  it('normal → 40', () => {
    expect(scoreStore('normal')).toBe(40)
  })

  it('null → 30', () => {
    expect(scoreStore(null)).toBe(30)
  })
})

// =============================================================
// 5. scoreCoupon
// =============================================================
describe('scoreCoupon', () => {
  it('empty combination → 0', () => {
    expect(scoreCoupon([])).toBe(0)
  })

  it('coupon with no code → 50 (deal but no code to copy)', () => {
    const c = makeCoupon({ code: null })
    expect(scoreCoupon([c])).toBe(50)
  })

  it('coupon with code → 100', () => {
    const c = makeCoupon({ code: 'SAVE50' })
    expect(scoreCoupon([c])).toBe(100)
  })

  it('mix: any code present → 100', () => {
    const noCode = makeCoupon({ code: null })
    const withCode = makeCoupon({ id: 'c2', code: 'SAVE50' })
    expect(scoreCoupon([noCode, withCode])).toBe(100)
  })
})

// =============================================================
// 6. computePriceScores
// =============================================================
describe('computePriceScores', () => {
  it('single candidate → 50 (no relative comparison)', () => {
    const candidates = [{ product: makeProduct(), priceResult: makePriceResult({ effectiveNet: 500 }) }]
    expect(computePriceScores(candidates)).toEqual([50])
  })

  it('all same effectiveNet → all 50', () => {
    const candidates = [
      { product: makeProduct(), priceResult: makePriceResult({ effectiveNet: 800 }) },
      { product: makeProduct(), priceResult: makePriceResult({ effectiveNet: 800 }) },
    ]
    expect(computePriceScores(candidates)).toEqual([50, 50])
  })

  it('cheapest gets 100, most expensive gets 0', () => {
    const candidates = [
      { product: makeProduct(), priceResult: makePriceResult({ effectiveNet: 1000 }) }, // most expensive
      { product: makeProduct(), priceResult: makePriceResult({ effectiveNet: 500 }) },  // cheapest
    ]
    const scores = computePriceScores(candidates)
    expect(scores[0]).toBe(0)
    expect(scores[1]).toBe(100)
  })

  it('middle price gets ~50 with 3 candidates', () => {
    const candidates = [
      { product: makeProduct(), priceResult: makePriceResult({ effectiveNet: 1000 }) },
      { product: makeProduct(), priceResult: makePriceResult({ effectiveNet: 750 }) },
      { product: makeProduct(), priceResult: makePriceResult({ effectiveNet: 500 }) },
    ]
    const scores = computePriceScores(candidates)
    expect(scores[0]).toBe(0)
    expect(scores[1]).toBe(50)
    expect(scores[2]).toBe(100)
  })
})

// =============================================================
// 6. labelFromScore / confidenceFromScore
// =============================================================
describe('labelFromScore', () => {
  it('≥70 → Best Value', () => {
    expect(labelFromScore(70)).toBe('Best Value')
    expect(labelFromScore(100)).toBe('Best Value')
  })

  it('50–69 → Good Deal', () => {
    expect(labelFromScore(50)).toBe('Good Deal')
    expect(labelFromScore(69)).toBe('Good Deal')
  })

  it('<50 → Fair Deal', () => {
    expect(labelFromScore(49)).toBe('Fair Deal')
    expect(labelFromScore(0)).toBe('Fair Deal')
  })
})

describe('confidenceFromScore', () => {
  it('≥70 → สูง', () => {
    expect(confidenceFromScore(70)).toBe('สูง')
  })

  it('50–69 → กลาง', () => {
    expect(confidenceFromScore(55)).toBe('กลาง')
  })

  it('<50 → ต่ำ', () => {
    expect(confidenceFromScore(30)).toBe('ต่ำ')
  })
})

// =============================================================
// 7. buildHowToUse
// =============================================================
describe('buildHowToUse', () => {
  it('no coupons → "ไม่มีโค้ดเพิ่มเติม"', () => {
    expect(buildHowToUse([])).toBe('ไม่มีโค้ดเพิ่มเติม')
  })

  it('fixed coupon → "วิธีใช้: ส่วนลด 50 บาท"', () => {
    const c = makeCoupon({ type: 'fixed', discount_value: 50 })
    expect(buildHowToUse([c])).toBe('วิธีใช้: ส่วนลด 50 บาท')
  })

  it('percent coupon → "วิธีใช้: ลด 10%"', () => {
    const c = makeCoupon({ type: 'percent', discount_value: 10 })
    expect(buildHowToUse([c])).toBe('วิธีใช้: ลด 10%')
  })

  it('shipping coupon → "วิธีใช้: ส่งฟรี"', () => {
    const c = makeCoupon({ type: 'shipping', discount_value: 50 })
    expect(buildHowToUse([c])).toBe('วิธีใช้: ส่งฟรี')
  })

  it('cashback coupon → "วิธีใช้: แคชแบ็ก 80 บาท"', () => {
    const c = makeCoupon({ type: 'cashback', discount_value: 80 })
    expect(buildHowToUse([c])).toBe('วิธีใช้: แคชแบ็ก 80 บาท')
  })

  it('multiple coupons joined with " + " in tier order', () => {
    const t2 = makeCoupon({ tier: 2, type: 'fixed', discount_value: 50 })
    const t3 = makeCoupon({ tier: 3, type: 'shipping', discount_value: 30 })
    const t1 = makeCoupon({ tier: 1, type: 'percent', discount_value: 10 })
    // Pass in reverse order — should be sorted by tier
    expect(buildHowToUse([t3, t2, t1])).toBe('วิธีใช้: ลด 10% + ส่วนลด 50 บาท + ส่งฟรี')
  })
})

// =============================================================
// 8. buildSummary
// =============================================================
describe('buildSummary', () => {
  it('Best Value → "ดีลที่คุ้มสุด: X บาท"', () => {
    expect(buildSummary('Best Value', 425)).toBe('ดีลที่คุ้มสุด: 425 บาท')
  })

  it('Good Deal → "ดีลดี: X บาท"', () => {
    expect(buildSummary('Good Deal', 800)).toBe('ดีลดี: 800 บาท')
  })

  it('Fair Deal → "ราคาปกติ: X บาท"', () => {
    expect(buildSummary('Fair Deal', 1200)).toBe('ราคาปกติ: 1,200 บาท')
  })
})

// =============================================================
// 9. buildAlternative
// =============================================================
describe('buildAlternative', () => {
  it('no coupons → null', () => {
    expect(buildAlternative([], NOW)).toBeNull()
  })

  it('coupon expiring in 12 hours → warning string', () => {
    const soon = new Date(NOW.getTime() + 12 * 3600 * 1000).toISOString()
    const c = makeCoupon({ expire_at: soon })
    const result = buildAlternative([c], NOW)
    expect(result).toContain('24 ชั่วโมง')
  })

  it('coupon expiring in 25 hours → null (not urgent)', () => {
    const later = new Date(NOW.getTime() + 25 * 3600 * 1000).toISOString()
    const c = makeCoupon({ expire_at: later })
    expect(buildAlternative([c], NOW)).toBeNull()
  })

  it('already-expired coupon → null (not urgent, already filtered by Layer 3)', () => {
    const past = new Date(NOW.getTime() - 3600 * 1000).toISOString()
    const c = makeCoupon({ expire_at: past })
    expect(buildAlternative([c], NOW)).toBeNull()
  })

  it('coupon with no expire_at → null', () => {
    const c = makeCoupon({ expire_at: null })
    expect(buildAlternative([c], NOW)).toBeNull()
  })
})

// =============================================================
// 10. rankResults — integration
// =============================================================
describe('rankResults', () => {
  it('empty input → empty output', () => {
    expect(rankResults([])).toEqual([])
  })

  it('single candidate returns with dealScore + explanation', () => {
    const candidate = {
      product: makeProduct({ rating: 4.5, sold_count: 1000, shop_type: 'official' as const }),
      priceResult: makePriceResult({ originalPrice: 1000, effectiveNet: 800 }),
    }
    const result = rankResults([candidate], NOW)
    expect(result).toHaveLength(1)
    expect(result[0].dealScore.total).toBeGreaterThan(0)
    expect(result[0].dealScore.label).toBeDefined()
    expect(result[0].explanation.summary).toContain('800')
    expect(result[0].explanation.confidence).toBeDefined()
  })

  it('higher Deal Score ranked first', () => {
    const good = {
      product: makeProduct({ id: 'good', rating: 5, sold_count: 100_000, shop_type: 'official' as const }),
      priceResult: makePriceResult({ originalPrice: 1000, effectiveNet: 400 }), // big discount
    }
    const poor = {
      product: makeProduct({ id: 'poor', rating: 1, sold_count: 0, shop_type: null }),
      priceResult: makePriceResult({ originalPrice: 1000, effectiveNet: 950 }), // tiny discount
    }
    const result = rankResults([poor, good], NOW) // input reversed
    expect(result[0].product.id).toBe('good')
    expect(result[1].product.id).toBe('poor')
  })

  it('tie-break: same score → lower effectiveNet wins', () => {
    // Two identical products, same score, different price
    const cheaper = {
      product: makeProduct({ id: 'cheaper', rating: 4, sold_count: 500, shop_type: 'normal' as const }),
      priceResult: makePriceResult({ originalPrice: 1000, effectiveNet: 700 }),
    }
    const pricier = {
      product: makeProduct({ id: 'pricier', rating: 4, sold_count: 500, shop_type: 'normal' as const }),
      priceResult: makePriceResult({ originalPrice: 1000, effectiveNet: 750 }),
    }
    const result = rankResults([pricier, cheaper], NOW)
    expect(result[0].product.id).toBe('cheaper')
  })

  it('official store scores higher than normal store (all else equal)', () => {
    const official = {
      product: makeProduct({ id: 'official', shop_type: 'official' as const }),
      priceResult: makePriceResult(),
    }
    const normal = {
      product: makeProduct({ id: 'normal', shop_type: 'normal' as const }),
      priceResult: makePriceResult(),
    }
    const result = rankResults([normal, official], NOW)
    expect(result[0].product.id).toBe('official')
  })

  it('Best Value label when score ≥70', () => {
    const candidate = {
      product: makeProduct({ rating: 5, sold_count: 100_000, shop_type: 'official' as const }),
      priceResult: makePriceResult({ originalPrice: 1000, effectiveNet: 400 }),
    }
    const [r] = rankResults([candidate], NOW)
    expect(r.dealScore.label).toBe('Best Value')
  })

  it('usedCombination coupons appear in howToUse', () => {
    const coupon = makeCoupon({ type: 'fixed', discount_value: 100 })
    const candidate = {
      product: makeProduct(),
      priceResult: makePriceResult({ usedCombination: [coupon] }),
    }
    const [r] = rankResults([candidate], NOW)
    expect(r.explanation.howToUse).toContain('100')
  })

  it('near-expiry coupon surfaces in alternative', () => {
    const soon = new Date(NOW.getTime() + 6 * 3600 * 1000).toISOString()
    const coupon = makeCoupon({ expire_at: soon })
    const candidate = {
      product: makeProduct(),
      priceResult: makePriceResult({ usedCombination: [coupon] }),
    }
    const [r] = rankResults([candidate], NOW)
    expect(r.explanation.alternative).not.toBeNull()
    expect(r.explanation.alternative).toContain('24 ชั่วโมง')
  })

  it('scoreBreakdown has all 6 dimensions', () => {
    const candidate = { product: makeProduct(), priceResult: makePriceResult() }
    const [r] = rankResults([candidate], NOW)
    const { breakdown } = r.dealScore
    expect(breakdown.price).toBeDefined()
    expect(breakdown.rating).toBeDefined()
    expect(breakdown.sold).toBeDefined()
    expect(breakdown.discount).toBeDefined()
    expect(breakdown.store).toBeDefined()
    expect(breakdown.coupon).toBeDefined()
  })

  it('product with coupon code ranks above product without coupon (all else equal)', () => {
    const withCode = {
      product: makeProduct({ id: 'withCode' }),
      priceResult: makePriceResult({ usedCombination: [makeCoupon({ code: 'SAVE50' })] }),
    }
    const noCode = {
      product: makeProduct({ id: 'noCode' }),
      priceResult: makePriceResult({ usedCombination: [] }),
    }
    const result = rankResults([noCode, withCode], NOW)
    expect(result[0].product.id).toBe('withCode')
  })
})
