import { describe, expect, it } from 'vitest'
import {
  computeAiDatabaseLeanReadiness,
  generateAiDatabaseLeanReport,
  getAiDatabaseLeanConfig,
  type AiDatabaseLeanConfig,
  type TableLeanStat,
} from '@/lib/ai-database-lean'

const NOW = new Date('2026-04-21T10:00:00.000Z')

function makeConfig(overrides: Partial<AiDatabaseLeanConfig> = {}): AiDatabaseLeanConfig {
  return {
    enabled: true,
    dryRun:  true,
    thresholds: {
      minTableStats: 2,
      minTotalRows:  1000,
    },
    ...overrides,
  }
}

function makeStat(overrides: Partial<TableLeanStat> = {}): TableLeanStat {
  return {
    tableName:       'price_history',
    rowCount:        120_000,
    estimatedSizeMb: 650,
    oldestRowAt:     '2025-06-01T00:00:00.000Z',
    newestRowAt:     '2026-04-21T00:00:00.000Z',
    queryP95Ms:      420,
    ...overrides,
  }
}

describe('getAiDatabaseLeanConfig', () => {
  it('defaults to disabled dry-run mode', () => {
    const config = getAiDatabaseLeanConfig({} as NodeJS.ProcessEnv)

    expect(config.enabled).toBe(false)
    expect(config.dryRun).toBe(true)
    expect(config.thresholds.minTotalRows).toBe(1000)
  })

  it('reads explicit flags and thresholds', () => {
    const config = getAiDatabaseLeanConfig({
      AI_DB_LEAN_ENABLED:         'true',
      AI_DB_LEAN_DRY_RUN:         'false',
      AI_DB_LEAN_MIN_TABLE_STATS: '4',
      AI_DB_LEAN_MIN_TOTAL_ROWS:  '50000',
    } as unknown as NodeJS.ProcessEnv)

    expect(config.enabled).toBe(true)
    expect(config.dryRun).toBe(false)
    expect(config.thresholds).toEqual({
      minTableStats: 4,
      minTotalRows:  50000,
    })
  })
})

describe('computeAiDatabaseLeanReadiness', () => {
  it('waits for enough table stats and rows', () => {
    const readiness = computeAiDatabaseLeanReadiness(
      [makeStat({ rowCount: 100 })],
      makeConfig(),
    )

    expect(readiness.baselineReady).toBe(false)
    expect(readiness.canApply).toBe(false)
    expect(readiness.mode).toBe('waiting_for_baseline')
    expect(readiness.reasons.length).toBeGreaterThan(0)
  })

  it('reports dry-run readiness when baseline passes', () => {
    const readiness = computeAiDatabaseLeanReadiness(
      [
        makeStat(),
        makeStat({ tableName: 'click_logs', rowCount: 150_000 }),
      ],
      makeConfig(),
    )

    expect(readiness.baselineReady).toBe(true)
    expect(readiness.canApply).toBe(false)
    expect(readiness.mode).toBe('dry_run_ready')
  })

  it('allows apply only when enabled, ready, and not dry-run', () => {
    const readiness = computeAiDatabaseLeanReadiness(
      [
        makeStat(),
        makeStat({ tableName: 'click_logs', rowCount: 150_000 }),
      ],
      makeConfig({ dryRun: false }),
    )

    expect(readiness.canApply).toBe(true)
    expect(readiness.mode).toBe('active_ready')
  })
})

describe('generateAiDatabaseLeanReport', () => {
  it('recommends archiving stale price_history rows', () => {
    const report = generateAiDatabaseLeanReport({
      stats: [
        makeStat(),
        makeStat({ tableName: 'click_logs', rowCount: 10_000, estimatedSizeMb: 40 }),
      ],
      config: makeConfig(),
      now:    NOW,
    })

    const priceHistory = report.recommendations.find(row => row.tableName === 'price_history')
    expect(priceHistory?.action).toBe('archive')
    expect(priceHistory?.candidateRows).toBeGreaterThan(0)
    expect(priceHistory?.dryRunSql).toContain('SELECT count(*) FROM price_history')
    expect(priceHistory?.reasons).toContain('large table size')
  })

  it('recommends purging stale click_logs rows', () => {
    const report = generateAiDatabaseLeanReport({
      stats: [
        makeStat(),
        makeStat({
          tableName:       'click_logs',
          rowCount:        250_000,
          estimatedSizeMb: 900,
          oldestRowAt:     '2025-10-01T00:00:00.000Z',
          newestRowAt:     '2026-04-21T00:00:00.000Z',
          queryP95Ms:      800,
        }),
      ],
      config: makeConfig(),
      now:    NOW,
    })

    const clickLogs = report.recommendations.find(row => row.tableName === 'click_logs')
    expect(clickLogs?.action).toBe('purge')
    expect(clickLogs?.riskScore).toBeGreaterThan(50)
    expect(clickLogs?.dryRunSql).toContain('SELECT count(*) FROM click_logs')
    expect(clickLogs?.reasons).toContain('slow p95 query latency')
  })

  it('monitors small or fresh tables without cleanup SQL', () => {
    const report = generateAiDatabaseLeanReport({
      stats: [
        makeStat({
          tableName:       'product_views',
          rowCount:        500,
          estimatedSizeMb: 5,
          oldestRowAt:     '2026-04-20T00:00:00.000Z',
          newestRowAt:     '2026-04-21T00:00:00.000Z',
          queryP95Ms:      20,
        }),
        makeStat({ tableName: 'click_logs', rowCount: 600, estimatedSizeMb: 6 }),
      ],
      config: makeConfig({ thresholds: { minTableStats: 2, minTotalRows: 100 } }),
      now:    NOW,
    })

    const productViews = report.recommendations.find(row => row.tableName === 'product_views')
    expect(productViews?.action).toBe('monitor')
    expect(productViews?.dryRunSql).toBeNull()
    expect(productViews?.candidateRows).toBe(0)
  })

  it('sorts highest risk recommendations first', () => {
    const report = generateAiDatabaseLeanReport({
      stats: [
        makeStat({
          tableName:       'price_history',
          rowCount:        60_000,
          estimatedSizeMb: 200,
          oldestRowAt:     '2025-10-01T00:00:00.000Z',
          queryP95Ms:      200,
        }),
        makeStat({
          tableName:       'click_logs',
          rowCount:        300_000,
          estimatedSizeMb: 1200,
          oldestRowAt:     '2025-01-01T00:00:00.000Z',
          queryP95Ms:      900,
        }),
      ],
      config: makeConfig(),
      now:    NOW,
    })

    expect(report.recommendations[0].tableName).toBe('click_logs')
  })
})
