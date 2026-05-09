// Revenue Scoring API v1 — TASK 4.13
//
// Scores each sub_id 0–100 based on two signals:
//   conv_score  (50%) — conversion rate normalised: 10% CR → 100
//   comm_score  (50%) — commission-per-click normalised against dataset max
//
// sub_ids with zero clicks score 0.
// Feeds: TASK 4.14 (Revenue Dashboard), TASK 6.1 (AI Adjustment)

import type { RevenueRow } from '@/lib/revenue-data'
import { getRevenueSummary } from '@/lib/revenue-data'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RevenueScore {
  sub_id:          string
  score:           number    // 0–100
  conv_score:      number    // conversion-rate component (0–100)
  comm_score:      number    // commission-per-click component (0–100)
  clicks:          number
  conversions:     number
  total_commission: number
}

export interface RevenueScoreReport {
  scores:        RevenueScore[]
  generated_at:  string
}

// ---------------------------------------------------------------------------
// Pure scoring helpers
// ---------------------------------------------------------------------------

/** 10 % conversion rate → score 100; linear, capped */
function convScore(rate: number): number {
  return Math.min(100, Math.round(rate * 10))
}

/** Normalise CPC against dataset max → 0–100 */
function commScore(cpc: number, maxCpc: number): number {
  if (maxCpc <= 0) return 0
  return Math.min(100, Math.round((cpc / maxCpc) * 100))
}

// ---------------------------------------------------------------------------
// Core computation (pure — no I/O)
// ---------------------------------------------------------------------------

/**
 * Score all sub_ids in the provided rows.
 * Rows with zero clicks receive score 0.
 */
export function computeRevenueScores(rows: RevenueRow[]): RevenueScore[] {
  // Pre-compute max CPC for normalisation
  const cpcs = rows.map(r => {
    const clicks = Number(r.click_count)
    return clicks > 0 ? Number(r.total_commission) / clicks : 0
  })
  const maxCpc = Math.max(0, ...cpcs)

  return rows.map((row, i) => {
    const clicks      = Number(row.click_count)
    const conversions = Number(row.conversion_count)
    const commission  = Number(row.total_commission)
    const rate        = Number(row.conversion_rate_pct)
    const cpc         = cpcs[i]

    const cv = convScore(rate)
    const cm = commScore(cpc, maxCpc)
    const score = clicks > 0 ? Math.round(cv * 0.5 + cm * 0.5) : 0

    return {
      sub_id:           row.sub_id,
      score,
      conv_score:       cv,
      comm_score:       cm,
      clicks,
      conversions,
      total_commission: commission,
    }
  }).sort((a, b) => b.score - a.score)
}

// ---------------------------------------------------------------------------
// Async entry point
// ---------------------------------------------------------------------------

/** Fetch revenue data and return scored sub_ids, highest first. */
export async function getRevenueScores(): Promise<RevenueScoreReport> {
  const summary = await getRevenueSummary()
  return {
    scores:       computeRevenueScores(summary.rows),
    generated_at: new Date().toISOString(),
  }
}

/** Score a single sub_id — returns null if not found in the dataset. */
export async function getSubIdScore(subId: string): Promise<RevenueScore | null> {
  const report = await getRevenueScores()
  return report.scores.find(s => s.sub_id === subId) ?? null
}
