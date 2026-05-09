// SEC-AI-BASELINE-GATE-1 — acceptance test
//
// Proves that with zero baseline data (empty arrays) or default env config (all flags absent),
// every Phase 6 AI module has canApply: false and cannot execute automation.
//
// This file IS the acceptance gate. If any test here fails, AI execution is no longer safe.

import { describe, expect, it } from 'vitest'
import { computeAiBaselineGateStatus, type AiModuleName } from '@/lib/ai-baseline-gate'

const ALL_MODULES: AiModuleName[] = [
  'revenue_weighting',
  'caption_optimizer',
  'matching_engine',
  'content_machine',
  'database_lean',
]

// ---------------------------------------------------------------------------
// Gate 1: Default env (no flags set) → all modules dormant
// ---------------------------------------------------------------------------

describe('SEC-AI-BASELINE-GATE-1: default env, zero baseline data', () => {
  const status = computeAiBaselineGateStatus({})

  it('allSafe is true — no AI module can execute', () => {
    expect(status.allSafe).toBe(true)
  })

  it('every module reports canApply: false', () => {
    for (const mod of status.modules) {
      expect(mod.canApply, `${mod.module} should not be applicable`).toBe(false)
    }
  })

  it('every module is in a blocked mode (disabled or waiting_for_baseline)', () => {
    for (const mod of status.modules) {
      expect(
        ['disabled', 'waiting_for_baseline'],
        `${mod.module} mode "${mod.mode}" is not a safe blocked mode`,
      ).toContain(mod.mode)
    }
  })

  it('all five modules are checked', () => {
    const names = status.modules.map((m) => m.module).sort()
    expect(names).toEqual([...ALL_MODULES].sort())
  })
})

// ---------------------------------------------------------------------------
// Gate 2: Flags explicitly disabled → all modules dormant
// ---------------------------------------------------------------------------

describe('SEC-AI-BASELINE-GATE-1: all *_ENABLED flags set to false', () => {
  const env: Record<string, string | undefined> = {
    AI_OPTIMIZATION_ENABLED:         'false',
    AI_CAPTION_OPTIMIZATION_ENABLED: 'false',
    AI_MATCHING_ENABLED:             'false',
    AI_CONTENT_MACHINE_ENABLED:      'false',
    AI_DB_LEAN_ENABLED:              'false',
  }
  const status = computeAiBaselineGateStatus(env)

  it('allSafe is true', () => {
    expect(status.allSafe).toBe(true)
  })

  it('every module mode is disabled', () => {
    for (const mod of status.modules) {
      expect(mod.mode, `${mod.module} should be disabled`).toBe('disabled')
    }
  })
})

// ---------------------------------------------------------------------------
// Gate 3: Flags enabled but zero data → waiting_for_baseline, still blocked
// ---------------------------------------------------------------------------

describe('SEC-AI-BASELINE-GATE-1: all *_ENABLED true, dryRun true, zero baseline data', () => {
  const env: Record<string, string | undefined> = {
    AI_OPTIMIZATION_ENABLED:         'true',
    AI_DRY_RUN:                      'true',
    AI_CAPTION_OPTIMIZATION_ENABLED: 'true',
    AI_CAPTION_DRY_RUN:              'true',
    AI_MATCHING_ENABLED:             'true',
    AI_MATCHING_DRY_RUN:             'true',
    AI_CONTENT_MACHINE_ENABLED:      'true',
    AI_CONTENT_MACHINE_DRY_RUN:      'true',
    AI_DB_LEAN_ENABLED:              'true',
    AI_DB_LEAN_DRY_RUN:              'true',
  }
  const status = computeAiBaselineGateStatus(env)

  it('allSafe is true — zero data means baseline thresholds are unmet', () => {
    expect(status.allSafe).toBe(true)
  })

  it('every module reports canApply: false', () => {
    for (const mod of status.modules) {
      expect(mod.canApply, `${mod.module} should not be applicable`).toBe(false)
    }
  })

  it('every module is in waiting_for_baseline (enabled but no data)', () => {
    for (const mod of status.modules) {
      expect(mod.mode, `${mod.module} should be waiting_for_baseline`).toBe('waiting_for_baseline')
    }
  })
})

// ---------------------------------------------------------------------------
// Gate 4: Flags enabled, dryRun false, zero data → still blocked
// ---------------------------------------------------------------------------

describe('SEC-AI-BASELINE-GATE-1: all *_ENABLED true, dryRun false, zero baseline data', () => {
  const env: Record<string, string | undefined> = {
    AI_OPTIMIZATION_ENABLED:         'true',
    AI_DRY_RUN:                      'false',
    AI_CAPTION_OPTIMIZATION_ENABLED: 'true',
    AI_CAPTION_DRY_RUN:              'false',
    AI_MATCHING_ENABLED:             'true',
    AI_MATCHING_DRY_RUN:             'false',
    AI_CONTENT_MACHINE_ENABLED:      'true',
    AI_CONTENT_MACHINE_DRY_RUN:      'false',
    AI_DB_LEAN_ENABLED:              'true',
    AI_DB_LEAN_DRY_RUN:              'false',
  }
  const status = computeAiBaselineGateStatus(env)

  it('allSafe is true — zero baseline data blocks execution even when dryRun is off', () => {
    expect(status.allSafe).toBe(true)
  })

  it('every module remains in waiting_for_baseline despite dryRun=false', () => {
    for (const mod of status.modules) {
      expect(mod.canApply, `${mod.module} must not execute without baseline`).toBe(false)
      expect(mod.mode, `${mod.module} should be waiting_for_baseline`).toBe('waiting_for_baseline')
    }
  })
})

// ---------------------------------------------------------------------------
// Gate 5: Status shape contract
// ---------------------------------------------------------------------------

describe('AiBaselineGateStatus shape', () => {
  const status = computeAiBaselineGateStatus({})

  it('has allSafe, modules, and checked_at', () => {
    expect(status).toHaveProperty('allSafe')
    expect(status).toHaveProperty('modules')
    expect(status).toHaveProperty('checked_at')
  })

  it('checked_at is a valid ISO timestamp', () => {
    expect(() => new Date(status.checked_at)).not.toThrow()
    expect(new Date(status.checked_at).getTime()).toBeGreaterThan(0)
  })

  it('each module entry has required fields', () => {
    for (const mod of status.modules) {
      expect(mod).toHaveProperty('module')
      expect(mod).toHaveProperty('canApply')
      expect(mod).toHaveProperty('mode')
      expect(mod).toHaveProperty('reasons')
      expect(typeof mod.canApply).toBe('boolean')
      expect(Array.isArray(mod.reasons)).toBe(true)
    }
  })
})
