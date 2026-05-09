import { describe, expect, it } from 'vitest'
import {
  computeAiContentReadiness,
  generateAiContentQueueReport,
  getAiContentConfig,
  type AiContentCandidate,
  type AiContentConfig,
  type AiContentSignal,
} from '@/lib/ai-content-machine'

const NOW = new Date('2026-04-21T10:00:00.000Z')

function makeConfig(overrides: Partial<AiContentConfig> = {}): AiContentConfig {
  return {
    enabled: true,
    dryRun:  true,
    thresholds: {
      minCandidates: 2,
      minSignalRows: 2,
    },
    ...overrides,
  }
}

function makeCandidate(overrides: Partial<AiContentCandidate> = {}): AiContentCandidate {
  return {
    id:            'coupon-shopee',
    path:          '/coupon/shopee',
    pageType:      'platform_coupon',
    title:         'Shopee coupons',
    platform:      'shopee',
    category:      null,
    exists:        true,
    lastUpdatedAt: '2026-04-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeSignal(overrides: Partial<AiContentSignal> = {}): AiContentSignal {
  return {
    candidateId:       'coupon-shopee',
    searchImpressions: 1000,
    clicks:            100,
    conversions:       10,
    revenue:           1000,
    contentGapScore:   30,
    ...overrides,
  }
}

describe('getAiContentConfig', () => {
  it('defaults to disabled dry-run mode', () => {
    const config = getAiContentConfig({} as NodeJS.ProcessEnv)

    expect(config.enabled).toBe(false)
    expect(config.dryRun).toBe(true)
    expect(config.thresholds.minCandidates).toBe(3)
  })

  it('reads explicit flags and thresholds', () => {
    const config = getAiContentConfig({
      AI_CONTENT_MACHINE_ENABLED: 'true',
      AI_CONTENT_MACHINE_DRY_RUN: 'false',
      AI_CONTENT_MIN_CANDIDATES:  '8',
      AI_CONTENT_MIN_SIGNAL_ROWS: '6',
    } as unknown as NodeJS.ProcessEnv)

    expect(config.enabled).toBe(true)
    expect(config.dryRun).toBe(false)
    expect(config.thresholds).toEqual({
      minCandidates: 8,
      minSignalRows: 6,
    })
  })
})

describe('computeAiContentReadiness', () => {
  it('waits for enough candidates and signal rows', () => {
    const readiness = computeAiContentReadiness(
      [makeCandidate()],
      [makeSignal()],
      makeConfig(),
    )

    expect(readiness.baselineReady).toBe(false)
    expect(readiness.canApply).toBe(false)
    expect(readiness.mode).toBe('waiting_for_baseline')
    expect(readiness.reasons.length).toBeGreaterThan(0)
  })

  it('reports dry-run readiness when baseline passes', () => {
    const readiness = computeAiContentReadiness(
      [makeCandidate(), makeCandidate({ id: 'compare', path: '/compare' })],
      [makeSignal(), makeSignal({ candidateId: 'compare' })],
      makeConfig(),
    )

    expect(readiness.baselineReady).toBe(true)
    expect(readiness.canApply).toBe(false)
    expect(readiness.mode).toBe('dry_run_ready')
  })

  it('allows apply only when enabled, ready, and not dry-run', () => {
    const readiness = computeAiContentReadiness(
      [makeCandidate(), makeCandidate({ id: 'compare', path: '/compare' })],
      [makeSignal(), makeSignal({ candidateId: 'compare' })],
      makeConfig({ dryRun: false }),
    )

    expect(readiness.canApply).toBe(true)
    expect(readiness.mode).toBe('active_ready')
  })
})

describe('generateAiContentQueueReport', () => {
  it('prioritizes high demand, revenue, conversion, stale, and gap signals', () => {
    const report = generateAiContentQueueReport({
      candidates: [
        makeCandidate({
          id:            'stale-category',
          path:          '/deals/shopee/coffee',
          pageType:      'category_deals',
          title:         'Coffee deals',
          category:      'coffee',
          exists:        true,
          lastUpdatedAt: '2026-01-01T00:00:00.000Z',
        }),
        makeCandidate({
          id:       'fresh-low',
          path:     '/coupon/lazada',
          platform: 'lazada',
        }),
      ],
      signals: [
        makeSignal({
          candidateId:       'stale-category',
          searchImpressions: 3000,
          clicks:            240,
          conversions:       36,
          revenue:           4500,
          contentGapScore:   90,
        }),
        makeSignal({
          candidateId:       'fresh-low',
          searchImpressions: 300,
          clicks:            20,
          conversions:       1,
          revenue:           80,
          contentGapScore:   20,
        }),
      ],
      config: makeConfig(),
      now:    NOW,
    })

    expect(report.readiness.mode).toBe('dry_run_ready')
    expect(report.items[0].candidate.id).toBe('stale-category')
    expect(report.items[0].action).toBe('refresh')
    expect(report.items[0].reasons).toContain('high search demand')
    expect(report.items[0].reasons).toContain('large content gap')
  })

  it('marks missing content as create', () => {
    const report = generateAiContentQueueReport({
      candidates: [
        makeCandidate({
          id:       'new-campaign',
          path:     '/deals/double-date',
          pageType: 'campaign',
          title:    'Double Date deals',
          exists:   false,
        }),
        makeCandidate({ id: 'compare', path: '/compare' }),
      ],
      signals: [
        makeSignal({ candidateId: 'new-campaign', searchImpressions: 800, clicks: 40 }),
        makeSignal({ candidateId: 'compare', searchImpressions: 500, clicks: 30 }),
      ],
      config: makeConfig(),
      now:    NOW,
    })

    const item = report.items.find(row => row.candidate.id === 'new-campaign')
    expect(item?.action).toBe('create')
    expect(item?.reasons).toContain('new content opportunity')
  })

  it('defers existing fresh low-signal content', () => {
    const report = generateAiContentQueueReport({
      candidates: [
        makeCandidate({ id: 'fresh', path: '/coupon/shopee', lastUpdatedAt: '2026-04-20T00:00:00.000Z' }),
        makeCandidate({ id: 'other', path: '/compare' }),
      ],
      signals: [
        makeSignal({ candidateId: 'fresh', searchImpressions: 10, clicks: 1, conversions: 0, revenue: 0, contentGapScore: 5 }),
        makeSignal({ candidateId: 'other', searchImpressions: 20, clicks: 1, conversions: 0, revenue: 0, contentGapScore: 5 }),
      ],
      config: makeConfig(),
      now:    NOW,
    })

    const item = report.items.find(row => row.candidate.id === 'fresh')
    expect(item?.action).toBe('defer')
  })
})
