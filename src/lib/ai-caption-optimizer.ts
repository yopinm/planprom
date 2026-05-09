// TASK 6.2 - AI Caption Generator v2 (dormant / dry-run)
//
// This module chooses caption templates from observed Facebook performance.
// It is review-only by default and never publishes or writes facebook_posts.

import { type CaptionResult, type TemplateType } from './caption-engine'
import { generateRevenueCaption, type RevenueCaptionInput } from './revenue-caption-engine'
import { runFullGuardrail, type GuardrailOptions, type GuardrailResult } from './content-guardrail'

export type AiCaptionMode = 'disabled' | 'waiting_for_baseline' | 'dry_run_ready' | 'active_ready'

export interface AiCaptionThresholds {
  minPosts: number
  minImpressions: number
  minClicks: number
}

export interface AiCaptionConfig {
  enabled: boolean
  dryRun: boolean
  thresholds: AiCaptionThresholds
}

export interface AiCaptionTemplateMetric {
  templateType: TemplateType
  postCount: number
  impressions: number
  clicks: number
  conversions: number
  revenue: number
}

export interface AiCaptionTemplateScore {
  templateType: TemplateType
  score: number
  ctr: number
  cvr: number
  revenuePerClick: number
  confidence: number
  evidence: AiCaptionTemplateMetric
}

export interface AiCaptionReadiness {
  baselineReady: boolean
  canApply: boolean
  mode: AiCaptionMode
  reasons: string[]
  totals: {
    posts: number
    impressions: number
    clicks: number
  }
  thresholds: AiCaptionThresholds
}

export interface AiCaptionVariant {
  role: 'selected' | 'challenger'
  templateType: TemplateType
  caption: CaptionResult
  guardrail: {
    short: GuardrailResult
    long: GuardrailResult
  }
}

export interface AiCaptionOptimizationReport {
  readiness: AiCaptionReadiness
  templateScores: AiCaptionTemplateScore[]
  selectedTemplate: TemplateType
  challengerTemplate: TemplateType | null
  variants: AiCaptionVariant[]
  generatedAt: string
}

export interface AiCaptionOptimizationInput extends RevenueCaptionInput {
  metrics: AiCaptionTemplateMetric[]
  config?: AiCaptionConfig
  guardrailOptions?: GuardrailOptions
}

const DEFAULT_THRESHOLDS: AiCaptionThresholds = {
  minPosts:       5,
  minImpressions: 500,
  minClicks:      30,
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

export function getAiCaptionConfig(env: Record<string, string | undefined> = process.env): AiCaptionConfig {
  return {
    enabled: parseBooleanEnv(env.AI_CAPTION_OPTIMIZATION_ENABLED, false),
    dryRun:  parseBooleanEnv(env.AI_CAPTION_DRY_RUN, true),
    thresholds: {
      minPosts:       parsePositiveIntEnv(env.AI_CAPTION_MIN_POSTS, DEFAULT_THRESHOLDS.minPosts),
      minImpressions: parsePositiveIntEnv(env.AI_CAPTION_MIN_IMPRESSIONS, DEFAULT_THRESHOLDS.minImpressions),
      minClicks:      parsePositiveIntEnv(env.AI_CAPTION_MIN_CLICKS, DEFAULT_THRESHOLDS.minClicks),
    },
  }
}

export function computeAiCaptionReadiness(
  metrics: AiCaptionTemplateMetric[],
  config: AiCaptionConfig = getAiCaptionConfig(),
): AiCaptionReadiness {
  const totals = {
    posts:       metrics.reduce((sum, row) => sum + Number(row.postCount), 0),
    impressions: metrics.reduce((sum, row) => sum + Number(row.impressions), 0),
    clicks:      metrics.reduce((sum, row) => sum + Number(row.clicks), 0),
  }

  const reasons: string[] = []

  if (totals.posts < config.thresholds.minPosts) {
    reasons.push(`Need at least ${config.thresholds.minPosts} posts; currently ${totals.posts}.`)
  }
  if (totals.impressions < config.thresholds.minImpressions) {
    reasons.push(`Need at least ${config.thresholds.minImpressions} impressions; currently ${totals.impressions}.`)
  }
  if (totals.clicks < config.thresholds.minClicks) {
    reasons.push(`Need at least ${config.thresholds.minClicks} clicks; currently ${totals.clicks}.`)
  }

  const baselineReady = reasons.length === 0
  let mode: AiCaptionMode = 'waiting_for_baseline'

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

function safeRate(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0
  return numerator / denominator
}

function normalize(value: number, max: number): number {
  if (max <= 0) return 0
  return value / max
}

function round4(value: number): number {
  return Number(value.toFixed(4))
}

function roundScore(value: number): number {
  return Math.round(Math.min(100, Math.max(0, value)))
}

export function scoreAiCaptionTemplates(
  metrics: AiCaptionTemplateMetric[],
  config: AiCaptionConfig = getAiCaptionConfig(),
): AiCaptionTemplateScore[] {
  const maxCtr = Math.max(...metrics.map(row => safeRate(row.clicks, row.impressions)), 0)
  const maxCvr = Math.max(...metrics.map(row => safeRate(row.conversions, row.clicks)), 0)
  const maxRpc = Math.max(...metrics.map(row => safeRate(row.revenue, row.clicks)), 0)

  return metrics
    .map((row): AiCaptionTemplateScore => {
      const ctr = safeRate(row.clicks, row.impressions)
      const cvr = safeRate(row.conversions, row.clicks)
      const revenuePerClick = safeRate(row.revenue, row.clicks)
      const confidence = Math.min(1, row.impressions / config.thresholds.minImpressions)
      const score = roundScore(
        normalize(ctr, maxCtr) * 40 +
        normalize(cvr, maxCvr) * 30 +
        normalize(revenuePerClick, maxRpc) * 20 +
        confidence * 10,
      )

      return {
        templateType: row.templateType,
        score,
        ctr: round4(ctr),
        cvr: round4(cvr),
        revenuePerClick: round4(revenuePerClick),
        confidence: round4(confidence),
        evidence: row,
      }
    })
    .sort((a, b) =>
      b.score - a.score ||
      b.evidence.impressions - a.evidence.impressions ||
      a.templateType.localeCompare(b.templateType),
    )
}

function buildVariant(
  role: AiCaptionVariant['role'],
  input: RevenueCaptionInput,
  templateType: TemplateType,
  guardrailOptions: GuardrailOptions,
): AiCaptionVariant {
  const caption = generateRevenueCaption({ ...input, templateType })
  return {
    role,
    templateType,
    caption,
    guardrail: {
      short: runFullGuardrail(caption.short, guardrailOptions),
      long:  runFullGuardrail(caption.long, guardrailOptions),
    },
  }
}

export function generateAiCaptionOptimizationReport(
  input: AiCaptionOptimizationInput,
): AiCaptionOptimizationReport {
  const config = input.config ?? getAiCaptionConfig()
  const readiness = computeAiCaptionReadiness(input.metrics, config)
  const templateScores = scoreAiCaptionTemplates(input.metrics, config)
  const fallbackCaption = generateRevenueCaption(input)
  const selectedTemplate = readiness.baselineReady && templateScores[0]
    ? templateScores[0].templateType
    : fallbackCaption.templateType
  const challengerTemplate = templateScores.find(row => row.templateType !== selectedTemplate)?.templateType ?? null

  const variants: AiCaptionVariant[] = [
    buildVariant('selected', input, selectedTemplate, input.guardrailOptions ?? {}),
  ]

  if (challengerTemplate) {
    variants.push(buildVariant('challenger', input, challengerTemplate, input.guardrailOptions ?? {}))
  }

  return {
    readiness,
    templateScores,
    selectedTemplate,
    challengerTemplate,
    variants,
    generatedAt: new Date().toISOString(),
  }
}
