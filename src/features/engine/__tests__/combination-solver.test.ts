import { describe, it, expect } from 'vitest'
import {
  applyCoupon,
  calculateNetPrice,
  generateCombinations,
  solveBestCombination,
} from '../combination-solver'
import type { Coupon, CouponStackRule } from '@/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCoupon(overrides: Partial<Coupon>): Coupon {
  return {
    id: 'c',
    code: null,
    title: 'Coupon',
    description: null,
    platform: 'shopee',
    tier: 1,
    type: 'fixed',
    discount_value: 0,
    max_discount: null,
    min_spend: 0,
    applicable_categories: [],
    can_stack: true,
    user_segment: 'all',
    expire_at: null,
    is_active: true,
    source: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeRule(overrides: Partial<CouponStackRule> = {}): CouponStackRule {
  return {
    id: 'r1',
    name: 'Default',
    description: null,
    platform: 'all',
    tier_order: [1, 2, 3, 4],
    allowed_tiers: [1, 2, 3, 4],
    max_stack: 4,
    conditions: {},
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

const DEFAULT_STATE = { itemPrice: 1000, shippingFee: 50, cashback: 0 }

// =============================================================
// 1. applyCoupon — fixed
// =============================================================
describe('applyCoupon — fixed', () => {
  it('subtracts fixed amount from itemPrice', () => {
    const coupon = makeCoupon({ type: 'fixed', discount_value: 100 })
    const result = applyCoupon(coupon, DEFAULT_STATE)
    expect(result.itemPrice).toBe(900)
    expect(result.shippingFee).toBe(50)
    expect(result.cashback).toBe(0)
  })

  it('caps discount at max_discount', () => {
    const coupon = makeCoupon({ type: 'fixed', discount_value: 200, max_discount: 80 })
    const result = applyCoupon(coupon, DEFAULT_STATE)
    expect(result.itemPrice).toBe(920) // 1000 - 80
  })

  it('floors itemPrice at 0 (no negative price)', () => {
    const coupon = makeCoupon({ type: 'fixed', discount_value: 5000 })
    const result = applyCoupon(coupon, DEFAULT_STATE)
    expect(result.itemPrice).toBe(0)
  })

  it('does not change shippingFee or cashback', () => {
    const coupon = makeCoupon({ type: 'fixed', discount_value: 100 })
    const result = applyCoupon(coupon, DEFAULT_STATE)
    expect(result.shippingFee).toBe(50)
    expect(result.cashback).toBe(0)
  })
})

// =============================================================
// 2. applyCoupon — percent
// =============================================================
describe('applyCoupon — percent', () => {
  it('subtracts percentage of itemPrice', () => {
    const coupon = makeCoupon({ type: 'percent', discount_value: 10 })
    const result = applyCoupon(coupon, DEFAULT_STATE) // 10% of 1000 = 100
    expect(result.itemPrice).toBe(900)
  })

  it('caps percent discount at max_discount', () => {
    // 20% of 1000 = 200 but capped at 150
    const coupon = makeCoupon({ type: 'percent', discount_value: 20, max_discount: 150 })
    const result = applyCoupon(coupon, DEFAULT_STATE)
    expect(result.itemPrice).toBe(850) // 1000 - 150
  })

  it('percentage applies to current itemPrice (not original)', () => {
    // After a previous coupon brought itemPrice to 500
    const state = { itemPrice: 500, shippingFee: 50, cashback: 0 }
    const coupon = makeCoupon({ type: 'percent', discount_value: 10 }) // 10% of 500 = 50
    const result = applyCoupon(coupon, state)
    expect(result.itemPrice).toBe(450)
  })

  it('floors itemPrice at 0', () => {
    const coupon = makeCoupon({ type: 'percent', discount_value: 100 })
    const result = applyCoupon(coupon, DEFAULT_STATE)
    expect(result.itemPrice).toBe(0)
  })
})

// =============================================================
// 3. applyCoupon — shipping
// =============================================================
describe('applyCoupon — shipping', () => {
  it('reduces shippingFee by discount_value', () => {
    const coupon = makeCoupon({ type: 'shipping', discount_value: 30 })
    const result = applyCoupon(coupon, DEFAULT_STATE)
    expect(result.shippingFee).toBe(20)
    expect(result.itemPrice).toBe(1000) // unchanged
  })

  it('floors shippingFee at 0 (free shipping — cannot go negative)', () => {
    const coupon = makeCoupon({ type: 'shipping', discount_value: 200 })
    const result = applyCoupon(coupon, DEFAULT_STATE)
    expect(result.shippingFee).toBe(0)
  })

  it('shipping coupon on zero-fee order has no effect', () => {
    const state = { itemPrice: 1000, shippingFee: 0, cashback: 0 }
    const coupon = makeCoupon({ type: 'shipping', discount_value: 50 })
    const result = applyCoupon(coupon, state)
    expect(result.shippingFee).toBe(0)
    expect(result.itemPrice).toBe(1000)
  })

  it('caps shipping discount at max_discount', () => {
    const coupon = makeCoupon({ type: 'shipping', discount_value: 100, max_discount: 30 })
    const result = applyCoupon(coupon, DEFAULT_STATE)
    expect(result.shippingFee).toBe(20) // 50 - 30
  })
})

// =============================================================
// 4. applyCoupon — cashback
// =============================================================
describe('applyCoupon — cashback', () => {
  it('adds to cashback without changing itemPrice or shippingFee', () => {
    const coupon = makeCoupon({ type: 'cashback', discount_value: 80 })
    const result = applyCoupon(coupon, DEFAULT_STATE)
    expect(result.cashback).toBe(80)
    expect(result.itemPrice).toBe(1000)
    expect(result.shippingFee).toBe(50)
  })

  it('accumulates cashback from multiple coupons', () => {
    const c1 = makeCoupon({ type: 'cashback', discount_value: 50 })
    const state1 = applyCoupon(c1, DEFAULT_STATE)
    const c2 = makeCoupon({ type: 'cashback', discount_value: 30 })
    const state2 = applyCoupon(c2, state1)
    expect(state2.cashback).toBe(80)
  })

  it('caps cashback at max_discount', () => {
    const coupon = makeCoupon({ type: 'cashback', discount_value: 200, max_discount: 60 })
    const result = applyCoupon(coupon, DEFAULT_STATE)
    expect(result.cashback).toBe(60)
  })
})

// =============================================================
// 5. calculateNetPrice
// =============================================================
describe('calculateNetPrice', () => {
  it('returns original + shipping when no coupons', () => {
    const { payNow, effectiveNet } = calculateNetPrice(1000, 50, [])
    expect(payNow).toBe(1050)
    expect(effectiveNet).toBe(1050)
  })

  it('applies coupons in tier order (1→2→3→4)', () => {
    // tier2 percent should apply to price AFTER tier1 fixed discount
    const tier1 = makeCoupon({ tier: 1, type: 'fixed', discount_value: 100 })  // 1000→900
    const tier2 = makeCoupon({ tier: 2, type: 'percent', discount_value: 10 }) // 10% of 900=90 → 810
    const { payNow } = calculateNetPrice(1000, 0, [tier2, tier1]) // deliberately reversed order
    expect(payNow).toBe(810)
  })

  it('payNow includes shipping after shipping coupon', () => {
    const coupon = makeCoupon({ tier: 3, type: 'shipping', discount_value: 50 })
    const { payNow } = calculateNetPrice(1000, 50, [coupon])
    expect(payNow).toBe(1000) // 1000 + 0 shipping
  })

  it('effectiveNet = payNow - cashback', () => {
    const coupon = makeCoupon({ tier: 4, type: 'cashback', discount_value: 100 })
    const { payNow, effectiveNet } = calculateNetPrice(1000, 50, [coupon])
    expect(payNow).toBe(1050)
    expect(effectiveNet).toBe(950) // 1050 - 100
  })

  it('effectiveNet floors at 0 when cashback exceeds payNow', () => {
    const coupon = makeCoupon({ tier: 1, type: 'cashback', discount_value: 9999 })
    const { effectiveNet } = calculateNetPrice(100, 0, [coupon])
    expect(effectiveNet).toBe(0)
  })

  it('stack: fixed + percent + shipping + cashback', () => {
    const t1 = makeCoupon({ tier: 1, type: 'fixed', discount_value: 100 })    // 1000→900
    const t2 = makeCoupon({ tier: 2, type: 'percent', discount_value: 10 })   // 900→810
    const t3 = makeCoupon({ tier: 3, type: 'shipping', discount_value: 50 })  // shipping 50→0
    const t4 = makeCoupon({ tier: 4, type: 'cashback', discount_value: 50 })  // cashback 50
    const {
      payNow,
      effectiveNet,
      itemDiscount,
      shippingDiscount,
      cashbackSaving,
      itemSubtotal,
      shippingFinal,
    } = calculateNetPrice(1000, 50, [t1, t2, t3, t4])
    expect(payNow).toBe(810)          // 810 item + 0 shipping
    expect(effectiveNet).toBe(760)    // 810 - 50 cashback
    expect(itemDiscount).toBe(190)
    expect(shippingDiscount).toBe(50)
    expect(cashbackSaving).toBe(50)
    expect(itemSubtotal).toBe(810)
    expect(shippingFinal).toBe(0)
  })

  it('rounds to 2 decimal places', () => {
    const coupon = makeCoupon({ tier: 1, type: 'percent', discount_value: 10 })
    const { payNow } = calculateNetPrice(333, 0, [coupon]) // 10% of 333 = 33.3 → 299.7
    expect(payNow).toBe(299.7)
  })
})

// =============================================================
// 6. generateCombinations
// =============================================================
describe('generateCombinations', () => {
  it('returns [[]] equivalent (empty combo) when no coupons', () => {
    const result = generateCombinations([])
    expect(result).toEqual([[]])
  })

  it('returns [[], [coupon]] for a single coupon', () => {
    const c = makeCoupon({ id: 'c1', tier: 1 })
    const result = generateCombinations([c])
    expect(result).toHaveLength(2)
    expect(result).toContainEqual([])
    expect(result).toContainEqual([c])
  })

  it('generates 6 combos for 2 tiers with 2 and 1 coupons (null=skip)', () => {
    // tier1: [A, B], tier2: [C] → [], [A], [B], [C], [A,C], [B,C]
    const A = makeCoupon({ id: 'A', tier: 1 })
    const B = makeCoupon({ id: 'B', tier: 1 })
    const C = makeCoupon({ id: 'C', tier: 2 })
    const result = generateCombinations([A, B, C])
    expect(result).toHaveLength(6)
  })

  it('never puts 2 coupons of same tier in one combination', () => {
    const A = makeCoupon({ id: 'A', tier: 1 })
    const B = makeCoupon({ id: 'B', tier: 1 })
    const result = generateCombinations([A, B])
    // No combo should contain both A and B
    const invalid = result.find(combo => combo.includes(A) && combo.includes(B))
    expect(invalid).toBeUndefined()
  })
})

// =============================================================
// 7. solveBestCombination
// =============================================================
describe('solveBestCombination', () => {
  const rule = makeRule()

  it('returns baseline when no coupons', () => {
    const result = solveBestCombination({ originalPrice: 1000, shippingFee: 50, coupons: [], stackRules: [rule] })
    expect(result.payNow).toBe(1050)
    expect(result.effectiveNet).toBe(1050)
    expect(result.usedCombination).toHaveLength(0)
  })

  it('applies single coupon when valid', () => {
    const coupon = makeCoupon({ tier: 1, type: 'fixed', discount_value: 100 })
    const result = solveBestCombination({ originalPrice: 1000, shippingFee: 0, coupons: [coupon], stackRules: [rule] })
    expect(result.payNow).toBe(900)
    expect(result.usedCombination).toContain(coupon)
  })

  it('picks the better of two tier-1 coupons', () => {
    const worse = makeCoupon({ id: 'worse', tier: 1, type: 'fixed', discount_value: 50 })
    const better = makeCoupon({ id: 'better', tier: 1, type: 'fixed', discount_value: 150 })
    const result = solveBestCombination({ originalPrice: 1000, shippingFee: 0, coupons: [worse, better], stackRules: [rule] })
    expect(result.payNow).toBe(850)
    expect(result.usedCombination).toContain(better)
    expect(result.usedCombination).not.toContain(worse)
  })

  it('stacks coupons across tiers when canStack passes', () => {
    const t1 = makeCoupon({ id: 't1', tier: 1, type: 'fixed', discount_value: 100 })
    const t2 = makeCoupon({ id: 't2', tier: 2, type: 'fixed', discount_value: 50 })
    const result = solveBestCombination({ originalPrice: 1000, shippingFee: 0, coupons: [t1, t2], stackRules: [rule] })
    expect(result.payNow).toBe(850)
    expect(result.usedCombination).toHaveLength(2)
  })

  it('skips combination when canStack fails (no rules)', () => {
    const t1 = makeCoupon({ id: 't1', tier: 1, type: 'fixed', discount_value: 100 })
    const t2 = makeCoupon({ id: 't2', tier: 2, type: 'fixed', discount_value: 50 })
    // No rules → canStack([t1,t2]) = false, so best is single coupon t1
    const result = solveBestCombination({ originalPrice: 1000, shippingFee: 0, coupons: [t1, t2], stackRules: [] })
    expect(result.usedCombination).toHaveLength(1)
    expect(result.payNow).toBe(900) // only t1 applied
  })

  it('prefers lower effectiveNet over lower payNow', () => {
    // Option A: fixed 80 → payNow=920, effectiveNet=920
    // Option B: cashback 100 → payNow=1000, effectiveNet=900
    const optA = makeCoupon({ id: 'A', tier: 1, type: 'fixed', discount_value: 80 })
    const optB = makeCoupon({ id: 'B', tier: 2, type: 'cashback', discount_value: 100 })
    // Need a rule that allows tier 1 solo AND tier 2 solo
    const result = solveBestCombination({ originalPrice: 1000, shippingFee: 0, coupons: [optA, optB], stackRules: [rule] })
    // Best combo: both stacked → payNow=920, effectiveNet=820
    expect(result.effectiveNet).toBe(820)
    expect(result.usedCombination).toHaveLength(2)
  })

  it('handles zero shipping fee correctly', () => {
    const shipping = makeCoupon({ tier: 3, type: 'shipping', discount_value: 50 })
    const result = solveBestCombination({ originalPrice: 500, shippingFee: 0, coupons: [shipping], stackRules: [rule] })
    // Shipping coupon has no effect on free shipping, payNow stays same as baseline
    expect(result.payNow).toBe(500)
    // But solver still "uses" the shipping coupon since effectiveNet is equal
    // The coupon gives 0 discount — baseline (no combo) wins on equal effectiveNet + payNow
    expect(result.usedCombination).toHaveLength(0)
  })

  it('respects originalPrice in PriceResult', () => {
    const coupon = makeCoupon({ tier: 1, type: 'fixed', discount_value: 200 })
    const result = solveBestCombination({ originalPrice: 1000, shippingFee: 0, coupons: [coupon], stackRules: [rule] })
    expect(result.originalPrice).toBe(1000)
  })

  it('returns correct result for max_discount cap scenario', () => {
    // 30% of 1000 = 300, capped at 120
    const coupon = makeCoupon({ tier: 1, type: 'percent', discount_value: 30, max_discount: 120 })
    const result = solveBestCombination({ originalPrice: 1000, shippingFee: 0, coupons: [coupon], stackRules: [rule] })
    expect(result.payNow).toBe(880) // 1000 - 120
  })
})
