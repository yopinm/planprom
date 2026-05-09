// Eligibility Filter — Layer 3 of the Search & Deal Optimization Engine
//
// Responsibilities:
//   1. filterEligibleCoupons() — filter by expire_at / min_spend / user_segment / category
//   2. canStack()              — validate coupon combinations against coupon_stack_rules

import type { Coupon, CouponStackRule, UserSegment } from '@/types'

// ---------------------------------------------------------------------------
// Context passed to the filter — describes the current user + order
// ---------------------------------------------------------------------------
export interface EligibilityContext {
  /** Order total (baht) used for min_spend check */
  orderTotal: number
  /** Current user's segment */
  userSegment: UserSegment
  /** Product category — undefined means "unknown / not applicable" */
  category?: string
  /** Override for deterministic testing; defaults to new Date() */
  now?: Date
}

// ---------------------------------------------------------------------------
// Individual predicates (exported for unit testing)
// ---------------------------------------------------------------------------

/** Returns true when coupon is past its expiry date */
export function isExpired(coupon: Coupon, now: Date): boolean {
  if (!coupon.expire_at) return false
  return new Date(coupon.expire_at) < now
}

/** Returns true when orderTotal satisfies the coupon's minimum spend */
export function meetsMinSpend(coupon: Coupon, orderTotal: number): boolean {
  return orderTotal >= coupon.min_spend
}

/**
 * Returns true when the coupon is valid for the given user segment.
 * 'all' coupons apply to every user.
 */
export function matchesSegment(coupon: Coupon, userSegment: UserSegment): boolean {
  if (coupon.user_segment === 'all') return true
  return coupon.user_segment === userSegment
}

/**
 * Returns true when the coupon applies to the product's category.
 * An empty applicable_categories array means the coupon applies to all categories.
 */
export function matchesCategory(coupon: Coupon, category?: string): boolean {
  if (coupon.applicable_categories.length === 0) return true
  if (!category) return false
  return coupon.applicable_categories.includes(category)
}

// ---------------------------------------------------------------------------
// Main filter
// ---------------------------------------------------------------------------

/**
 * Filters a list of coupons down to those eligible for the current context.
 * Order of checks: is_active → expired → min_spend → segment → category
 */
export function filterEligibleCoupons(
  coupons: Coupon[],
  context: EligibilityContext,
): Coupon[] {
  const now = context.now ?? new Date()

  return coupons.filter(coupon => {
    if (!coupon.is_active) return false
    if (isExpired(coupon, now)) return false
    if (!meetsMinSpend(coupon, context.orderTotal)) return false
    if (!matchesSegment(coupon, context.userSegment)) return false
    if (!matchesCategory(coupon, context.category)) return false
    return true
  })
}

// ---------------------------------------------------------------------------
// Stack validator
// ---------------------------------------------------------------------------

/**
 * Returns true when the given coupon set can be stacked together.
 *
 * Rules (evaluated in order):
 *   1. 0 or 1 coupon  → always ok (no stacking needed)
 *   2. Every coupon must have can_stack = true
 *   3. An active CouponStackRule must exist that:
 *        a. Matches the platform (rule.platform 'all' covers every platform)
 *        b. Includes every coupon's tier in allowed_tiers
 *        c. max_stack >= number of coupons being stacked
 */
export function canStack(
  coupons: Coupon[],
  rules: CouponStackRule[],
): boolean {
  if (coupons.length <= 1) return true

  // All coupons must permit stacking
  if (coupons.some(c => !c.can_stack)) return false

  const platforms = new Set(coupons.map(c => c.platform))

  const matchingRule = rules.find(rule => {
    if (!rule.is_active) return false

    // Platform match: 'all' covers every combination
    if (rule.platform !== 'all') {
      // A platform-specific rule only applies to a single-platform set
      if (platforms.size > 1) return false
      if (!platforms.has(rule.platform as 'shopee' | 'lazada')) return false
    }

    // Every coupon's tier must be in allowed_tiers
    if (!coupons.every(c => rule.allowed_tiers.includes(c.tier))) return false

    // Must not exceed max_stack
    if (coupons.length > rule.max_stack) return false

    return true
  })

  return matchingRule !== undefined
}
