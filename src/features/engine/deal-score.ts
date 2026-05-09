// src/features/engine/deal-score.ts
// TASK 2.4 — AI Deal Score
// TASK 2.5 — Reliability Score
//
// Standalone, absolute deal score per product.
// Unlike ranking-engine.ts (which scores relative within a search-result set),
// this module computes an absolute 0-100 score using:
//   - Price vs 30-day Moving Average (when price_history is available)
//   - Rating, sold_count, discount, store_type
//
// Output is persisted to rare_item_scores.deal_score by the cron job.
//
// Reuses scoring helpers from ranking-engine to stay consistent.

import { scoreRating, scoreSold, scoreStore } from './ranking-engine'
import type { DealLabel } from './ranking-engine'
import type { Product } from '@/types'

// Re-export DealLabel so callers don't need to import ranking-engine
export type { DealLabel }

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AIDealScoreBreakdown {
  /** Price score based on moving-avg comparison (or discount if no history) */
  price: number
  rating: number
  sold: number
  discount: number
  store: number
}

export interface AIDealScore {
  /** Absolute composite score 0–100 */
  score: number
  label: DealLabel
  /** Percentage below 30-day moving average (positive = cheaper than avg, negative = more expensive) */
  priceDrop: number
  /** Whether price_history was available for this calculation */
  hasHistory: boolean
  breakdown: AIDealScoreBreakdown
}

// ---------------------------------------------------------------------------
// Reliability Score types (TASK 2.5)
// ---------------------------------------------------------------------------

export interface ReliabilityFlags {
  /** Discount > 80% of original price — suspiciously high (escalate to TASK 4.4) */
  suspiciousDiscount: boolean
  /** Rating < 4.0 or null — quality warning */
  lowRating: boolean
  /** sold_count < 10 — insufficient social proof */
  lowSoldCount: boolean
}

export interface ReliabilityResult {
  /** Reliability score 0–100 */
  score: number
  /**
   * Merchant Trust Filter:
   * true  = passes (!suspiciousDiscount AND sold >= 10 AND (rating >= 4.5 OR (no rating AND sold >= 50)))
   * false = filtered out from deal/rare scoring
   */
  trustworthy: boolean
  flags: ReliabilityFlags
  /** Thai-language warnings ready for UI/logging */
  warnings: string[]
}

// ---------------------------------------------------------------------------
// Reliability thresholds
// ---------------------------------------------------------------------------

const RELIABILITY = {
  SUSPICIOUS_DISCOUNT_THRESHOLD: 0.80, // >80% off original → flag
  LOW_RATING_THRESHOLD:          4.0,  // rating < 4.0 → warning
  LOW_SOLD_THRESHOLD:            10,   // sold_count < 10 → warning
  TRUST_FILTER_MIN_RATING:       4.5,  // Merchant Trust Filter gate (when rating available)
  TRUST_FILTER_MIN_SOLD:         10,
  // Lazada/feed sources don't return ratings — allow through with higher sold bar
  TRUST_FILTER_NO_RATING_MIN_SOLD: 50,
} as const

// ---------------------------------------------------------------------------
// Reliability Score calculation (TASK 2.5)
// ---------------------------------------------------------------------------

/**
 * Calculate the Reliability Score for a product.
 *
 * - official store → bonus +20
 * - mall store     → bonus +10
 * - suspiciousDiscount → penalty -30 (>80% off)
 * - lowRating      → penalty -20 (rating < 4.0)
 * - lowSoldCount   → penalty -10 (sold_count < 10)
 *
 * Clamped to 0–100.  Base score: 50.
 */
export function calculateReliabilityScore(product: Product): ReliabilityResult {
  const { price_current, price_original, rating, sold_count, shop_type } = product

  // --- Flags ---
  const discountPct =
    price_original && price_original > 0 && price_original > price_current
      ? (price_original - price_current) / price_original
      : 0

  const flags: ReliabilityFlags = {
    suspiciousDiscount: discountPct > RELIABILITY.SUSPICIOUS_DISCOUNT_THRESHOLD,
    lowRating:          rating === null || rating < RELIABILITY.LOW_RATING_THRESHOLD,
    lowSoldCount:       sold_count < RELIABILITY.LOW_SOLD_THRESHOLD,
  }

  // --- Warnings (Thai) ---
  const warnings: string[] = []
  if (flags.suspiciousDiscount)
    warnings.push(`ส่วนลด ${Math.round(discountPct * 100)}% สูงผิดปกติ — ตรวจสอบราคาเพิ่มเติม`)
  if (flags.lowRating)
    warnings.push(rating === null ? 'ยังไม่มีคะแนนรีวิว' : `คะแนนรีวิวต่ำ (${rating.toFixed(1)})`)
  if (flags.lowSoldCount)
    warnings.push(`ยอดขายน้อย (${sold_count} ชิ้น) — ข้อมูลไม่เพียงพอ`)

  // --- Store bonus ---
  const storeBonus = shop_type === 'official' ? 20 : shop_type === 'mall' ? 10 : 0

  // --- Score ---
  let score = 50 + storeBonus
  if (flags.suspiciousDiscount) score -= 30
  if (flags.lowRating)          score -= 20
  if (flags.lowSoldCount)       score -= 10

  score = Math.min(100, Math.max(0, score))

  // --- Merchant Trust Filter ---
  // Feed-sourced products (Lazada affiliate feed) don't include ratings.
  // Allow through with higher sold_count bar (50) as proxy for quality.
  const ratingOk = rating !== null
    ? rating >= RELIABILITY.TRUST_FILTER_MIN_RATING
    : sold_count >= RELIABILITY.TRUST_FILTER_NO_RATING_MIN_SOLD

  const trustworthy =
    !flags.suspiciousDiscount &&
    sold_count >= RELIABILITY.TRUST_FILTER_MIN_SOLD &&
    ratingOk

  return { score, trustworthy, flags, warnings }
}

/**
 * Convenience helper — returns true when a product passes the Merchant Trust
 * Filter and should be included in Rare Item scoring.
 *
 * Equivalent to `calculateReliabilityScore(product).trustworthy`.
 */
export function passesMerchantTrustFilter(product: Product): boolean {
  return calculateReliabilityScore(product).trustworthy
}

// ---------------------------------------------------------------------------
// Weights
// ---------------------------------------------------------------------------

const WEIGHTS = {
  price:    0.40,
  rating:   0.25,
  sold:     0.15,
  discount: 0.10,
  store:    0.10,
} as const

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert a price drop fraction to a 0–100 score.
 * drop = (avg - current) / avg
 *   drop ≥  0.50 → 100 (price ≥50% below avg)
 *   drop =  0.00 → 50  (price equals avg)
 *   drop = -0.50 → 0   (price 50% above avg)
 */
function priceDropToScore(drop: number): number {
  const clamped = Math.max(-0.5, Math.min(0.5, drop))
  return Math.round((clamped + 0.5) * 100)
}

/**
 * Absolute discount score from price_original.
 * 0% discount → 0, 25% → 50, ≥50% → 100
 */
function absoluteDiscountScore(originalPrice: number | null, currentPrice: number): number {
  if (!originalPrice || originalPrice <= 0 || originalPrice <= currentPrice) return 0
  const pct = (originalPrice - currentPrice) / originalPrice
  return Math.min(100, Math.round(pct * 200)) // *200 so 50% = 100
}

/** total 0–100 → DealLabel (TASK 2.4 thresholds: 75/50) */
export function aiLabelFromScore(score: number): DealLabel {
  if (score >= 75) return 'Best Value'
  if (score >= 50) return 'Good Deal'
  return 'Fair Deal'
}

// ---------------------------------------------------------------------------
// Main calculation
// ---------------------------------------------------------------------------

/**
 * Calculate an absolute AI Deal Score for a single product.
 *
 * @param product       - Product row from DB
 * @param movingAvg30d  - 30-day moving average price from price_history (optional)
 */
export function calculateAIDealScore(
  product: Product,
  movingAvg30d?: number,
): AIDealScore {
  const { price_current, price_original, rating, sold_count, shop_type } = product

  // Price component — use historical moving avg if available, else discount
  let priceScore: number
  let priceDrop = 0
  const hasHistory = movingAvg30d !== undefined && movingAvg30d > 0

  if (hasHistory) {
    priceDrop = (movingAvg30d! - price_current) / movingAvg30d!
    priceScore = priceDropToScore(priceDrop)
  } else if (price_original !== null) {
    priceScore = absoluteDiscountScore(price_original, price_current)
  } else {
    // No price history and no original price — neutral 50 (unknown, not pessimistic 0)
    priceScore = 50
  }

  const breakdown: AIDealScoreBreakdown = {
    price:    priceScore,
    rating:   scoreRating(rating),
    sold:     scoreSold(sold_count),
    discount: absoluteDiscountScore(price_original, price_current),
    store:    scoreStore(shop_type),
  }

  const score = Math.round(
    breakdown.price    * WEIGHTS.price +
    breakdown.rating   * WEIGHTS.rating +
    breakdown.sold     * WEIGHTS.sold +
    breakdown.discount * WEIGHTS.discount +
    breakdown.store    * WEIGHTS.store,
  )

  return {
    score:      Math.min(100, Math.max(0, score)),
    label:      aiLabelFromScore(score),
    priceDrop:  Math.round(priceDrop * 100 * 10) / 10, // percent, 1 decimal
    hasHistory,
    breakdown,
  }
}
