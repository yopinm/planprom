// TASK 6.1 - AI Revenue-Driven Weighting (dormant / dry-run)
//
// This module prepares ranking-weight recommendations from revenue signals.
// It does not mutate production ranking. Runtime callers must treat the report
// as review-only unless readiness gates and feature flags explicitly allow it.

import { computeRevenueScores } from '@/lib/revenue-score'
import { getRevenueSummary, type RevenueRow } from '@/lib/revenue-data'

export type AiExecutionMode = 'disabled' | 'waiting_for_baseline' | 'dry_run_ready' | 'active_ready'

export interface AiRevenueWeightingThresholds {
  minClicks: number
  minConversions: number
  minRevenueDays: number
}

export interface AiRevenueWeightingConfig {
  enabled: boolean
  dryRun: boolean
  thresholds: AiRevenueWeightingThresholds
}

export interface AiRevenueReadiness {
  baselineReady: boolean
  canApply: boolean
  mode: AiExecutionMode
  reasons: string[]
  totals: {
    clicks: number
    conversions: number
    revenueDays: number
  }
  thresholds: AiRevenueWeightingThresholds
}

export interface AiRevenueWeightRecommendation {
  sub_id: string
  revenue_score: number
  current_multiplier: number
  recommended_multiplier: number
  delta: number
  evidence: {
    clicks: number
    conversions: number
    total_commission: number
    conversion_rate_pct: number
    revenue_per_click: number
  }
}

export interface AiRevenueWeightingReport {
  readiness: AiRevenueReadiness
  recommendations: AiRevenueWeightRecommendation[]
  generated_at: string
}

const DEFAULT_THRESHOLDS: AiRevenueWeightingThresholds = {
  minClicks:      1000,
  minConversions: 30,
  minRevenueDays: 7,
}

function parseBooleanEnv(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback
  return value.trim().toLowerCase() === 'true'
}

function parsePositiveIntEnv(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export function getAiRevenueWeightingConfig(env: Record<string, string | undefined> = process.env): AiRevenueWeightingConfig {
  return {
    enabled: parseBooleanEnv(env.AI_OPTIMIZATION_ENABLED, false),
    dryRun:  parseBooleanEnv(env.AI_DRY_RUN, true),
    thresholds: {
      minClicks:      parsePositiveIntEnv(env.AI_MIN_CLICKS, DEFAULT_THRESHOLDS.minClicks),
      minConversions: parsePositiveIntEnv(env.AI_MIN_CONVERSIONS, DEFAULT_THRESHOLDS.minConversions),
      minRevenueDays: parsePositiveIntEnv(env.AI_MIN_REVENUE_DAYS, DEFAULT_THRESHOLDS.minRevenueDays),
    },
  }
}

function countRevenueDays(rows: RevenueRow[]): number {
  const days = new Set<string>()

  for (const row of rows) {
    if (Number(row.conversion_count) <= 0 || !row.last_click_at) continue
    const day = new Date(row.last_click_at).toISOString().slice(0, 10)
    if (day) days.add(day)
  }

  return days.size
}

export function computeAiRevenueReadiness(
  rows: RevenueRow[],
  config: AiRevenueWeightingConfig = getAiRevenueWeightingConfig(),
): AiRevenueReadiness {
  const totals = {
    clicks:      rows.reduce((sum, row) => sum + Number(row.click_count), 0),
    conversions: rows.reduce((sum, row) => sum + Number(row.conversion_count), 0),
    revenueDays: countRevenueDays(rows),
  }

  const reasons: string[] = []

  if (totals.clicks < config.thresholds.minClicks) {
    reasons.push(`Need at least ${config.thresholds.minClicks} clicks; currently ${totals.clicks}.`)
  }
  if (totals.conversions < config.thresholds.minConversions) {
    reasons.push(`Need at least ${config.thresholds.minConversions} conversions; currently ${totals.conversions}.`)
  }
  if (totals.revenueDays < config.thresholds.minRevenueDays) {
    reasons.push(`Need at least ${config.thresholds.minRevenueDays} revenue days; currently ${totals.revenueDays}.`)
  }

  const baselineReady = reasons.length === 0
  let mode: AiExecutionMode = 'waiting_for_baseline'

  if (!config.enabled) {
    mode = 'disabled'
  } else if (!baselineReady) {
    mode = 'waiting_for_baseline'
  } else if (config.dryRun) {
    mode = 'dry_run_ready'
  } else {
    mode = 'active_ready'
  }

  return {
    baselineReady,
    canApply: config.enabled && baselineReady && !config.dryRun,
    mode,
    reasons: baselineReady ? [] : reasons,
    totals,
    thresholds: config.thresholds,
  }
}

function multiplierFromRevenueScore(score: number): number {
  if (score >= 85) return 1.25
  if (score >= 70) return 1.15
  if (score >= 50) return 1.05
  if (score >= 30) return 0.9
  return 0.75
}

export function computeAiRevenueWeightingReport(
  rows: RevenueRow[],
  config: AiRevenueWeightingConfig = getAiRevenueWeightingConfig(),
): AiRevenueWeightingReport {
  const scoreMap = new Map(computeRevenueScores(rows).map(score => [score.sub_id, score]))
  const readiness = computeAiRevenueReadiness(rows, config)

  const recommendations = rows
    .filter(row => Number(row.click_count) > 0)
    .map((row): AiRevenueWeightRecommendation => {
      const score = scoreMap.get(row.sub_id)
      const revenueScore = score?.score ?? 0
      const currentMultiplier = 1
      const recommendedMultiplier = multiplierFromRevenueScore(revenueScore)

      return {
        sub_id:                 row.sub_id,
        revenue_score:          revenueScore,
        current_multiplier:     currentMultiplier,
        recommended_multiplier: recommendedMultiplier,
        delta:                  Number((recommendedMultiplier - currentMultiplier).toFixed(2)),
        evidence: {
          clicks:              Number(row.click_count),
          conversions:         Number(row.conversion_count),
          total_commission:    Number(row.total_commission),
          conversion_rate_pct: Number(row.conversion_rate_pct),
          revenue_per_click:   Number(row.click_count) > 0
            ? Number((Number(row.total_commission) / Number(row.click_count)).toFixed(4))
            : 0,
        },
      }
    })
    .sort((a, b) => b.revenue_score - a.revenue_score || b.evidence.total_commission - a.evidence.total_commission)

  return {
    readiness,
    recommendations,
    generated_at: new Date().toISOString(),
  }
}

export async function getAiRevenueWeightingReport(): Promise<AiRevenueWeightingReport> {
  const summary = await getRevenueSummary()
  return computeAiRevenueWeightingReport(summary.rows)
}
