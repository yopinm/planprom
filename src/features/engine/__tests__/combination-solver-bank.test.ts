// Tests for TASK 1.6.2 — Tier 3 Bank Promotion in Combination Solver

import { describe, it, expect } from 'vitest'
import {
  applyBankPromotion,
  findBestBankPromotion,
  solveBestCombinationWithBank,
} from '../combination-solver'
import type { BankPromotion, Coupon, CouponStackRule } from '@/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const NOW = new Date('2026-04-13T12:00:00Z') // Monday (day_of_week = 1)

function makeBankPromo(overrides: Partial<BankPromotion> = {}): BankPromotion {
  return {
    id: 'bp-test',
    bank_name: 'KBank',
    platform: 'shopee',
    category: null,
    day_of_week: null,
    discount_type: 'cashback',
    discount_value: 5,
    max_discount: 200,
    min_spend: 300,
    description: 'KBank แคชแบ็ก 5%',
    valid_from: '2026-01-01',
    valid_until: '2026-12-31',
    is_active: true,
    created_at: '2026-04-13T00:00:00Z',
    ...overrides,
  }
}

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

const RULE = makeRule()

// =============================================================
// 1. applyBankPromotion
// =============================================================
describe('applyBankPromotion', () => {
  it('applies percent cashback correctly', () => {
    const promo = makeBankPromo({ discount_type: 'cashback', discount_value: 5, max_discount: 200, min_spend: 300 })
    expect(applyBankPromotion(promo, 1000)).toBe(50) // 5% of 1000
  })

  it('caps saving at max_discount', () => {
    const promo = makeBankPromo({ discount_type: 'cashback', discount_value: 10, max_discount: 80, min_spend: 0 })
    expect(applyBankPromotion(promo, 1000)).toBe(80) // 10% of 1000 = 100, capped at 80
  })

  it('applies fixed discount correctly', () => {
    const promo = makeBankPromo({ discount_type: 'fixed', discount_value: 100, max_discount: null, min_spend: 500 })
    expect(applyBankPromotion(promo, 800)).toBe(100)
  })

  it('returns 0 when payNow below min_spend', () => {
    const promo = makeBankPromo({ discount_type: 'cashback', discount_value: 5, min_spend: 500 })
    expect(applyBankPromotion(promo, 300)).toBe(0)
  })

  it('allows saving when payNow exactly meets min_spend', () => {
    const promo = makeBankPromo({ discount_type: 'cashback', discount_value: 10, max_discount: null, min_spend: 500 })
    expect(applyBankPromotion(promo, 500)).toBe(50)
  })

  it('rounds to 2 decimal places', () => {
    const promo = makeBankPromo({ discount_type: 'cashback', discount_value: 3, max_discount: null, min_spend: 0 })
    expect(applyBankPromotion(promo, 333)).toBe(9.99) // 3% of 333 = 9.99
  })

  it('applies percent type like cashback', () => {
    const promo = makeBankPromo({ discount_type: 'percent', discount_value: 15, max_discount: 300, min_spend: 1000 })
    expect(applyBankPromotion(promo, 1000)).toBe(150) // 15% of 1000
  })
})

// =============================================================
// 2. findBestBankPromotion
// =============================================================
describe('findBestBankPromotion', () => {
  it('returns null when no promotions', () => {
    const result = findBestBankPromotion([], 'shopee', 1000, undefined, undefined, NOW)
    expect(result).toBeNull()
  })

  it('returns the single matching promo', () => {
    const promo = makeBankPromo({ discount_value: 5, min_spend: 500 })
    const result = findBestBankPromotion([promo], 'shopee', 1000, undefined, undefined, NOW)
    expect(result?.promo.id).toBe('bp-test')
    expect(result?.saving).toBe(50) // 5% of 1000
  })

  it('returns null when platform does not match', () => {
    const promo = makeBankPromo({ platform: 'lazada' })
    const result = findBestBankPromotion([promo], 'shopee', 1000, undefined, undefined, NOW)
    expect(result).toBeNull()
  })

  it('matches when promo platform is "all"', () => {
    const promo = makeBankPromo({ platform: 'all' })
    const result = findBestBankPromotion([promo], 'shopee', 1000, undefined, undefined, NOW)
    expect(result).not.toBeNull()
  })

  it('filters by day_of_week — match passes', () => {
    // NOW is Monday (day_of_week=1)
    const promo = makeBankPromo({ day_of_week: 1 })
    const result = findBestBankPromotion([promo], 'shopee', 1000, undefined, 1, NOW)
    expect(result).not.toBeNull()
  })

  it('filters by day_of_week — mismatch blocked', () => {
    const promo = makeBankPromo({ day_of_week: 2 }) // Tuesday
    const result = findBestBankPromotion([promo], 'shopee', 1000, undefined, 1, NOW) // but Monday
    expect(result).toBeNull()
  })

  it('picks the promo with highest saving when multiple match', () => {
    const low  = makeBankPromo({ id: 'low',  bank_name: 'AEON',     discount_value: 3, min_spend: 0 })
    const high = makeBankPromo({ id: 'high', bank_name: 'KBank',    discount_value: 8, min_spend: 0 })
    const mid  = makeBankPromo({ id: 'mid',  bank_name: 'SCB',      discount_value: 5, min_spend: 0 })
    const result = findBestBankPromotion([low, high, mid], 'shopee', 1000, undefined, undefined, NOW)
    expect(result?.promo.id).toBe('high') // 8% of 1000 = 80 is biggest
  })

  it('returns null when best saving is 0 (all below min_spend)', () => {
    const promo = makeBankPromo({ min_spend: 5000 })
    const result = findBestBankPromotion([promo], 'shopee', 100, undefined, undefined, NOW)
    expect(result).toBeNull()
  })
})

// =============================================================
// 3. solveBestCombinationWithBank — key scenario tests
// =============================================================
describe('solveBestCombinationWithBank', () => {
  it('returns same as solveBestCombination when no bank promotions', () => {
    const coupon = makeCoupon({ tier: 1, type: 'fixed', discount_value: 100 })
    const result = solveBestCombinationWithBank({
      originalPrice: 1000, shippingFee: 0,
      coupons: [coupon], stackRules: [RULE],
      bankPromotions: [], now: NOW,
    })
    expect(result.payNow).toBe(900)
    expect(result.effectiveNet).toBe(900)
    expect(result.bankSaving).toBeUndefined()
  })

  it('applies bank cashback on top of coupon stack', () => {
    // Tier 1: Platform 10% off → 1000 - 100 = 900 payNow
    // Bank: 5% cashback on payNow 900 = 45 → effectiveNet = 855
    const platformCoupon = makeCoupon({ id: 't1', tier: 1, type: 'percent', discount_value: 10 })
    const bank = makeBankPromo({ discount_type: 'cashback', discount_value: 5, min_spend: 500, max_discount: 200 })

    const result = solveBestCombinationWithBank({
      originalPrice: 1000, shippingFee: 0,
      coupons: [platformCoupon], stackRules: [RULE],
      bankPromotions: [bank], now: NOW,
    })

    expect(result.payNow).toBe(900)       // Platform 10% only
    expect(result.bankSaving).toBe(45)    // 5% of 900
    expect(result.effectiveNet).toBe(855) // 900 - 45
    expect(result.bankPromotionId).toBe('bp-test')
  })

  // KEY SCENARIO: KBank 5% + Platform 10% + ส่งฟรี
  it('KBank 5% cashback + Platform 10% + free shipping stacked', () => {
    // Setup:
    //   originalPrice = 1000, shippingFee = 50
    //   Tier 1: Platform 10% off → -100 (item: 900)
    //   Tier 3: Free shipping (50 baht) → -50 (shipping: 0)
    //   Regular payNow = 900 + 0 = 900, effectiveNet = 900
    //   Bank: KBank 5% cashback on payNow 900 (min 500) → -45
    //   Final effectiveNet = 855

    const platform10 = makeCoupon({ id: 'platform', tier: 1, type: 'percent', discount_value: 10 })
    const freeShip   = makeCoupon({ id: 'shipping', tier: 3, type: 'shipping', discount_value: 50 })
    const kbank5pct  = makeBankPromo({
      id: 'bp-kbank',
      bank_name: 'KBank',
      discount_type: 'cashback',
      discount_value: 5,
      max_discount: 200,
      min_spend: 500,
    })

    const result = solveBestCombinationWithBank({
      originalPrice: 1000, shippingFee: 50,
      coupons: [platform10, freeShip], stackRules: [RULE],
      bankPromotions: [kbank5pct], now: NOW,
    })

    // Coupon stack result
    expect(result.payNow).toBe(900)      // 900 item + 0 shipping
    // Bank saving
    expect(result.bankSaving).toBe(45)   // 5% of 900
    // Final effective net
    expect(result.effectiveNet).toBe(855)
    // All 3 coupons used
    expect(result.usedCombination).toHaveLength(2) // platform + shipping
    expect(result.bankPromotionId).toBe('bp-kbank')
  })

  it('skips bank promo when payNow is below bank min_spend', () => {
    const coupon = makeCoupon({ tier: 1, type: 'fixed', discount_value: 900 })
    const bank   = makeBankPromo({ min_spend: 500 }) // payNow will be 100, too low

    const result = solveBestCombinationWithBank({
      originalPrice: 1000, shippingFee: 0,
      coupons: [coupon], stackRules: [RULE],
      bankPromotions: [bank], now: NOW,
    })

    expect(result.payNow).toBe(100)
    expect(result.bankSaving).toBeUndefined()
    expect(result.effectiveNet).toBe(100)
  })

  it('effectiveNet floors at 0 when bank saving > payNow', () => {
    const bank = makeBankPromo({ discount_type: 'fixed', discount_value: 9999, max_discount: null, min_spend: 0 })

    const result = solveBestCombinationWithBank({
      originalPrice: 100, shippingFee: 0,
      coupons: [], stackRules: [RULE],
      bankPromotions: [bank], now: NOW,
    })

    expect(result.effectiveNet).toBe(0)
  })

  it('picks the best bank promo when multiple qualify', () => {
    const low  = makeBankPromo({ id: 'low',  bank_name: 'AEON',  discount_value: 3, min_spend: 0 })
    const high = makeBankPromo({ id: 'high', bank_name: 'KBank', discount_value: 8, min_spend: 0 })

    const result = solveBestCombinationWithBank({
      originalPrice: 1000, shippingFee: 0,
      coupons: [], stackRules: [RULE],
      bankPromotions: [low, high], now: NOW,
    })

    expect(result.bankPromotionId).toBe('high')
    expect(result.bankSaving).toBe(80) // 8% of 1000
  })

  it('respects originalPrice in output', () => {
    const result = solveBestCombinationWithBank({
      originalPrice: 999, shippingFee: 0,
      coupons: [], stackRules: [RULE],
      bankPromotions: [], now: NOW,
    })
    expect(result.originalPrice).toBe(999)
  })
})
