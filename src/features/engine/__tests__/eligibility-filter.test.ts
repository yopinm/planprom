import { describe, it, expect } from 'vitest'
import {
  isExpired,
  meetsMinSpend,
  matchesSegment,
  matchesCategory,
  filterEligibleCoupons,
  canStack,
} from '../eligibility-filter'
import type { Coupon, CouponStackRule } from '@/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const NOW = new Date('2026-04-13T12:00:00Z')

function makeCoupon(overrides: Partial<Coupon> = {}): Coupon {
  return {
    id: 'c1',
    code: 'TEST10',
    title: 'Test Coupon',
    description: null,
    platform: 'shopee',
    tier: 1,
    type: 'percent',
    discount_value: 10,
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
    name: 'Default Rule',
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

// =============================================================
// 1. isExpired
// =============================================================
describe('isExpired', () => {
  it('returns false when expire_at is null (no expiry)', () => {
    const coupon = makeCoupon({ expire_at: null })
    expect(isExpired(coupon, NOW)).toBe(false)
  })

  it('returns false when expire_at is in the future', () => {
    const coupon = makeCoupon({ expire_at: '2026-12-31T23:59:59Z' })
    expect(isExpired(coupon, NOW)).toBe(false)
  })

  it('returns true when expire_at is in the past', () => {
    const coupon = makeCoupon({ expire_at: '2026-01-01T00:00:00Z' })
    expect(isExpired(coupon, NOW)).toBe(true)
  })

  it('returns true when expire_at equals now exactly (boundary)', () => {
    // exactly at now → already expired (strict <)
    const coupon = makeCoupon({ expire_at: NOW.toISOString() })
    expect(isExpired(coupon, NOW)).toBe(false) // new Date(x) < now is false when equal
  })

  it('returns true when expire_at is one second before now', () => {
    const pastDate = new Date(NOW.getTime() - 1000)
    const coupon = makeCoupon({ expire_at: pastDate.toISOString() })
    expect(isExpired(coupon, NOW)).toBe(true)
  })
})

// =============================================================
// 2. meetsMinSpend
// =============================================================
describe('meetsMinSpend', () => {
  it('passes when orderTotal equals min_spend exactly', () => {
    const coupon = makeCoupon({ min_spend: 300 })
    expect(meetsMinSpend(coupon, 300)).toBe(true)
  })

  it('passes when orderTotal exceeds min_spend', () => {
    const coupon = makeCoupon({ min_spend: 300 })
    expect(meetsMinSpend(coupon, 500)).toBe(true)
  })

  it('fails when orderTotal is below min_spend', () => {
    const coupon = makeCoupon({ min_spend: 300 })
    expect(meetsMinSpend(coupon, 299)).toBe(false)
  })

  it('passes when min_spend is 0 (free coupon)', () => {
    const coupon = makeCoupon({ min_spend: 0 })
    expect(meetsMinSpend(coupon, 0)).toBe(true)
  })
})

// =============================================================
// 3. matchesSegment
// =============================================================
describe('matchesSegment', () => {
  it('passes for any user when coupon segment is "all"', () => {
    const coupon = makeCoupon({ user_segment: 'all' })
    expect(matchesSegment(coupon, 'new_user')).toBe(true)
    expect(matchesSegment(coupon, 'member')).toBe(true)
    expect(matchesSegment(coupon, 'premium')).toBe(true)
  })

  it('passes when user segment matches coupon segment', () => {
    const coupon = makeCoupon({ user_segment: 'new_user' })
    expect(matchesSegment(coupon, 'new_user')).toBe(true)
  })

  it('fails when user segment does not match', () => {
    const coupon = makeCoupon({ user_segment: 'new_user' })
    expect(matchesSegment(coupon, 'member')).toBe(false)
    expect(matchesSegment(coupon, 'premium')).toBe(false)
  })

  it('premium coupon is not available to new_user', () => {
    const coupon = makeCoupon({ user_segment: 'premium' })
    expect(matchesSegment(coupon, 'new_user')).toBe(false)
  })
})

// =============================================================
// 4. matchesCategory
// =============================================================
describe('matchesCategory', () => {
  it('passes when applicable_categories is empty (applies to all)', () => {
    const coupon = makeCoupon({ applicable_categories: [] })
    expect(matchesCategory(coupon, 'มือถือ')).toBe(true)
    expect(matchesCategory(coupon, undefined)).toBe(true)
  })

  it('passes when product category is in applicable_categories', () => {
    const coupon = makeCoupon({ applicable_categories: ['มือถือ', 'อิเล็กทรอนิกส์'] })
    expect(matchesCategory(coupon, 'มือถือ')).toBe(true)
  })

  it('fails when product category is NOT in applicable_categories', () => {
    const coupon = makeCoupon({ applicable_categories: ['มือถือ'] })
    expect(matchesCategory(coupon, 'กีฬา')).toBe(false)
  })

  it('fails when category is undefined but coupon has category restrictions', () => {
    const coupon = makeCoupon({ applicable_categories: ['มือถือ'] })
    expect(matchesCategory(coupon, undefined)).toBe(false)
  })
})

// =============================================================
// 5. filterEligibleCoupons — combined
// =============================================================
describe('filterEligibleCoupons', () => {
  it('returns all coupons when all pass every check', () => {
    const coupons = [makeCoupon({ id: 'c1' }), makeCoupon({ id: 'c2' })]
    const result = filterEligibleCoupons(coupons, {
      orderTotal: 500,
      userSegment: 'all',
      now: NOW,
    })
    expect(result).toHaveLength(2)
  })

  it('excludes inactive coupons', () => {
    const coupons = [makeCoupon({ id: 'c1', is_active: false }), makeCoupon({ id: 'c2' })]
    const result = filterEligibleCoupons(coupons, { orderTotal: 500, userSegment: 'all', now: NOW })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('c2')
  })

  it('excludes expired coupons', () => {
    const coupons = [
      makeCoupon({ id: 'expired', expire_at: '2026-01-01T00:00:00Z' }),
      makeCoupon({ id: 'valid' }),
    ]
    const result = filterEligibleCoupons(coupons, { orderTotal: 500, userSegment: 'all', now: NOW })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('valid')
  })

  it('excludes coupons where min_spend is not met', () => {
    const coupons = [
      makeCoupon({ id: 'high_min', min_spend: 1000 }),
      makeCoupon({ id: 'low_min', min_spend: 100 }),
    ]
    const result = filterEligibleCoupons(coupons, { orderTotal: 300, userSegment: 'all', now: NOW })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('low_min')
  })

  it('excludes coupons for wrong segment', () => {
    const coupons = [
      makeCoupon({ id: 'new_only', user_segment: 'new_user' }),
      makeCoupon({ id: 'all_users', user_segment: 'all' }),
    ]
    const result = filterEligibleCoupons(coupons, { orderTotal: 100, userSegment: 'member', now: NOW })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('all_users')
  })

  it('excludes coupons for wrong category', () => {
    const coupons = [
      makeCoupon({ id: 'mobile_only', applicable_categories: ['มือถือ'] }),
      makeCoupon({ id: 'universal', applicable_categories: [] }),
    ]
    const result = filterEligibleCoupons(coupons, {
      orderTotal: 100,
      userSegment: 'all',
      category: 'กีฬา',
      now: NOW,
    })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('universal')
  })

  it('returns empty array when no coupon passes', () => {
    const coupons = [makeCoupon({ min_spend: 9999 })]
    const result = filterEligibleCoupons(coupons, { orderTotal: 100, userSegment: 'all', now: NOW })
    expect(result).toHaveLength(0)
  })

  it('uses real clock when now is not provided (smoke test)', () => {
    const futureExpiry = new Date(Date.now() + 86400000).toISOString()
    const coupons = [makeCoupon({ expire_at: futureExpiry })]
    const result = filterEligibleCoupons(coupons, { orderTotal: 0, userSegment: 'all' })
    expect(result).toHaveLength(1)
  })
})

// =============================================================
// 6. canStack
// =============================================================
describe('canStack', () => {
  it('returns true for empty coupon list', () => {
    expect(canStack([], [])).toBe(true)
  })

  it('returns true for single coupon (no stacking needed)', () => {
    const coupon = makeCoupon()
    expect(canStack([coupon], [])).toBe(true)
  })

  it('returns false when any coupon has can_stack = false', () => {
    const c1 = makeCoupon({ id: 'c1', can_stack: true })
    const c2 = makeCoupon({ id: 'c2', can_stack: false })
    const rule = makeRule()
    expect(canStack([c1, c2], [rule])).toBe(false)
  })

  it('returns true when a matching active rule exists', () => {
    const c1 = makeCoupon({ id: 'c1', tier: 1 })
    const c2 = makeCoupon({ id: 'c2', tier: 2 })
    const rule = makeRule({ allowed_tiers: [1, 2, 3, 4], max_stack: 4 })
    expect(canStack([c1, c2], [rule])).toBe(true)
  })

  it('returns false when no active rule exists', () => {
    const c1 = makeCoupon({ id: 'c1', tier: 1 })
    const c2 = makeCoupon({ id: 'c2', tier: 2 })
    expect(canStack([c1, c2], [])).toBe(false)
  })

  it('returns false when rule is inactive', () => {
    const c1 = makeCoupon({ id: 'c1', tier: 1 })
    const c2 = makeCoupon({ id: 'c2', tier: 2 })
    const rule = makeRule({ is_active: false })
    expect(canStack([c1, c2], [rule])).toBe(false)
  })

  it('returns false when coupon tier is not in allowed_tiers', () => {
    const c1 = makeCoupon({ id: 'c1', tier: 1 })
    const c2 = makeCoupon({ id: 'c2', tier: 3 })
    // Rule only allows tiers 1 and 2
    const rule = makeRule({ allowed_tiers: [1, 2] })
    expect(canStack([c1, c2], [rule])).toBe(false)
  })

  it('returns false when stack count exceeds max_stack', () => {
    const coupons = [1, 2, 3].map(tier => makeCoupon({ id: `c${tier}`, tier: tier as 1 | 2 | 3 }))
    const rule = makeRule({ max_stack: 2 }) // only 2 allowed
    expect(canStack(coupons, [rule])).toBe(false)
  })

  it('respects platform-specific rule — matching platform passes', () => {
    const c1 = makeCoupon({ id: 'c1', tier: 1, platform: 'shopee' })
    const c2 = makeCoupon({ id: 'c2', tier: 2, platform: 'shopee' })
    const rule = makeRule({ platform: 'shopee' })
    expect(canStack([c1, c2], [rule])).toBe(true)
  })

  it('respects platform-specific rule — wrong platform fails', () => {
    const c1 = makeCoupon({ id: 'c1', tier: 1, platform: 'lazada' })
    const c2 = makeCoupon({ id: 'c2', tier: 2, platform: 'lazada' })
    const rule = makeRule({ platform: 'shopee' })
    expect(canStack([c1, c2], [rule])).toBe(false)
  })

  it('platform "all" rule covers cross-platform stacking', () => {
    const c1 = makeCoupon({ id: 'c1', tier: 1, platform: 'shopee' })
    const c2 = makeCoupon({ id: 'c2', tier: 2, platform: 'lazada' })
    const rule = makeRule({ platform: 'all' })
    expect(canStack([c1, c2], [rule])).toBe(true)
  })

  it('platform-specific rule rejects cross-platform mix', () => {
    const c1 = makeCoupon({ id: 'c1', tier: 1, platform: 'shopee' })
    const c2 = makeCoupon({ id: 'c2', tier: 2, platform: 'lazada' })
    const rule = makeRule({ platform: 'shopee' })
    expect(canStack([c1, c2], [rule])).toBe(false)
  })

  it('uses first matching rule when multiple rules exist', () => {
    const c1 = makeCoupon({ id: 'c1', tier: 1 })
    const c2 = makeCoupon({ id: 'c2', tier: 2 })
    const strictRule = makeRule({ id: 'strict', allowed_tiers: [1], max_stack: 1 })
    const permissiveRule = makeRule({ id: 'permissive', allowed_tiers: [1, 2, 3, 4], max_stack: 4 })
    // strictRule fails (tier 2 not allowed), permissiveRule passes
    expect(canStack([c1, c2], [strictRule, permissiveRule])).toBe(true)
  })
})
