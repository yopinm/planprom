// src/features/engine/__tests__/rare-item-engine.test.ts
// TASK 2.9 — Rare Item Engine unit tests

import { describe, it, expect } from 'vitest'
import {
  discountToScore,
  ratingToScore,
  soldToTrendScore,
  assignRareBadge,
  calculateRareItemScore,
  scoreRareItemBatch,
  RARE_THRESHOLDS,
} from '../rare-item-engine'
import type { Product } from '@/types'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id:             'prod-1',
    platform:       'shopee',
    platform_id:    'shp-001',
    name:           'Test Product',
    url:            'https://shopee.co.th/test',
    affiliate_url:  null,
    category:       'electronics',
    price_current:  1000,
    price_original: 1500,
    price_min:      1000,
    price_max:      1000,
    shop_id:        'shop-1',
    shop_name:      'Test Shop',
    shop_type:      'normal',
    rating:         4.7,
    sold_count:     100,
    image_url:      null,
    is_active:      true,
    created_at:     new Date().toISOString(),
    updated_at:     new Date().toISOString(),
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// discountToScore
// ---------------------------------------------------------------------------

describe('discountToScore', () => {
  it('returns 0 when no price_original', () => {
    expect(discountToScore(null, 1000)).toBe(0)
  })

  it('returns 0 when current >= original', () => {
    expect(discountToScore(1000, 1000)).toBe(0)
    expect(discountToScore(900, 1000)).toBe(0)
  })

  it('returns 67 for 33% discount', () => {
    // 1000 → 1500, discount = 500/1500 ≈ 33.3% → score = 33.3% * 200 ≈ 67
    expect(discountToScore(1500, 1000)).toBe(67)
  })

  it('caps at 100 for 50%+ discount', () => {
    expect(discountToScore(2000, 1000)).toBe(100)
    expect(discountToScore(5000, 100)).toBe(100)
  })

  it('returns 40 for 20% discount', () => {
    expect(discountToScore(1250, 1000)).toBe(40)
  })
})

// ---------------------------------------------------------------------------
// ratingToScore
// ---------------------------------------------------------------------------

describe('ratingToScore', () => {
  it('returns 40 for null rating', () => {
    expect(ratingToScore(null)).toBe(40)
  })

  it('returns 0 for rating 1.0', () => {
    expect(ratingToScore(1.0)).toBe(0)
  })

  it('returns 100 for rating 5.0', () => {
    expect(ratingToScore(5.0)).toBe(100)
  })

  it('returns 75 for rating 4.0', () => {
    // (4.0 - 1) / 4 * 100 = 75
    expect(ratingToScore(4.0)).toBe(75)
  })

  it('returns 88 for rating 4.5', () => {
    // (4.5 - 1) / 4 * 100 = 87.5 → 88
    expect(ratingToScore(4.5)).toBe(88)
  })
})

// ---------------------------------------------------------------------------
// soldToTrendScore
// ---------------------------------------------------------------------------

describe('soldToTrendScore', () => {
  it('returns 0 for 0 sold', () => {
    expect(soldToTrendScore(0)).toBe(0)
  })

  it('returns 50 for TREND_SOLD_MAX/2 sold', () => {
    expect(soldToTrendScore(RARE_THRESHOLDS.TREND_SOLD_MAX / 2)).toBe(50)
  })

  it('returns 100 for TREND_SOLD_MAX sold', () => {
    expect(soldToTrendScore(RARE_THRESHOLDS.TREND_SOLD_MAX)).toBe(100)
  })

  it('caps at 100 for sold > TREND_SOLD_MAX', () => {
    expect(soldToTrendScore(99999)).toBe(100)
  })
})

// ---------------------------------------------------------------------------
// assignRareBadge
// ---------------------------------------------------------------------------

describe('assignRareBadge', () => {
  it('returns rare when rareScore >= RARE_BADGE_THRESHOLD', () => {
    const product = makeProduct()
    expect(assignRareBadge(product, RARE_THRESHOLDS.RARE_BADGE_THRESHOLD)).toBe('rare')
    expect(assignRareBadge(product, 100)).toBe('rare')
  })

  it('returns ready_to_ship for official store + sufficient sold_count', () => {
    const product = makeProduct({
      shop_type:  'official',
      sold_count: RARE_THRESHOLDS.READY_SHIP_SOLD_MIN,
    })
    expect(assignRareBadge(product, 30)).toBe('ready_to_ship')
  })

  it('returns ready_to_ship for mall store', () => {
    const product = makeProduct({
      shop_type:  'mall',
      sold_count: 50,
    })
    expect(assignRareBadge(product, 50)).toBe('ready_to_ship')
  })

  it('returns low_stock for rareScore >= LOW_STOCK_BADGE_THRESHOLD', () => {
    const product = makeProduct({ shop_type: 'normal' })
    const score = RARE_THRESHOLDS.LOW_STOCK_BADGE_THRESHOLD
    expect(assignRareBadge(product, score)).toBe('low_stock')
  })

  it('returns null when rareScore below all thresholds', () => {
    const product = makeProduct({ shop_type: 'normal', sold_count: 5 })
    expect(assignRareBadge(product, 10)).toBeNull()
  })

  it('rare badge takes priority over ready_to_ship', () => {
    const product = makeProduct({
      shop_type:  'official',
      sold_count: 100,
    })
    // rareScore is high enough for 'rare' badge
    expect(assignRareBadge(product, RARE_THRESHOLDS.RARE_BADGE_THRESHOLD)).toBe('rare')
  })
})

// ---------------------------------------------------------------------------
// calculateRareItemScore
// ---------------------------------------------------------------------------

describe('calculateRareItemScore', () => {
  it('returns a complete result with all fields', () => {
    const product = makeProduct()
    const result  = calculateRareItemScore(product, 70)

    expect(result.product_id).toBe('prod-1')
    expect(result.rare_score).toBeGreaterThanOrEqual(0)
    expect(result.rare_score).toBeLessThanOrEqual(100)
    expect(result.trend_score).toBeGreaterThanOrEqual(0)
    expect(result.trend_score).toBeLessThanOrEqual(100)
    expect(result.final_score).toBeGreaterThanOrEqual(0)
    expect(result.final_score).toBeLessThanOrEqual(100)
    expect(result.breakdown.discountScore).toBeGreaterThan(0)
  })

  it('final_score is weighted composite of deal+rare+trend', () => {
    const product = makeProduct({
      price_original: 2000,
      price_current:  1000,    // 50% off → discountScore = 100
      rating:         5.0,     // ratingScore = 100
      sold_count:     200,     // trendScore = 100
    })
    const dealScore = 100
    const result = calculateRareItemScore(product, dealScore)

    // rare_score = 100*0.60 + 100*0.40 = 100
    // trend_score = 100
    // final_score = 100*0.35 + 100*0.40 + 100*0.25 = 100
    expect(result.rare_score).toBe(100)
    expect(result.trend_score).toBe(100)
    expect(result.final_score).toBe(100)
  })

  it('gives zero discount score for product with no price_original', () => {
    const product = makeProduct({ price_original: null, rating: null, sold_count: 0 })
    const result  = calculateRareItemScore(product, 0)
    expect(result.breakdown.discountScore).toBe(0)
    expect(result.final_score).toBeGreaterThanOrEqual(0)
  })
})

// ---------------------------------------------------------------------------
// scoreRareItemBatch — Merchant Trust Filter + sorting
// ---------------------------------------------------------------------------

describe('scoreRareItemBatch', () => {
  it('filters out products that fail Merchant Trust Filter', () => {
    const trusted = makeProduct({
      id:         'trusted',
      rating:     4.9,
      sold_count: 100,
      shop_type:  'official',
    })
    const untrusted = makeProduct({
      id:         'untrusted',
      rating:     2.0,   // < 4.5 threshold → fails trust filter
      sold_count: 100,
    })

    const results = scoreRareItemBatch(
      [trusted, untrusted],
      new Map([['trusted', 80], ['untrusted', 80]]),
    )

    const ids = results.map(r => r.product_id)
    expect(ids).toContain('trusted')
    expect(ids).not.toContain('untrusted')
  })

  it('filters out suspicious discount products', () => {
    const suspicious = makeProduct({
      id:             'suspicious',
      price_original: 10000,
      price_current:  500,    // 95% off → suspiciousDiscount flag
      rating:         4.8,
      sold_count:     200,
    })

    const results = scoreRareItemBatch([suspicious], new Map([['suspicious', 90]]))
    expect(results).toHaveLength(0)
  })

  it('returns results sorted by final_score DESC', () => {
    const high = makeProduct({
      id:             'high',
      rating:         4.9,
      sold_count:     200,
      price_original: 2000,
      price_current:  1000,
      shop_type:      'official',
    })
    const low = makeProduct({
      id:             'low',
      rating:         4.6,
      sold_count:     30,
      price_original: 1100,
      price_current:  1000,
      shop_type:      'normal',
    })

    const results = scoreRareItemBatch(
      [low, high],
      new Map([['high', 85], ['low', 50]]),
    )

    expect(results[0].product_id).toBe('high')
  })

  it('adaptive floor: single product is always included even below FEED_MIN_FINAL_SCORE', () => {
    const lowScore = makeProduct({
      id:             'low-score',
      rating:         4.6,
      sold_count:     10,
      price_original: null,
      price_current:  1000,
      shop_type:      'normal',
    })

    // Adaptive floor = min(FEED_MIN_FINAL_SCORE, score_at_rank_1)
    // When there is only 1 product it is always the top product, so adaptive floor ≤ its score.
    const results = scoreRareItemBatch([lowScore], new Map([['low-score', 0]]))
    expect(results).toHaveLength(1)
  })
})
