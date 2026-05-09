// Ranking Engine + Explanation Engine — Layer 6-8
// of the Search & Deal Optimization Engine
//
// Layer 6 — Ranking Engine:
//   rankResults() — sort candidates by Deal Score (desc)
//
// Layer 7 — Deal Score (AI Scoring):
//   score = price*0.36 + rating*0.18 + sold*0.13 + discount*0.13 + store*0.10 + coupon*0.10
//   label: 'Best Value' (≥70) | 'Good Deal' (≥50) | 'Fair Deal' (<50)
//
// Layer 8 — Explanation Engine:
//   buildExplanation() — human-readable Thai summary + howToUse + confidence + alternative

import type { Coupon, DataSource, PriceResult, Product, ShopType } from '@/types'

// ---------------------------------------------------------------------------
// Output types
// ---------------------------------------------------------------------------

export type DealLabel = 'Best Value' | 'Good Deal' | 'Fair Deal'
export type Confidence = 'สูง' | 'กลาง' | 'ต่ำ'

export interface ScoreBreakdown {
  /** Relative within candidate set: cheapest effective net → 100 */
  price: number
  /** Absolute: product.rating (0–5) → 0–100 */
  rating: number
  /** Absolute: log-scale of sold_count → 0–100 */
  sold: number
  /** Absolute: discount % from originalPrice → 0–100 (caps at 50% off = 100) */
  discount: number
  /** Absolute: shop_type → official=100, mall=70, normal=40, null=30 */
  store: number
  /** Absolute: has coupon code → 100, has deal no code → 50, no coupon → 0 */
  coupon: number
}

export interface DealScore {
  total: number          // 0–100 weighted composite
  label: DealLabel
  breakdown: ScoreBreakdown
}

export interface Explanation {
  summary: string        // e.g. "ดีลที่คุ้มสุด: 425 บาท"
  howToUse: string       // e.g. "วิธีใช้: โค้ดร้าน 50 บาท + ส่งฟรี"
  confidence: Confidence
  alternative: string | null
}

export interface CandidateResult {
  product: Product
  priceResult: PriceResult
}

export interface RankedResult extends CandidateResult {
  dealScore: DealScore
  explanation: Explanation
}

// ---------------------------------------------------------------------------
// Score weights (Layer 7 formula)
// ---------------------------------------------------------------------------

const WEIGHTS = {
  price:    0.36,
  rating:   0.18,
  sold:     0.13,
  discount: 0.13,
  store:    0.10,
  coupon:   0.10,
} as const

// ---------------------------------------------------------------------------
// Individual scoring helpers (exported for unit tests)
// ---------------------------------------------------------------------------

/** rating 0–5 → 0–100; null defaults to 30 (no data penalty) */
export function scoreRating(rating: number | null): number {
  if (rating === null) return 30
  return Math.min(100, Math.round((rating / 5) * 100))
}

/**
 * sold_count → 0–100 using log10 scale.
 * Calibration: 0=0, 10≈23, 100=40, 1 000=57, 10 000=73, 100 000=90, 1 000 000=100
 */
export function scoreSold(count: number): number {
  if (count <= 0) return 0
  const MAX_LOG = Math.log10(1_000_001)
  return Math.min(100, Math.round((Math.log10(count + 1) / MAX_LOG) * 100))
}

/**
 * Absolute discount percentage from originalPrice.
 * 0% → 0, 25% → 50, 50%+ → 100  (linear, capped)
 */
export function scoreDiscount(originalPrice: number, effectiveNet: number): number {
  if (originalPrice <= 0) return 0
  const pct = Math.max(0, (originalPrice - effectiveNet) / originalPrice) * 100
  return Math.min(100, Math.round(pct * 2)) // *2 so 50% discount = full score
}

/** shop_type → fixed score */
export function scoreStore(shopType: ShopType | null): number {
  switch (shopType) {
    case 'official': return 100
    case 'mall':     return 70
    case 'normal':   return 40
    default:         return 30
  }
}

/** has coupon code → 100; has deal/promo but no code → 50; no coupon → 0 */
export function scoreCoupon(usedCombination: Coupon[]): number {
  if (usedCombination.some(c => c.code !== null)) return 100
  if (usedCombination.length > 0) return 50
  return 0
}

/**
 * Relative price score within the candidate set.
 * Cheapest effectiveNet → 100, most expensive → 0.
 * When all prices are equal → 50.
 */
export function computePriceScores(candidates: CandidateResult[]): number[] {
  const nets = candidates.map(c => c.priceResult.effectiveNet)
  const minNet = Math.min(...nets)
  const maxNet = Math.max(...nets)

  if (maxNet === minNet) return candidates.map(() => 50)

  return nets.map(net =>
    Math.round(((maxNet - net) / (maxNet - minNet)) * 100),
  )
}

/** total 0–100 → DealLabel */
export function labelFromScore(total: number): DealLabel {
  if (total >= 70) return 'Best Value'
  if (total >= 50) return 'Good Deal'
  return 'Fair Deal'
}

/** total 0–100 → Confidence */
export function confidenceFromScore(total: number): Confidence {
  if (total >= 70) return 'สูง'
  if (total >= 50) return 'กลาง'
  return 'ต่ำ'
}

/**
 * DEAL-CONFIDENCE-1: Composite confidence from deal score + freshness + source.
 * Freshness penalty: stale -20, aging -10, unknown -5.
 * Source penalty: mock -30 (demo), manual -5 (not real-time API).
 * Vote bonus/penalty: placeholder — requires votes table (P2).
 */
export function computeDealConfidence(
  dealTotal: number,
  freshnessStatus: 'fresh' | 'aging' | 'stale' | 'unknown',
  dataSource: DataSource,
): Confidence {
  let score = dealTotal

  if (freshnessStatus === 'stale')         score -= 20
  else if (freshnessStatus === 'aging')    score -= 10
  else if (freshnessStatus === 'unknown')  score -= 5

  // mock = demo data (-30); non-API sources same penalty as manual (-5)
  if (dataSource === 'mock')       score -= 30
  else if (dataSource !== 'api')   score -= 5

  const clamped = Math.max(0, Math.min(100, score))
  if (clamped >= 65) return 'สูง'
  if (clamped >= 45) return 'กลาง'
  return 'ต่ำ'
}

// ---------------------------------------------------------------------------
// Layer 8 — Explanation Engine
// ---------------------------------------------------------------------------

/** Describe each coupon in the used combination in Thai */
function describeCoupon(c: Coupon): string {
  switch (c.type) {
    case 'fixed':    return `ส่วนลด ${c.discount_value} บาท`
    case 'percent':  return `ลด ${c.discount_value}%`
    case 'shipping': return 'ส่งฟรี'
    case 'cashback': return `แคชแบ็ก ${c.discount_value} บาท`
  }
}

/** "วิธีใช้: โค้ดร้าน 50 บาท + ส่งฟรี" */
export function buildHowToUse(coupons: Coupon[]): string {
  if (coupons.length === 0) return 'ไม่มีโค้ดเพิ่มเติม'
  const ordered = [...coupons].sort((a, b) => a.tier - b.tier)
  return 'วิธีใช้: ' + ordered.map(describeCoupon).join(' + ')
}

/** "ดีลที่คุ้มสุด: 425 บาท" */
export function buildSummary(label: DealLabel, effectiveNet: number): string {
  const prefix =
    label === 'Best Value' ? 'ดีลที่คุ้มสุด'
    : label === 'Good Deal' ? 'ดีลดี'
    : 'ราคาปกติ'
  return `${prefix}: ${effectiveNet.toLocaleString('th-TH')} บาท`
}

/**
 * Returns a warning when any used coupon expires within 24 hours.
 * Returns null when there's nothing notable to flag.
 */
export function buildAlternative(coupons: Coupon[], now = new Date()): string | null {
  const nearExpiry = coupons.find(c => {
    if (!c.expire_at) return false
    const msLeft = new Date(c.expire_at).getTime() - now.getTime()
    return msLeft > 0 && msLeft < 24 * 60 * 60 * 1000
  })
  if (nearExpiry) return 'โค้ดนี้หมดอายุภายใน 24 ชั่วโมง — ใช้เลยดีกว่า'
  return null
}

/** Compose full Explanation for one candidate */
export function buildExplanation(
  label: DealLabel,
  total: number,
  priceResult: PriceResult,
  now?: Date,
): Explanation {
  return {
    summary:     buildSummary(label, priceResult.effectiveNet),
    howToUse:    buildHowToUse(priceResult.usedCombination),
    confidence:  confidenceFromScore(total),
    alternative: buildAlternative(priceResult.usedCombination, now),
  }
}

// ---------------------------------------------------------------------------
// Layer 6 — Ranking Engine entry point
// ---------------------------------------------------------------------------

/**
 * Score, explain, and rank a list of candidates.
 *
 * Results are sorted by Deal Score descending (highest first).
 * Tie-break: lower effectiveNet wins.
 */
export function rankResults(candidates: CandidateResult[], now?: Date): RankedResult[] {
  if (candidates.length === 0) return []

  const priceScores = computePriceScores(candidates)

  const ranked = candidates.map((candidate, i): RankedResult => {
    const { product, priceResult } = candidate

    const breakdown: ScoreBreakdown = {
      price:    priceScores[i],
      rating:   scoreRating(product.rating),
      sold:     scoreSold(product.sold_count),
      discount: scoreDiscount(priceResult.originalPrice, priceResult.effectiveNet),
      store:    scoreStore(product.shop_type),
      coupon:   scoreCoupon(priceResult.usedCombination),
    }

    const total = Math.round(
      breakdown.price    * WEIGHTS.price +
      breakdown.rating   * WEIGHTS.rating +
      breakdown.sold     * WEIGHTS.sold +
      breakdown.discount * WEIGHTS.discount +
      breakdown.store    * WEIGHTS.store +
      breakdown.coupon   * WEIGHTS.coupon,
    )

    const label = labelFromScore(total)
    const dealScore: DealScore = { total, label, breakdown }
    const explanation = buildExplanation(label, total, priceResult, now)

    return { product, priceResult, dealScore, explanation }
  })

  // Sort descending by total score; tie-break on effectiveNet ascending
  return ranked.sort((a, b) => {
    if (b.dealScore.total !== a.dealScore.total) return b.dealScore.total - a.dealScore.total
    return a.priceResult.effectiveNet - b.priceResult.effectiveNet
  })
}
