// SEC-AI-BASELINE-GATE-1
// Unified security gate for all Phase 6 AI modules.
// Calls each module's readiness function with zero baseline data to prove
// AI automation cannot fire without explicit env flags + real traffic signals.
//
// allSafe = true  →  every module has canApply: false  →  system is dormant
// allSafe = false →  at least one module could execute  →  security incident

import {
  computeAiRevenueReadiness,
  getAiRevenueWeightingConfig,
} from './ai-revenue-weighting'
import {
  computeAiCaptionReadiness,
  getAiCaptionConfig,
} from './ai-caption-optimizer'
import {
  computeAiMatchingReadiness,
  getAiMatchingConfig,
} from './ai-matching-engine'
import {
  computeAiContentReadiness,
  getAiContentConfig,
} from './ai-content-machine'
import {
  computeAiDatabaseLeanReadiness,
  getAiDatabaseLeanConfig,
} from './ai-database-lean'

export type AiModuleName =
  | 'revenue_weighting'
  | 'caption_optimizer'
  | 'matching_engine'
  | 'content_machine'
  | 'database_lean'

export interface AiModuleGateStatus {
  module:   AiModuleName
  canApply: boolean
  mode:     string
  reasons:  string[]
}

export interface AiBaselineGateStatus {
  /** true when every module has canApply: false — system is fully dormant */
  allSafe:    boolean
  modules:    AiModuleGateStatus[]
  checked_at: string
}

/**
 * Evaluates each AI module against zero baseline data using the current env config.
 * Pass a custom `env` to test specific flag combinations.
 */
export function computeAiBaselineGateStatus(
  env: Record<string, string | undefined> = process.env,
): AiBaselineGateStatus {
  const revenue  = computeAiRevenueReadiness([], getAiRevenueWeightingConfig(env))
  const caption  = computeAiCaptionReadiness([], getAiCaptionConfig(env))
  const matching = computeAiMatchingReadiness([], [], getAiMatchingConfig(env))
  const content  = computeAiContentReadiness([], [], getAiContentConfig(env))
  const dbLean   = computeAiDatabaseLeanReadiness([], getAiDatabaseLeanConfig(env))

  const modules: AiModuleGateStatus[] = [
    { module: 'revenue_weighting', canApply: revenue.canApply,  mode: revenue.mode,  reasons: revenue.reasons  },
    { module: 'caption_optimizer', canApply: caption.canApply,  mode: caption.mode,  reasons: caption.reasons  },
    { module: 'matching_engine',   canApply: matching.canApply, mode: matching.mode, reasons: matching.reasons },
    { module: 'content_machine',   canApply: content.canApply,  mode: content.mode,  reasons: content.reasons  },
    { module: 'database_lean',     canApply: dbLean.canApply,   mode: dbLean.mode,   reasons: dbLean.reasons   },
  ]

  return {
    allSafe:    modules.every((m) => !m.canApply),
    modules,
    checked_at: new Date().toISOString(),
  }
}
