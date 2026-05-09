// Feedback Loop Logic — TASK 4.12
//
// Reads revenue attribution data (TASK 4.11) and computes a weight multiplier
// for each sub_id context. These weights are "manual" — reported for admin
// review, not auto-applied to the ranking engine.
//
// Multiplier scale: 0.5 (underperforming) … 1.0 (baseline) … 2.0 (top earner)
// Context groups: search | compare | product | landing | rare | admin
//
// Feeds: TASK 4.13 (Revenue Scoring API), TASK 4.14 (Revenue Dashboard)

import type { SubIdContext } from '@/lib/sub-id'
import type { RevenueRow } from '@/lib/revenue-data'
import { getRevenueSummary } from '@/lib/revenue-data'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ContextEvidence {
  clicks:       number
  conversions:  number
  commission:   number
  sub_ids:      string[]   // individual sub_ids in this group
}

export interface ContextWeight {
  context:     SubIdContext
  multiplier:  number        // 0.5–2.0
  evidence:    ContextEvidence
}

export interface FeedbackWeights {
  weights:       ContextWeight[]
  baseline_cpc:  number        // commission-per-click across all contexts
  generated_at:  string
}

// ---------------------------------------------------------------------------
// Context prefix → SubIdContext
// ---------------------------------------------------------------------------

const CONTEXT_PREFIXES: [string, SubIdContext][] = [
  ['search_',  'search'],
  ['compare_', 'compare'],
  ['product_', 'product'],
  ['landing_', 'landing'],
  ['rare_',    'rare'],
  ['admin_',   'admin'],
]

function extractContext(subId: string): SubIdContext | null {
  for (const [prefix, ctx] of CONTEXT_PREFIXES) {
    if (subId.startsWith(prefix)) return ctx
  }
  return null
}

// ---------------------------------------------------------------------------
// Core computation (pure — no I/O)
// ---------------------------------------------------------------------------

/**
 * Compute per-context weight multipliers from revenue rows.
 *
 * Algorithm:
 *   1. Group rows by context prefix
 *   2. Compute commission-per-click (CPC) for each group
 *   3. Normalize against baseline CPC → raw multiplier
 *   4. Clamp to [0.5, 2.0] — prevents extreme swings with sparse data
 */
export function computeContextWeights(rows: RevenueRow[]): FeedbackWeights {
  // Group by context
  const groups = new Map<SubIdContext, ContextEvidence>()

  for (const row of rows) {
    const ctx = extractContext(row.sub_id)
    if (!ctx || ctx === 'admin') continue   // skip admin — never revenue-bearing

    const existing = groups.get(ctx) ?? { clicks: 0, conversions: 0, commission: 0, sub_ids: [] }
    groups.set(ctx, {
      clicks:      existing.clicks      + Number(row.click_count),
      conversions: existing.conversions + Number(row.conversion_count),
      commission:  existing.commission  + Number(row.total_commission),
      sub_ids:     [...existing.sub_ids, row.sub_id],
    })
  }

  // Baseline CPC across all revenue-bearing contexts
  let totalClicks     = 0
  let totalCommission = 0
  for (const ev of groups.values()) {
    totalClicks     += ev.clicks
    totalCommission += ev.commission
  }
  const baselineCpc = totalClicks > 0 ? totalCommission / totalClicks : 0

  // Build weight per context
  const weights: ContextWeight[] = []
  const allContexts: SubIdContext[] = ['search', 'compare', 'product', 'landing', 'rare']

  for (const ctx of allContexts) {
    const ev = groups.get(ctx) ?? { clicks: 0, conversions: 0, commission: 0, sub_ids: [] }

    let multiplier = 1.0
    if (ev.clicks > 0 && baselineCpc > 0) {
      const cpc = ev.commission / ev.clicks
      multiplier = cpc / baselineCpc
    }

    // Clamp to [0.5, 2.0]
    multiplier = Math.max(0.5, Math.min(2.0, parseFloat(multiplier.toFixed(3))))

    weights.push({ context: ctx, multiplier, evidence: ev })
  }

  // Sort by multiplier desc
  weights.sort((a, b) => b.multiplier - a.multiplier)

  return {
    weights,
    baseline_cpc: parseFloat(baselineCpc.toFixed(4)),
    generated_at: new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Async entry point
// ---------------------------------------------------------------------------

/**
 * Fetch revenue data and compute context weights in one call.
 * Returns all-time weights — no date filtering at this layer.
 */
export async function getContextWeights(): Promise<FeedbackWeights> {
  const summary = await getRevenueSummary()
  return computeContextWeights(summary.rows)
}
