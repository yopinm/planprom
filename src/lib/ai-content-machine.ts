// TASK 6.4 - Content Machine Scaling & Queue Management (dormant / dry-run)
//
// Builds a review-only content queue from SEO/deal/revenue signals.
// It does not publish pages, write content, or mutate route registries.

import type { PseoPageType } from './pseo-generator'

export type AiContentMode = 'disabled' | 'waiting_for_baseline' | 'dry_run_ready' | 'active_ready'
export type AiContentQueueAction = 'create' | 'refresh' | 'defer'

export interface AiContentThresholds {
  minCandidates: number
  minSignalRows: number
}

export interface AiContentConfig {
  enabled: boolean
  dryRun: boolean
  thresholds: AiContentThresholds
}

export interface AiContentCandidate {
  id: string
  path: string
  pageType: PseoPageType
  title: string
  platform?: string | null
  category?: string | null
  exists: boolean
  lastUpdatedAt?: string | null
}

export interface AiContentSignal {
  candidateId: string
  searchImpressions: number
  clicks: number
  conversions: number
  revenue: number
  contentGapScore: number
}

export interface AiContentQueueItem {
  candidate: AiContentCandidate
  action: AiContentQueueAction
  priorityScore: number
  demandScore: number
  revenueScore: number
  conversionScore: number
  freshnessScore: number
  contentGapScore: number
  reasons: string[]
}

export interface AiContentReadiness {
  baselineReady: boolean
  canApply: boolean
  mode: AiContentMode
  reasons: string[]
  totals: {
    candidates: number
    signalRows: number
  }
  thresholds: AiContentThresholds
}

export interface AiContentQueueReport {
  readiness: AiContentReadiness
  items: AiContentQueueItem[]
  generatedAt: string
}

export interface AiContentQueueInput {
  candidates: AiContentCandidate[]
  signals: AiContentSignal[]
  config?: AiContentConfig
  now?: Date
}

const DEFAULT_THRESHOLDS: AiContentThresholds = {
  minCandidates: 3,
  minSignalRows: 3,
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

export function getAiContentConfig(env: Record<string, string | undefined> = process.env): AiContentConfig {
  return {
    enabled: parseBooleanEnv(env.AI_CONTENT_MACHINE_ENABLED, false),
    dryRun:  parseBooleanEnv(env.AI_CONTENT_MACHINE_DRY_RUN, true),
    thresholds: {
      minCandidates: parsePositiveIntEnv(env.AI_CONTENT_MIN_CANDIDATES, DEFAULT_THRESHOLDS.minCandidates),
      minSignalRows: parsePositiveIntEnv(env.AI_CONTENT_MIN_SIGNAL_ROWS, DEFAULT_THRESHOLDS.minSignalRows),
    },
  }
}

export function computeAiContentReadiness(
  candidates: AiContentCandidate[],
  signals: AiContentSignal[],
  config: AiContentConfig = getAiContentConfig(),
): AiContentReadiness {
  const totals = {
    candidates: candidates.length,
    signalRows: signals.length,
  }

  const reasons: string[] = []

  if (totals.candidates < config.thresholds.minCandidates) {
    reasons.push(`Need at least ${config.thresholds.minCandidates} content candidates; currently ${totals.candidates}.`)
  }
  if (totals.signalRows < config.thresholds.minSignalRows) {
    reasons.push(`Need at least ${config.thresholds.minSignalRows} signal rows; currently ${totals.signalRows}.`)
  }

  const baselineReady = reasons.length === 0
  let mode: AiContentMode = 'waiting_for_baseline'

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

function daysSince(dateStr: string | null | undefined, now: Date): number {
  if (!dateStr) return 365
  const ms = now.getTime() - new Date(dateStr).getTime()
  if (!Number.isFinite(ms) || ms < 0) return 0
  return Math.floor(ms / 86_400_000)
}

function normalize(value: number, max: number): number {
  if (max <= 0) return 0
  return value / max
}

function actionFor(candidate: AiContentCandidate, freshnessScore: number, priorityScore: number): AiContentQueueAction {
  if (!candidate.exists) return 'create'
  if (freshnessScore >= 60 && priorityScore >= 45) return 'refresh'
  return 'defer'
}

function buildReasons(item: Omit<AiContentQueueItem, 'reasons'>): string[] {
  const reasons: string[] = []
  if (!item.candidate.exists) reasons.push('new content opportunity')
  if (item.demandScore >= 70) reasons.push('high search demand')
  if (item.revenueScore >= 70) reasons.push('strong revenue signal')
  if (item.conversionScore >= 70) reasons.push('high conversion signal')
  if (item.freshnessScore >= 70) reasons.push('content is stale')
  if (item.contentGapScore >= 70) reasons.push('large content gap')
  if (reasons.length === 0) reasons.push('low-priority backlog item')
  return reasons
}

export function generateAiContentQueueReport(input: AiContentQueueInput): AiContentQueueReport {
  const config = input.config ?? getAiContentConfig()
  const now = input.now ?? new Date()
  const readiness = computeAiContentReadiness(input.candidates, input.signals, config)
  const signalMap = new Map(input.signals.map(signal => [signal.candidateId, signal]))
  const maxImpressions = Math.max(...input.signals.map(signal => signal.searchImpressions), 0)
  const maxRevenue = Math.max(...input.signals.map(signal => signal.revenue), 0)
  const maxConversionRate = Math.max(
    ...input.signals.map(signal => signal.clicks > 0 ? signal.conversions / signal.clicks : 0),
    0,
  )

  const items = input.candidates
    .map((candidate): AiContentQueueItem => {
      const signal = signalMap.get(candidate.id)
      const conversionRate = signal && signal.clicks > 0 ? signal.conversions / signal.clicks : 0
      const demandScore = clampScore(normalize(signal?.searchImpressions ?? 0, maxImpressions) * 100)
      const revenueScore = clampScore(normalize(signal?.revenue ?? 0, maxRevenue) * 100)
      const conversionScore = clampScore(normalize(conversionRate, maxConversionRate) * 100)
      const freshnessScore = clampScore(Math.min(1, daysSince(candidate.lastUpdatedAt, now) / 90) * 100)
      const contentGapScore = clampScore(signal?.contentGapScore ?? (candidate.exists ? 20 : 80))
      const priorityScore = clampScore(
        demandScore * 0.30 +
        revenueScore * 0.25 +
        conversionScore * 0.20 +
        freshnessScore * 0.15 +
        contentGapScore * 0.10,
      )

      const base = {
        candidate,
        action: actionFor(candidate, freshnessScore, priorityScore),
        priorityScore,
        demandScore,
        revenueScore,
        conversionScore,
        freshnessScore,
        contentGapScore,
      }

      return { ...base, reasons: buildReasons(base) }
    })
    .sort((a, b) =>
      b.priorityScore - a.priorityScore ||
      Number(a.candidate.exists) - Number(b.candidate.exists) ||
      a.candidate.path.localeCompare(b.candidate.path),
    )

  return {
    readiness,
    items,
    generatedAt: new Date().toISOString(),
  }
}
