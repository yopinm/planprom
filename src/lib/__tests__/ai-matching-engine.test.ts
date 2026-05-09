import { describe, expect, it } from 'vitest'
import {
  computeAiMatchingReadiness,
  generateAiMatchingReport,
  getAiMatchingConfig,
  scoreIntentMatch,
  scorePlatformStrength,
  scoreRevenueSignal,
  type AiMatchingConfig,
  type PlatformStrengthSignal,
} from '@/lib/ai-matching-engine'
import type { ParsedIntent, Platform, Product, PriceResult } from '@/types'
import type { RankedResult } from '@/features/engine/ranking-engine'

function makeConfig(overrides: Partial<AiMatchingConfig> = {}): AiMatchingConfig {
  return {
    enabled: true,
    dryRun:  true,
    thresholds: {
      minCandidates:     2,
      minRevenueSignals: 2,
    },
    ...overrides,
  }
}

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id:             'p1',
    platform:       'shopee',
    platform_id:    'shop-1',
    name:           'Sony WH-1000XM5',
    url:            'https://example.com/p1',
    affiliate_url:  null,
    category:       'electronics',
    price_current:  7990,
    price_original: 10990,
    price_min:      null,
    price_max:      null,
    shop_id:        's1',
    shop_name:      'Sony Store',
    shop_type:      'official',
    rating:         4.8,
    sold_count:     2000,
    image_url:      null,
    is_active:      true,
    created_at:     '2026-04-21T00:00:00.000Z',
    updated_at:     '2026-04-21T00:00:00.000Z',
    ...overrides,
  }
}

function makePriceResult(overrides: Partial<PriceResult> = {}): PriceResult {
  return {
    originalPrice:    10990,
    payNow:           8490,
    effectiveNet:     7990,
    usedCombination:  [],
    ...overrides,
  }
}

function makeRankedResult(overrides: {
  product?: Partial<Product>
  priceResult?: Partial<PriceResult>
  dealScore?: number
} = {}): RankedResult {
  const dealScore = overrides.dealScore ?? 80
  return {
    product: makeProduct(overrides.product),
    priceResult: makePriceResult(overrides.priceResult),
    dealScore: {
      total: dealScore,
      label: dealScore >= 70 ? 'Best Value' : dealScore >= 50 ? 'Good Deal' : 'Fair Deal',
      breakdown: {
        price:    80,
        rating:   90,
        sold:     70,
        discount: 60,
        store:    100,
        coupon:   0,
      },
    },
    explanation: {
      summary:     'Best value',
      howToUse:    'Use coupon',
      confidence:  'สูง',
      alternative: null,
    },
  }
}

function makeSignal(platform: Platform, overrides: Partial<PlatformStrengthSignal> = {}): PlatformStrengthSignal {
  return {
    platform,
    clicks:      100,
    conversions: 10,
    revenue:     1000,
    ...overrides,
  }
}

describe('getAiMatchingConfig', () => {
  it('defaults to disabled dry-run mode', () => {
    const config = getAiMatchingConfig({} as NodeJS.ProcessEnv)

    expect(config.enabled).toBe(false)
    expect(config.dryRun).toBe(true)
    expect(config.thresholds.minCandidates).toBe(2)
  })

  it('reads explicit flags and thresholds', () => {
    const config = getAiMatchingConfig({
      AI_MATCHING_ENABLED:             'true',
      AI_MATCHING_DRY_RUN:             'false',
      AI_MATCHING_MIN_CANDIDATES:      '5',
      AI_MATCHING_MIN_REVENUE_SIGNALS: '3',
    } as unknown as NodeJS.ProcessEnv)

    expect(config.enabled).toBe(true)
    expect(config.dryRun).toBe(false)
    expect(config.thresholds).toEqual({
      minCandidates:     5,
      minRevenueSignals: 3,
    })
  })
})

describe('computeAiMatchingReadiness', () => {
  it('waits for enough candidates and revenue signals', () => {
    const readiness = computeAiMatchingReadiness(
      [makeRankedResult()],
      [makeSignal('shopee')],
      makeConfig(),
    )

    expect(readiness.baselineReady).toBe(false)
    expect(readiness.canApply).toBe(false)
    expect(readiness.mode).toBe('waiting_for_baseline')
    expect(readiness.reasons.length).toBeGreaterThan(0)
  })

  it('reports dry-run readiness when baseline passes', () => {
    const readiness = computeAiMatchingReadiness(
      [makeRankedResult(), makeRankedResult({ product: { id: 'p2', platform: 'lazada' } })],
      [makeSignal('shopee'), makeSignal('lazada')],
      makeConfig(),
    )

    expect(readiness.baselineReady).toBe(true)
    expect(readiness.canApply).toBe(false)
    expect(readiness.mode).toBe('dry_run_ready')
  })

  it('allows apply only when enabled, ready, and not dry-run', () => {
    const readiness = computeAiMatchingReadiness(
      [makeRankedResult(), makeRankedResult({ product: { id: 'p2', platform: 'lazada' } })],
      [makeSignal('shopee'), makeSignal('lazada')],
      makeConfig({ dryRun: false }),
    )

    expect(readiness.canApply).toBe(true)
    expect(readiness.mode).toBe('active_ready')
  })
})

describe('scoreIntentMatch', () => {
  it('rewards matching platform, category, budget, and query', () => {
    const intent: ParsedIntent = {
      query_type: 'product_name',
      platform:   'shopee',
      category:   'electronics',
      budget:     9000,
      query:      'Sony',
    }

    expect(scoreIntentMatch(intent, makeRankedResult())).toBeGreaterThanOrEqual(90)
  })

  it('penalizes platform and budget mismatch', () => {
    const intent: ParsedIntent = {
      query_type: 'budget',
      platform:   'lazada',
      budget:     5000,
      query:      'Sony',
    }

    expect(scoreIntentMatch(intent, makeRankedResult())).toBeLessThan(60)
  })
})

describe('platform and revenue scoring', () => {
  const signals = [
    makeSignal('shopee', { clicks: 100, conversions: 4, revenue: 200 }),
    makeSignal('lazada', { clicks: 100, conversions: 12, revenue: 1200 }),
  ]

  it('scores stronger converting platform higher', () => {
    expect(scorePlatformStrength('lazada', signals)).toBeGreaterThan(scorePlatformStrength('shopee', signals))
  })

  it('scores stronger revenue platform higher', () => {
    expect(scoreRevenueSignal('lazada', signals)).toBeGreaterThan(scoreRevenueSignal('shopee', signals))
  })
})

describe('generateAiMatchingReport', () => {
  it('sorts by 3-point match score, not just original deal score', () => {
    const intent: ParsedIntent = {
      query_type: 'product_name',
      category:   'coffee',
      query:      'coffee',
    }
    const shopee = makeRankedResult({
      product: { id: 'shopee-coffee', platform: 'shopee', category: 'coffee', name: 'Coffee Beans' },
      dealScore: 92,
    })
    const lazada = makeRankedResult({
      product: { id: 'lazada-coffee', platform: 'lazada', category: 'coffee', name: 'Coffee Beans' },
      dealScore: 78,
    })

    const report = generateAiMatchingReport({
      intent,
      results: [shopee, lazada],
      platformSignals: [
        makeSignal('shopee', { clicks: 100, conversions: 2, revenue: 100 }),
        makeSignal('lazada', { clicks: 100, conversions: 18, revenue: 2000 }),
      ],
      config: makeConfig(),
    })

    expect(report.readiness.mode).toBe('dry_run_ready')
    expect(report.matches[0].result.product.platform).toBe('lazada')
    expect(report.matches[0].reasons).toContain('platform converts well')
    expect(report.matches[0].reasons).toContain('strong revenue signal')
  })
})
