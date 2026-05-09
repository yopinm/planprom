// src/features/engine/rare-item-engine.ts
// TASK 2.9 — Rare Item Engine
//
// Computes three composite scores per product:
//   rare_score  — how exceptional the deal is (discount + rating)
//   trend_score — how strong the demand signal is (sold_count)
//   final_score — weighted composite of deal + rare + trend
//
// Badge assignment (highest-priority first):
//   'rare'          (หายาก)   — rare_score >= 65
//   'ready_to_ship' (พร้อมส่ง) — official/mall + sold_count >= 30
//   'low_stock'     (เหลือน้อย)— rare_score >= 40 (scarcity signal)
//   null                       — does not qualify
//
// Merchant Trust Filter (TASK 2.5) is applied BEFORE this engine:
//   products that fail passesMerchantTrustFilter() are excluded.

import { passesMerchantTrustFilter } from './deal-score'
import type { Product } from '@/types'
import type { RareItemBadge } from '@/types'

// ---------------------------------------------------------------------------
// Thresholds
// ---------------------------------------------------------------------------

export const RARE_THRESHOLDS = {
  /** Minimum discount % to generate a scarcity signal */
  SCARCITY_DISCOUNT_MIN:    0.15,
  /** sold_count at which trend_score reaches 100 */
  TREND_SOLD_MAX:           200,
  /** sold_count >= this for ready_to_ship badge */
  READY_SHIP_SOLD_MIN:      30,
  /** rare_score >= this → 'rare' badge (หายาก) */
  RARE_BADGE_THRESHOLD:     65,
  /** rare_score >= this → 'low_stock' badge (เหลือน้อย) */
  LOW_STOCK_BADGE_THRESHOLD: 40,
  /** Products below this final_score are not shown in Rare Item section */
  FEED_MIN_FINAL_SCORE:     30,
  /** Products above this price (THB) are excluded from the Rare Item feed */
  MAX_PRICE_THB:            30000,
} as const

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RareItemScoreBreakdown {
  discountScore: number   // 0-100: based on discount % vs original
  ratingScore:   number   // 0-100: based on product rating
  soldScore:     number   // 0-100: based on sold_count velocity
}

export interface RareItemResult {
  product_id:   string
  rare_score:   number
  trend_score:  number
  /** deal_score passed in from TASK 2.4 (or computed inline) */
  deal_score:   number
  final_score:  number
  badge:        RareItemBadge | null
  breakdown:    RareItemScoreBreakdown
}

// ---------------------------------------------------------------------------
// Score helpers (pure — no side effects)
// ---------------------------------------------------------------------------

/**
 * Discount score: 0% off → 0, 50% off → 100 (linear, capped).
 */
export function discountToScore(
  priceOriginal: number | null,
  priceCurrent: number,
): number {
  if (!priceOriginal || priceOriginal <= priceCurrent) return 0
  const pct = (priceOriginal - priceCurrent) / priceOriginal
  return Math.min(100, Math.round(pct * 200)) // 50% = 100
}

/**
 * Rating score: rating 1.0 → 0, rating 5.0 → 100.
 * null rating → 40 (neutral/unknown).
 */
export function ratingToScore(rating: number | null): number {
  if (rating === null) return 40
  return Math.min(100, Math.max(0, Math.round((rating - 1) / 4 * 100)))
}

/**
 * Sold velocity score: 0 sold → 0, TREND_SOLD_MAX sold → 100.
 */
export function soldToTrendScore(soldCount: number): number {
  return Math.min(100, Math.round(soldCount / RARE_THRESHOLDS.TREND_SOLD_MAX * 100))
}

// ---------------------------------------------------------------------------
// Badge assignment
// ---------------------------------------------------------------------------

/**
 * Assign the most appropriate badge based on scores + product signals.
 * Priority: rare > ready_to_ship > low_stock > null
 */
export function assignRareBadge(
  product: Product,
  rareScore: number,
): RareItemBadge | null {
  if (rareScore >= RARE_THRESHOLDS.RARE_BADGE_THRESHOLD) {
    return 'rare'
  }
  if (
    (product.shop_type === 'official' || product.shop_type === 'mall') &&
    product.sold_count >= RARE_THRESHOLDS.READY_SHIP_SOLD_MIN
  ) {
    return 'ready_to_ship'
  }
  if (rareScore >= RARE_THRESHOLDS.LOW_STOCK_BADGE_THRESHOLD) {
    return 'low_stock'
  }
  return null
}

// ---------------------------------------------------------------------------
// Main calculation
// ---------------------------------------------------------------------------

/**
 * Calculate the full Rare Item score for a single product.
 *
 * @param product    - Product row
 * @param dealScore  - Pre-computed AI Deal Score (from TASK 2.4).
 *                     Pass 0 if not available — it reduces final_score.
 */
export function calculateRareItemScore(
  product: Product,
  dealScore: number,
): RareItemResult {
  const discountScore = discountToScore(product.price_original, product.price_current)
  const ratingScore   = ratingToScore(product.rating)
  const soldScore     = soldToTrendScore(product.sold_count)

  // rare_score: deal scarcity signal — discount + rating combo
  const rareScore  = Math.round(discountScore * 0.60 + ratingScore * 0.40)

  // trend_score: demand signal — purely from sold_count
  const trendScore = soldScore

  // final_score: composite
  const finalScore = Math.round(
    dealScore  * 0.35 +
    rareScore  * 0.40 +
    trendScore * 0.25,
  )

  const badge = assignRareBadge(product, rareScore)

  return {
    product_id:  product.id,
    rare_score:  rareScore,
    trend_score: trendScore,
    deal_score:  dealScore,
    final_score: Math.min(100, Math.max(0, finalScore)),
    badge,
    breakdown: {
      discountScore,
      ratingScore,
      soldScore,
    },
  }
}

// ---------------------------------------------------------------------------
// Adaptive calibration — auto-adjusts thresholds to the actual pool
// ---------------------------------------------------------------------------

/**
 * Derive adaptive badge thresholds from the actual scored pool.
 *
 * When the product pool has low absolute scores (e.g. all feed-sourced with no
 * discount history), fixed thresholds would leave everything badge-less.
 * Adaptive calibration promotes the top fraction of the pool:
 *   - top 10% by rare_score → 'rare'
 *   - top 35% by rare_score → 'low_stock'
 *
 * Fixed thresholds act as a ceiling — they are never raised.
 */
function deriveAdaptiveThresholds(results: RareItemResult[]): {
  rareTh: number
  lowStockTh: number
} {
  if (results.length === 0) {
    return {
      rareTh:      RARE_THRESHOLDS.RARE_BADGE_THRESHOLD,
      lowStockTh:  RARE_THRESHOLDS.LOW_STOCK_BADGE_THRESHOLD,
    }
  }

  const scores = results.map(r => r.rare_score).sort((a, b) => b - a)
  const p10idx = Math.max(0, Math.ceil(scores.length * 0.10) - 1)
  const p35idx = Math.max(0, Math.ceil(scores.length * 0.35) - 1)

  return {
    rareTh:     Math.min(RARE_THRESHOLDS.RARE_BADGE_THRESHOLD,     scores[p10idx]),
    lowStockTh: Math.min(RARE_THRESHOLDS.LOW_STOCK_BADGE_THRESHOLD, scores[p35idx]),
  }
}

function assignRareBadgeAdaptive(
  product: Product,
  rareScore: number,
  rareTh: number,
  lowStockTh: number,
): RareItemBadge | null {
  if (rareScore >= rareTh) return 'rare'
  if (
    (product.shop_type === 'official' || product.shop_type === 'mall') &&
    product.sold_count >= RARE_THRESHOLDS.READY_SHIP_SOLD_MIN
  ) {
    return 'ready_to_ship'
  }
  if (rareScore >= lowStockTh) return 'low_stock'
  return null
}

// ---------------------------------------------------------------------------
// Batch helper — for cron + landing page
// ---------------------------------------------------------------------------

/** Minimum products to guarantee in feed via adaptive floor. */
const MIN_FEED_RESULTS = 20

/**
 * Score a batch of products for the Rare Item feed.
 * Applies Merchant Trust Filter (TASK 2.5) before scoring.
 *
 * Adaptive floor: always includes the top-MIN_FEED_RESULTS products even when
 * their absolute scores are below FEED_MIN_FINAL_SCORE.  This ensures the
 * homepage feed is never empty while the product catalogue matures.
 *
 * Adaptive badges: thresholds auto-lower to match the pool's score distribution
 * so top products always receive a meaningful badge.
 *
 * @param products     - Array of Product rows
 * @param dealScoreMap - Map<product_id, deal_score> from rare_item_scores or cron
 */
export function scoreRareItemBatch(
  products: Product[],
  dealScoreMap: Map<string, number>,
): RareItemResult[] {
  // Score all trust-filter-passing products within price range (no floor yet)
  const allScored: RareItemResult[] = []

  for (const product of products) {
    if (!passesMerchantTrustFilter(product)) continue
    if (product.price_current > RARE_THRESHOLDS.MAX_PRICE_THB) continue

    const dealScore = dealScoreMap.get(product.id) ?? 0
    allScored.push(calculateRareItemScore(product, dealScore))
  }

  if (allScored.length === 0) return []

  allScored.sort((a, b) => b.final_score - a.final_score)

  // Adaptive floor: use FEED_MIN_FINAL_SCORE OR the score at rank MIN_FEED_RESULTS,
  // whichever is lower — so we always surface at least MIN_FEED_RESULTS products.
  const scoreAtMinRank = allScored[Math.min(MIN_FEED_RESULTS, allScored.length) - 1].final_score
  const adaptiveFloor  = Math.min(RARE_THRESHOLDS.FEED_MIN_FINAL_SCORE, scoreAtMinRank)
  const candidates     = allScored.filter(r => r.final_score >= adaptiveFloor)

  // Adaptive badge thresholds calibrated to this pool's distribution
  const { rareTh, lowStockTh } = deriveAdaptiveThresholds(candidates)
  const productMap = new Map(products.map(p => [p.id, p]))

  for (const r of candidates) {
    const product = productMap.get(r.product_id)
    if (product) {
      r.badge = assignRareBadgeAdaptive(product, r.rare_score, rareTh, lowStockTh)
    }
  }

  return candidates
}
