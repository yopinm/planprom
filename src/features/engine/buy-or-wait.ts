// src/features/engine/buy-or-wait.ts
// TASK 2.6 — Buy or Wait Engine
//
// Pure function — no side effects, no DB calls.
// Dependencies: price_history moving average + AI Deal Score (TASK 2.4)
//               + Campaign Context (TASK 1.15) for upcoming promo detection.
//
// Signals:
//   STRONG_BUY    — price ≥15% below 30d avg AND dealScore ≥75
//   BUY_NOW       — price ≥5% below 30d avg, or good deal + coupons available
//   WAIT          — upcoming major promo within 7 days AND price not already low
//   LOW_CONFIDENCE — no price_history available (can't make a reliable call)

import { getCampaignContext } from '@/lib/campaign-context'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BuyOrWaitSignal = 'STRONG_BUY' | 'BUY_NOW' | 'WAIT' | 'LOW_CONFIDENCE'

export interface BuyOrWaitResult {
  signal: BuyOrWaitSignal
  /** Thai-language reason for UI display */
  reason: string
  /** Short Thai label for badge / traffic light */
  label: string
  /** Percentage below (positive) or above (negative) 30-day moving average */
  priceDrop: number
  /** Whether upcoming major promo was detected within the look-ahead window */
  upcomingPromo: boolean
  /** Days until next major promo, null if none detected within window */
  daysUntilPromo: number | null
}

// ---------------------------------------------------------------------------
// Thresholds (all exported so tests can verify assumptions without magic numbers)
// ---------------------------------------------------------------------------

export const BOW_THRESHOLDS = {
  /** Price drop ≥ this fraction → qualifies for STRONG_BUY price condition */
  STRONG_BUY_DROP:    0.15,
  /** Deal score ≥ this → qualifies for STRONG_BUY score condition */
  STRONG_BUY_SCORE:   75,
  /** Price drop ≥ this fraction → BUY_NOW */
  BUY_NOW_DROP:       0.05,
  /** Deal score ≥ this (with coupons) → BUY_NOW */
  BUY_NOW_SCORE_WITH_COUPONS: 50,
  /** If price is already this far below avg, skip WAIT even if promo is coming */
  PROMO_WAIT_SKIP_DROP: 0.10,
  /** Days ahead to check for upcoming major promo */
  PROMO_LOOK_AHEAD_DAYS: 7,
} as const

// ---------------------------------------------------------------------------
// Upcoming promo detection
// ---------------------------------------------------------------------------

/**
 * Check if there is a major promo (double_date or payday) within the next
 * `daysAhead` days.
 *
 * Returns { found: true, daysUntil } or { found: false, daysUntil: null }.
 */
export function detectUpcomingPromo(
  now: Date = new Date(),
  daysAhead: number = BOW_THRESHOLDS.PROMO_LOOK_AHEAD_DAYS,
): { found: boolean; daysUntil: number | null } {
  for (let d = 1; d <= daysAhead; d++) {
    const future = new Date(now)
    future.setDate(future.getDate() + d)
    const ctx = getCampaignContext(future)
    if (ctx.type === 'double_date' || ctx.type === 'payday') {
      return { found: true, daysUntil: d }
    }
  }
  return { found: false, daysUntil: null }
}

// ---------------------------------------------------------------------------
// Main calculation
// ---------------------------------------------------------------------------

export interface BuyOrWaitInput {
  /** 30-day moving average price from price_history. undefined = no history. */
  movingAvg30d?: number
  /** Current product price */
  currentPrice: number
  /** AI Deal Score 0–100 from TASK 2.4. undefined = not yet computed. */
  dealScore?: number
  /** Whether at least one valid coupon is available for this product */
  hasCoupons?: boolean
  /** Inject a fixed "now" for deterministic tests */
  now?: Date
}

/**
 * Calculate the Buy-or-Wait signal for a product.
 *
 * Decision priority (highest → lowest):
 *   1. No price history → LOW_CONFIDENCE
 *   2. STRONG_BUY:  priceDrop ≥ 15% AND dealScore ≥ 75
 *   3. WAIT:        upcoming major promo within 7 days AND priceDrop < 10%
 *   4. BUY_NOW:     priceDrop ≥ 5% OR (hasCoupons AND dealScore ≥ 50)
 *   5. WAIT:        default (price not compelling, no promo imminent but nothing else qualifies)
 */
export function calculateBuyOrWait(input: BuyOrWaitInput): BuyOrWaitResult {
  const {
    movingAvg30d,
    currentPrice,
    dealScore,
    hasCoupons = false,
    now = new Date(),
  } = input

  // 1. No history → LOW_CONFIDENCE
  if (!movingAvg30d || movingAvg30d <= 0) {
    return {
      signal:         'LOW_CONFIDENCE',
      reason:         'ข้อมูลราคาในอดีตไม่เพียงพอ — ไม่สามารถประเมินแนวโน้มได้',
      label:          'ไม่ทราบ',
      priceDrop:      0,
      upcomingPromo:  false,
      daysUntilPromo: null,
    }
  }

  const drop = (movingAvg30d - currentPrice) / movingAvg30d   // positive = cheaper than avg
  const priceDrop = Math.round(drop * 100 * 10) / 10          // percent, 1 decimal

  const { found: upcomingPromo, daysUntil: daysUntilPromo } =
    detectUpcomingPromo(now, BOW_THRESHOLDS.PROMO_LOOK_AHEAD_DAYS)

  // 2. STRONG_BUY
  const score = dealScore ?? 0
  if (drop >= BOW_THRESHOLDS.STRONG_BUY_DROP && score >= BOW_THRESHOLDS.STRONG_BUY_SCORE) {
    return {
      signal:  'STRONG_BUY',
      reason:  `ราคาต่ำกว่าค่าเฉลี่ย 30 วัน ${priceDrop.toFixed(1)}% — ต่ำสุดในรอบนี้ ซื้อเลย!`,
      label:   'ซื้อเลย!',
      priceDrop,
      upcomingPromo,
      daysUntilPromo,
    }
  }

  // 3. WAIT — upcoming major promo AND price is not already very low
  if (upcomingPromo && drop < BOW_THRESHOLDS.PROMO_WAIT_SKIP_DROP) {
    const promoMsg = daysUntilPromo === 1
      ? 'พรุ่งนี้'
      : `อีก ${daysUntilPromo} วัน`
    return {
      signal:  'WAIT',
      reason:  `โปรใหญ่กำลังมา (${promoMsg}) — รอก่อนอาจได้ราคาดีกว่านี้`,
      label:   'รอก่อน',
      priceDrop,
      upcomingPromo,
      daysUntilPromo,
    }
  }

  // 4. BUY_NOW
  const isBuyNowByDrop   = drop >= BOW_THRESHOLDS.BUY_NOW_DROP
  const isBuyNowByCoupon = hasCoupons && score >= BOW_THRESHOLDS.BUY_NOW_SCORE_WITH_COUPONS

  if (isBuyNowByDrop || isBuyNowByCoupon) {
    const reason = isBuyNowByDrop
      ? `ราคาดีกว่าค่าเฉลี่ย 30 วัน ${priceDrop.toFixed(1)}% — คุ้มที่จะซื้อตอนนี้`
      : 'มีคูปองและดีลคุ้ม — เหมาะสำหรับซื้อตอนนี้'
    return {
      signal:  'BUY_NOW',
      reason,
      label:   'ควรซื้อ',
      priceDrop,
      upcomingPromo,
      daysUntilPromo,
    }
  }

  // 5. Default WAIT
  const abovePct = Math.abs(priceDrop).toFixed(1)
  return {
    signal:  'WAIT',
    reason:  drop < 0
      ? `ราคาสูงกว่าค่าเฉลี่ย 30 วัน ${abovePct}% — รอส่วนลดก่อนน่าจะดีกว่า`
      : 'ราคาใกล้เคียงค่าเฉลี่ย — ไม่เร่งรีบก็ได้',
    label:   'รอก่อน',
    priceDrop,
    upcomingPromo,
    daysUntilPromo,
  }
}
