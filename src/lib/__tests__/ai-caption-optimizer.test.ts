import { describe, expect, it } from 'vitest'
import {
  computeAiCaptionReadiness,
  generateAiCaptionOptimizationReport,
  getAiCaptionConfig,
  scoreAiCaptionTemplates,
  type AiCaptionConfig,
  type AiCaptionTemplateMetric,
} from '@/lib/ai-caption-optimizer'
import type { RevenueCaptionInput } from '@/lib/revenue-caption-engine'
import type { CampaignContext } from '@/lib/campaign-context'

const normalContext: CampaignContext = {
  type:  'normal',
  label: 'Deal check',
  month: 'Apr',
}

const paydayContext: CampaignContext = {
  type:  'payday',
  label: 'Payday deals',
  month: 'Apr',
}

function makeConfig(overrides: Partial<AiCaptionConfig> = {}): AiCaptionConfig {
  return {
    enabled: true,
    dryRun:  true,
    thresholds: {
      minPosts:       2,
      minImpressions: 100,
      minClicks:      10,
    },
    ...overrides,
  }
}

function makeMetric(overrides: Partial<AiCaptionTemplateMetric> = {}): AiCaptionTemplateMetric {
  return {
    templateType: 'money_pain',
    postCount:    2,
    impressions:  100,
    clicks:       10,
    conversions:  1,
    revenue:      100,
    ...overrides,
  }
}

function makeCaptionInput(overrides: Partial<RevenueCaptionInput> = {}): RevenueCaptionInput {
  return {
    productName:    'Sony WH-1000XM5',
    productSlug:    'sony-wh-1000xm5',
    originalPrice:  10990,
    effectiveNet:   7990,
    couponCode:     'SAVE3000',
    campaignContext: normalContext,
    baseUrl:        'https://couponkum.com',
    ...overrides,
  }
}

describe('getAiCaptionConfig', () => {
  it('defaults to disabled dry-run mode', () => {
    const config = getAiCaptionConfig({})

    expect(config.enabled).toBe(false)
    expect(config.dryRun).toBe(true)
    expect(config.thresholds.minImpressions).toBe(500)
  })

  it('reads explicit flags and thresholds', () => {
    const config = getAiCaptionConfig({
      AI_CAPTION_OPTIMIZATION_ENABLED: 'true',
      AI_CAPTION_DRY_RUN:              'false',
      AI_CAPTION_MIN_POSTS:            '8',
      AI_CAPTION_MIN_IMPRESSIONS:      '2000',
      AI_CAPTION_MIN_CLICKS:           '120',
    })

    expect(config.enabled).toBe(true)
    expect(config.dryRun).toBe(false)
    expect(config.thresholds).toEqual({
      minPosts:       8,
      minImpressions: 2000,
      minClicks:      120,
    })
  })
})

describe('computeAiCaptionReadiness', () => {
  it('stays disabled when the feature flag is off', () => {
    const readiness = computeAiCaptionReadiness(
      [makeMetric()],
      makeConfig({ enabled: false }),
    )

    expect(readiness.baselineReady).toBe(true)
    expect(readiness.canApply).toBe(false)
    expect(readiness.mode).toBe('disabled')
  })

  it('waits for baseline when totals are too small', () => {
    const readiness = computeAiCaptionReadiness(
      [makeMetric({ postCount: 1, impressions: 40, clicks: 3 })],
      makeConfig(),
    )

    expect(readiness.baselineReady).toBe(false)
    expect(readiness.canApply).toBe(false)
    expect(readiness.mode).toBe('waiting_for_baseline')
    expect(readiness.reasons.length).toBeGreaterThan(0)
  })

  it('allows apply only when enabled, ready, and not dry-run', () => {
    const readiness = computeAiCaptionReadiness(
      [makeMetric()],
      makeConfig({ enabled: true, dryRun: false }),
    )

    expect(readiness.baselineReady).toBe(true)
    expect(readiness.canApply).toBe(true)
    expect(readiness.mode).toBe('active_ready')
  })
})

describe('scoreAiCaptionTemplates', () => {
  it('ranks template metrics by CTR, CVR, RPC, and confidence', () => {
    const scores = scoreAiCaptionTemplates(
      [
        makeMetric({
          templateType: 'money_pain',
          impressions: 500,
          clicks:      25,
          conversions: 2,
          revenue:     200,
        }),
        makeMetric({
          templateType: 'timing',
          impressions: 500,
          clicks:      80,
          conversions: 12,
          revenue:     1200,
        }),
      ],
      makeConfig({ thresholds: { minPosts: 2, minImpressions: 100, minClicks: 10 } }),
    )

    expect(scores[0].templateType).toBe('timing')
    expect(scores[0].score).toBeGreaterThan(scores[1].score)
  })
})

describe('generateAiCaptionOptimizationReport', () => {
  it('falls back to rule-based template when baseline is not ready', () => {
    const report = generateAiCaptionOptimizationReport({
      ...makeCaptionInput({ campaignContext: paydayContext }),
      metrics: [makeMetric({ templateType: 'timing', postCount: 1, impressions: 20, clicks: 1 })],
      config:  makeConfig(),
    })

    expect(report.readiness.baselineReady).toBe(false)
    expect(report.selectedTemplate).toBe('money_pain')
    expect(report.variants[0].caption.templateType).toBe('money_pain')
  })

  it('selects the highest-performing template when baseline is ready', () => {
    const report = generateAiCaptionOptimizationReport({
      ...makeCaptionInput(),
      metrics: [
        makeMetric({
          templateType: 'money_pain',
          impressions: 500,
          clicks:      30,
          conversions: 2,
          revenue:     150,
        }),
        makeMetric({
          templateType: 'lazy_buyer',
          impressions: 500,
          clicks:      90,
          conversions: 14,
          revenue:     1300,
        }),
      ],
      config: makeConfig(),
    })

    expect(report.readiness.mode).toBe('dry_run_ready')
    expect(report.selectedTemplate).toBe('lazy_buyer')
    expect(report.challengerTemplate).toBe('money_pain')
    expect(report.variants).toHaveLength(2)
  })

  it('runs guardrails for selected and challenger captions', () => {
    const report = generateAiCaptionOptimizationReport({
      ...makeCaptionInput(),
      metrics: [
        makeMetric({ templateType: 'money_pain', impressions: 500, clicks: 40 }),
        makeMetric({ templateType: 'timing', impressions: 500, clicks: 35 }),
      ],
      config: makeConfig(),
    })

    expect(report.variants[0].guardrail.short.passed).toBe(true)
    expect(report.variants[0].guardrail.long.passed).toBe(true)
    expect(report.variants[1].role).toBe('challenger')
  })
})
