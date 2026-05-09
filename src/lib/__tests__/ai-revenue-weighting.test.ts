import { describe, expect, it } from 'vitest'
import {
  computeAiRevenueReadiness,
  computeAiRevenueWeightingReport,
  getAiRevenueWeightingConfig,
  type AiRevenueWeightingConfig,
} from '@/lib/ai-revenue-weighting'
import type { RevenueRow } from '@/lib/revenue-data'

function makeRow(overrides: Partial<RevenueRow> = {}): RevenueRow {
  return {
    sub_id:               'search_top_1',
    click_count:          100,
    conversion_count:     5,
    total_commission:     250,
    cancelled_commission: 0,
    conversion_rate_pct:  5,
    last_click_at:        '2026-04-21T10:00:00.000Z',
    ...overrides,
  }
}

function makeConfig(overrides: Partial<AiRevenueWeightingConfig> = {}): AiRevenueWeightingConfig {
  return {
    enabled: true,
    dryRun:  true,
    thresholds: {
      minClicks:      100,
      minConversions: 5,
      minRevenueDays: 1,
    },
    ...overrides,
  }
}

describe('getAiRevenueWeightingConfig', () => {
  it('defaults to disabled dry-run mode', () => {
    const config = getAiRevenueWeightingConfig({} as NodeJS.ProcessEnv)
    expect(config.enabled).toBe(false)
    expect(config.dryRun).toBe(true)
    expect(config.thresholds.minClicks).toBe(1000)
  })

  it('reads explicit feature flags and thresholds', () => {
    const config = getAiRevenueWeightingConfig({
      AI_OPTIMIZATION_ENABLED: 'true',
      AI_DRY_RUN:              'false',
      AI_MIN_CLICKS:           '2000',
      AI_MIN_CONVERSIONS:      '40',
      AI_MIN_REVENUE_DAYS:     '14',
    } as unknown as NodeJS.ProcessEnv)

    expect(config.enabled).toBe(true)
    expect(config.dryRun).toBe(false)
    expect(config.thresholds).toEqual({
      minClicks:      2000,
      minConversions: 40,
      minRevenueDays: 14,
    })
  })
})

describe('computeAiRevenueReadiness', () => {
  it('stays disabled when feature flag is off even if baseline is ready', () => {
    const readiness = computeAiRevenueReadiness(
      [makeRow()],
      makeConfig({ enabled: false, dryRun: true }),
    )

    expect(readiness.baselineReady).toBe(true)
    expect(readiness.canApply).toBe(false)
    expect(readiness.mode).toBe('disabled')
  })

  it('waits for baseline when thresholds are not met', () => {
    const readiness = computeAiRevenueReadiness(
      [makeRow({ click_count: 20, conversion_count: 1 })],
      makeConfig(),
    )

    expect(readiness.baselineReady).toBe(false)
    expect(readiness.canApply).toBe(false)
    expect(readiness.mode).toBe('waiting_for_baseline')
    expect(readiness.reasons.length).toBeGreaterThan(0)
  })

  it('reports dry-run readiness when baseline passes but dry-run is enabled', () => {
    const readiness = computeAiRevenueReadiness([makeRow()], makeConfig())

    expect(readiness.baselineReady).toBe(true)
    expect(readiness.canApply).toBe(false)
    expect(readiness.mode).toBe('dry_run_ready')
  })

  it('allows apply only when enabled, ready, and not dry-run', () => {
    const readiness = computeAiRevenueReadiness(
      [makeRow()],
      makeConfig({ enabled: true, dryRun: false }),
    )

    expect(readiness.baselineReady).toBe(true)
    expect(readiness.canApply).toBe(true)
    expect(readiness.mode).toBe('active_ready')
  })
})

describe('computeAiRevenueWeightingReport', () => {
  it('generates review-only recommendations from revenue scores', () => {
    const report = computeAiRevenueWeightingReport(
      [
        makeRow({
          sub_id:              'search_winner',
          click_count:         100,
          conversion_count:    20,
          total_commission:    1000,
          conversion_rate_pct: 20,
        }),
        makeRow({
          sub_id:              'search_weak',
          click_count:         100,
          conversion_count:    1,
          total_commission:    10,
          conversion_rate_pct: 1,
        }),
      ],
      makeConfig({ thresholds: { minClicks: 100, minConversions: 1, minRevenueDays: 1 } }),
    )

    expect(report.readiness.canApply).toBe(false)
    expect(report.recommendations[0].sub_id).toBe('search_winner')
    expect(report.recommendations[0].recommended_multiplier).toBeGreaterThan(1)
    expect(report.recommendations[1].recommended_multiplier).toBeLessThan(1)
  })
})
