// TASK 6.3 - 3-Point Matching Engine (dormant / dry-run)
//
// Produces review-only matching recommendations from user intent, deal quality,
// platform strength, and optional revenue signals. It never mutates ranking.

import type { ParsedIntent, Platform } from '@/types'
import type { RankedResult } from '@/features/engine/ranking-engine'

export type AiMatchingMode = 'disabled' | 'waiting_for_baseline' | 'dry_run_ready' | 'active_ready'

export interface AiMatchingThresholds {
  minCandidates: number
  minRevenueSignals: number
}

export interface AiMatchingConfig {
  enabled: boolean
  dryRun: boolean
  thresholds: AiMatchingThresholds
}

export interface PlatformStrengthSignal {
  platform: Platform
  clicks: number
  conversions: number
  revenue: number
}

export interface AiMatchedResult {
  result: RankedResult
  matchScore: number
  intentScore: number
  dealQualityScore: number
  platformStrengthScore: number
  revenueScore: number
  reasons: string[]
}

export interface AiMatchingReadiness {
  baselineReady: boolean
  canApply: boolean
  mode: AiMatchingMode
  reasons: string[]
  totals: {
    candidates: number
    revenueSignals: number
  }
  thresholds: AiMatchingThresholds
}

export interface AiMatchingReport {
  readiness: AiMatchingReadiness
  matches: AiMatchedResult[]
  generatedAt: string
}

export interface AiMatchingInput {
  intent: ParsedIntent
  results: RankedResult[]
  platformSignals?: PlatformStrengthSignal[]
  config?: AiMatchingConfig
}

const DEFAULT_THRESHOLDS: AiMatchingThresholds = {
  minCandidates:      2,
  minRevenueSignals:  2,
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

export function getAiMatchingConfig(env: Record<string, string | undefined> = process.env): AiMatchingConfig {
  return {
    enabled: parseBooleanEnv(env.AI_MATCHING_ENABLED, false),
    dryRun:  parseBooleanEnv(env.AI_MATCHING_DRY_RUN, true),
    thresholds: {
      minCandidates:     parsePositiveIntEnv(env.AI_MATCHING_MIN_CANDIDATES, DEFAULT_THRESHOLDS.minCandidates),
      minRevenueSignals: parsePositiveIntEnv(env.AI_MATCHING_MIN_REVENUE_SIGNALS, DEFAULT_THRESHOLDS.minRevenueSignals),
    },
  }
}

export function computeAiMatchingReadiness(
  results: RankedResult[],
  platformSignals: PlatformStrengthSignal[] = [],
  config: AiMatchingConfig = getAiMatchingConfig(),
): AiMatchingReadiness {
  const totals = {
    candidates:      results.length,
    revenueSignals:  platformSignals.filter(signal => signal.clicks > 0 || signal.revenue > 0).length,
  }

  const reasons: string[] = []

  if (totals.candidates < config.thresholds.minCandidates) {
    reasons.push(`Need at least ${config.thresholds.minCandidates} candidates; currently ${totals.candidates}.`)
  }
  if (totals.revenueSignals < config.thresholds.minRevenueSignals) {
    reasons.push(`Need at least ${config.thresholds.minRevenueSignals} platform revenue signals; currently ${totals.revenueSignals}.`)
  }

  const baselineReady = reasons.length === 0
  let mode: AiMatchingMode = 'waiting_for_baseline'

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

function clampScore(value: number): number {
  return Math.round(Math.min(100, Math.max(0, value)))
}

function includesText(haystack: string | null | undefined, needle: string | null | undefined): boolean {
  if (!haystack || !needle) return false
  return haystack.toLowerCase().includes(needle.toLowerCase())
}

export function scoreIntentMatch(intent: ParsedIntent, result: RankedResult): number {
  let score = 40
  const { product } = result

  if (intent.platform) score += intent.platform === product.platform ? 25 : -20
  if (intent.category) score += product.category === intent.category ? 20 : -10
  if (intent.budget !== undefined) score += result.priceResult.effectiveNet <= intent.budget ? 15 : -15
  if (intent.query) {
    if (includesText(product.name, intent.query) || includesText(product.category, intent.query)) score += 20
  }
  if (intent.product_id) score += intent.product_id === product.platform_id || intent.product_id === product.id ? 30 : -20

  return clampScore(score)
}

export function scoreDealQuality(result: RankedResult): number {
  return clampScore(result.dealScore.total)
}

function platformRate(signal: PlatformStrengthSignal): number {
  const cvr = signal.clicks > 0 ? signal.conversions / signal.clicks : 0
  const rpc = signal.clicks > 0 ? signal.revenue / signal.clicks : 0
  return cvr * 70 + rpc * 30
}

export function scorePlatformStrength(
  platform: Platform,
  platformSignals: PlatformStrengthSignal[] = [],
): number {
  if (platformSignals.length === 0) return 50

  const signal = platformSignals.find(row => row.platform === platform)
  if (!signal) return 35

  const maxRate = Math.max(...platformSignals.map(platformRate), 0)
  if (maxRate <= 0) return 50

  return clampScore((platformRate(signal) / maxRate) * 100)
}

export function scoreRevenueSignal(
  platform: Platform,
  platformSignals: PlatformStrengthSignal[] = [],
): number {
  if (platformSignals.length === 0) return 50

  const signal = platformSignals.find(row => row.platform === platform)
  if (!signal) return 35

  const maxRevenue = Math.max(...platformSignals.map(row => row.revenue), 0)
  if (maxRevenue <= 0) return 50

  return clampScore((signal.revenue / maxRevenue) * 100)
}

function buildReasons(match: Omit<AiMatchedResult, 'reasons'>): string[] {
  const reasons: string[] = []
  if (match.intentScore >= 70) reasons.push('intent aligned')
  if (match.dealQualityScore >= 70) reasons.push('strong deal quality')
  if (match.platformStrengthScore >= 70) reasons.push('platform converts well')
  if (match.revenueScore >= 70) reasons.push('strong revenue signal')
  if (reasons.length === 0) reasons.push('baseline candidate')
  return reasons
}

export function generateAiMatchingReport(input: AiMatchingInput): AiMatchingReport {
  const config = input.config ?? getAiMatchingConfig()
  const platformSignals = input.platformSignals ?? []
  const readiness = computeAiMatchingReadiness(input.results, platformSignals, config)

  const matches = input.results
    .map((result): AiMatchedResult => {
      const intentScore = scoreIntentMatch(input.intent, result)
      const dealQualityScore = scoreDealQuality(result)
      const platformStrengthScore = scorePlatformStrength(result.product.platform, platformSignals)
      const revenueScore = scoreRevenueSignal(result.product.platform, platformSignals)
      const matchScore = clampScore(
        intentScore * 0.35 +
        dealQualityScore * 0.35 +
        platformStrengthScore * 0.20 +
        revenueScore * 0.10,
      )
      const base = {
        result,
        matchScore,
        intentScore,
        dealQualityScore,
        platformStrengthScore,
        revenueScore,
      }

      return { ...base, reasons: buildReasons(base) }
    })
    .sort((a, b) =>
      b.matchScore - a.matchScore ||
      b.dealQualityScore - a.dealQualityScore ||
      a.result.priceResult.effectiveNet - b.result.priceResult.effectiveNet,
    )

  return {
    readiness,
    matches,
    generatedAt: new Date().toISOString(),
  }
}
