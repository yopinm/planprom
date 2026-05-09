// Combination Solver + Net Price Calculator — Layer 4-5
// of the Search & Deal Optimization Engine
//
// Layer 4 — Combination Solver:
//   generateCombinations() — cartesian product (at most 1 coupon per tier)
//   solveBestCombination() — find combination with lowest effectiveNet
//
// Layer 5 — Net Price Calculator:
//   calculateNetPrice() — apply coupons in Tier 1→2→3→4 order
//   applyCoupon()       — per-coupon math (fixed / percent / shipping / cashback)
//
// Discount type rules:
//   fixed    → itemPrice  -= min(discount_value, max_discount)
//   percent  → itemPrice  -= min(itemPrice * rate, max_discount)
//   shipping → shippingFee -= min(discount_value, max_discount); floor 0
//   cashback → tracked separately; subtracted from payNow → effectiveNet

import type { BankPromotion, Coupon, CouponStackRule, CouponTier, PriceResult } from '@/types'
import { filterBankPromotions } from '@/lib/bank-promotions'
import { canStack } from './eligibility-filter'

// ---------------------------------------------------------------------------
// Solver input
// ---------------------------------------------------------------------------

export interface SolverInput {
  /** Item price before any coupons (baht) */
  originalPrice: number
  /** Shipping fee before any coupons (0 = already free shipping) */
  shippingFee: number
  /** Already-eligible coupons from Layer 3 */
  coupons: Coupon[]
  /** Active stack rules from DB */
  stackRules: CouponStackRule[]
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function capDiscount(raw: number, maxDiscount: number | null): number {
  return maxDiscount !== null ? Math.min(raw, maxDiscount) : raw
}

// ---------------------------------------------------------------------------
// Per-coupon discount application
// ---------------------------------------------------------------------------

interface PriceState {
  itemPrice: number
  shippingFee: number
  cashback: number
}

interface NetPriceCalculation {
  payNow: number
  effectiveNet: number
  itemSubtotal: number
  shippingFinal: number
  itemDiscount: number
  shippingDiscount: number
  cashbackSaving: number
}

export function applyCoupon(coupon: Coupon, state: PriceState): PriceState {
  const { itemPrice, shippingFee, cashback } = state

  switch (coupon.type) {
    case 'fixed': {
      const discount = capDiscount(coupon.discount_value, coupon.max_discount)
      return { itemPrice: Math.max(0, itemPrice - discount), shippingFee, cashback }
    }
    case 'percent': {
      const raw = itemPrice * (coupon.discount_value / 100)
      const discount = capDiscount(raw, coupon.max_discount)
      return { itemPrice: Math.max(0, itemPrice - discount), shippingFee, cashback }
    }
    case 'shipping': {
      const discount = capDiscount(coupon.discount_value, coupon.max_discount)
      return { itemPrice, shippingFee: Math.max(0, shippingFee - discount), cashback }
    }
    case 'cashback': {
      const earned = capDiscount(coupon.discount_value, coupon.max_discount)
      return { itemPrice, shippingFee, cashback: cashback + earned }
    }
  }
}

// ---------------------------------------------------------------------------
// Net Price Calculator (Layer 5)
// ---------------------------------------------------------------------------

/**
 * Apply coupons in Tier 1→2→3→4 order and return payNow + effectiveNet.
 *
 *   payNow      = itemPrice + shippingFee   (what user pays at checkout)
 *   effectiveNet = payNow - cashback         (true cost after cashback credited)
 */
export function calculateNetPrice(
  originalPrice: number,
  shippingFee: number,
  coupons: Coupon[],
): NetPriceCalculation {
  const ordered = [...coupons].sort((a, b) => a.tier - b.tier)

  let state: PriceState = { itemPrice: originalPrice, shippingFee, cashback: 0 }
  let itemDiscount = 0
  let shippingDiscount = 0

  for (const coupon of ordered) {
    const before = state
    state = applyCoupon(coupon, state)
    itemDiscount += before.itemPrice - state.itemPrice
    shippingDiscount += before.shippingFee - state.shippingFee
  }

  const payNow = round2(state.itemPrice + state.shippingFee)
  const effectiveNet = round2(Math.max(0, payNow - state.cashback))

  return {
    payNow,
    effectiveNet,
    itemSubtotal: round2(state.itemPrice),
    shippingFinal: round2(state.shippingFee),
    itemDiscount: round2(itemDiscount),
    shippingDiscount: round2(shippingDiscount),
    cashbackSaving: round2(state.cashback),
  }
}

// ---------------------------------------------------------------------------
// Combination Generator (Layer 4)
// ---------------------------------------------------------------------------

/**
 * Generate all candidate combinations by picking at most one coupon per tier.
 * This mirrors the real platform constraint: one coupon per tier slot.
 *
 * Example: tier1=[A,B], tier2=[C]
 *   → [], [A], [B], [C], [A,C], [B,C]
 */
export function generateCombinations(coupons: Coupon[]): Coupon[][] {
  const byTier = new Map<CouponTier, Coupon[]>()

  for (const c of coupons) {
    const group = byTier.get(c.tier) ?? []
    group.push(c)
    byTier.set(c.tier, group)
  }

  const tiers = ([1, 2, 3, 4] as CouponTier[]).filter(t => byTier.has(t))

  // Start with the empty selection and expand tier by tier
  let combos: (Coupon | null)[][] = [[]]

  for (const tier of tiers) {
    const tierCoupons = byTier.get(tier)!
    const next: (Coupon | null)[][] = []

    for (const combo of combos) {
      // Choice 0: skip this tier
      next.push([...combo, null])
      // Choice 1..n: pick one coupon from this tier
      for (const c of tierCoupons) {
        next.push([...combo, c])
      }
    }

    combos = next
  }

  // Drop nulls — each entry is a concrete coupon set
  return combos.map(combo => combo.filter((c): c is Coupon => c !== null))
}

// ---------------------------------------------------------------------------
// Combination Solver (Layer 4 entry point)
// ---------------------------------------------------------------------------

/**
 * Find the coupon combination that yields the lowest effectiveNet.
 * Tie-break: lower payNow wins.
 *
 * Returns a PriceResult with usedCombination = [] when no coupons apply
 * (payNow = originalPrice + shippingFee, effectiveNet = same).
 */
export function solveBestCombination(input: SolverInput): PriceResult {
  const { originalPrice, shippingFee, coupons, stackRules } = input

  const baseline: PriceResult = {
    originalPrice,
    payNow: round2(originalPrice + shippingFee),
    effectiveNet: round2(originalPrice + shippingFee),
    usedCombination: [],
    shippingFee,
    itemSubtotal: originalPrice,
    shippingFinal: shippingFee,
    itemDiscount: 0,
    shippingDiscount: 0,
    cashbackSaving: 0,
  }

  let best = baseline

  for (const combo of generateCombinations(coupons)) {
    if (combo.length === 0) continue // baseline already covers this

    if (!canStack(combo, stackRules)) continue

    const calculation = calculateNetPrice(originalPrice, shippingFee, combo)
    const { payNow, effectiveNet } = calculation

    const betterNet = effectiveNet < best.effectiveNet
    const equalNetBetterPay = effectiveNet === best.effectiveNet && payNow < best.payNow

    if (betterNet || equalNetBetterPay) {
      best = { originalPrice, usedCombination: combo, shippingFee, ...calculation }
    }
  }

  return best
}

// ---------------------------------------------------------------------------
// Tier 3 Bank Promotion Layer (TASK 1.6.2)
// ---------------------------------------------------------------------------

export interface SolverInputWithBank extends SolverInput {
  /** Active bank promotions filtered for this context */
  bankPromotions: BankPromotion[]
  /** Product category (for bank promo category matching) */
  category?: string
  /** Override day-of-week for deterministic testing (0=Sun…6=Sat) */
  dayOfWeek?: number
  /** Override now for deterministic testing */
  now?: Date
}

/**
 * Calculate the bank saving for a given payNow amount.
 * Applies percent/fixed/cashback reduction and respects max_discount + min_spend.
 */
export function applyBankPromotion(
  promo: BankPromotion,
  payNow: number,
): number {
  if (payNow < promo.min_spend) return 0

  let saving: number
  switch (promo.discount_type) {
    case 'percent':
      saving = payNow * (promo.discount_value / 100)
      break
    case 'fixed':
      saving = promo.discount_value
      break
    case 'cashback':
      saving = payNow * (promo.discount_value / 100)
      break
  }

  if (promo.max_discount !== null) saving = Math.min(saving, promo.max_discount)
  return round2(Math.max(0, saving))
}

/**
 * Finds the best applicable bank promotion and returns the saving amount.
 * "Best" = highest saving given the current payNow.
 * Returns null when no promotion applies.
 */
export function findBestBankPromotion(
  promotions: BankPromotion[],
  platform: Coupon['platform'],
  payNow: number,
  category?: string,
  dayOfWeek?: number,
  now?: Date,
): { promo: BankPromotion; saving: number } | null {
  // Platform must match (not 'all' for Coupon, but BankPromotion.platform can be 'all')
  const eligible = filterBankPromotions(
    promotions,
    platform as 'shopee' | 'lazada',
    category,
    dayOfWeek,
    now,
  )

  if (eligible.length === 0) return null

  let bestPromo: BankPromotion | null = null
  let bestSaving = 0

  for (const promo of eligible) {
    const saving = applyBankPromotion(promo, payNow)
    if (saving > bestSaving) {
      bestSaving = saving
      bestPromo = promo
    }
  }

  if (!bestPromo || bestSaving <= 0) return null
  return { promo: bestPromo, saving: bestSaving }
}

/**
 * Combination Solver with Tier 3 Bank Promotion (TASK 1.6.2).
 *
 * Flow:
 *   1. Run regular solveBestCombination (Tier 1–4 coupon stack)
 *   2. Apply best applicable bank promotion on top of the result
 *   3. Return PriceResult with bankSaving + bankPromotionId
 *
 * The bank promotion reduces effectiveNet further (as a cashback/discount
 * applied at payment via credit/debit card — separate from platform coupons).
 */
export function solveBestCombinationWithBank(input: SolverInputWithBank): PriceResult {
  const { bankPromotions, category, dayOfWeek, now, ...solverInput } = input

  // Step 1: best regular coupon combination
  const base = solveBestCombination(solverInput)

  // Step 2: determine platform from coupons (or pick from products if empty)
  // Use the platform of the first used coupon, or assume both platforms apply
  // by trying 'shopee' first — caller should pass the actual product platform.
  // In practice, search-pipeline passes product.platform via the coupons.
  const platform = (base.usedCombination[0]?.platform as 'shopee' | 'lazada') ?? 'shopee'
  const effectiveDow = dayOfWeek ?? (now ?? new Date()).getDay()

  const bankResult = findBestBankPromotion(
    bankPromotions,
    platform,
    base.payNow,
    category,
    effectiveDow,
    now,
  )

  if (!bankResult) return base

  return {
    ...base,
    effectiveNet: round2(Math.max(0, base.effectiveNet - bankResult.saving)),
    bankSaving: bankResult.saving,
    bankPromotionId: bankResult.promo.id,
  }
}
