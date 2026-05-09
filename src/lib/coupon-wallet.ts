// src/lib/coupon-wallet.ts
// TASK 2.7 — Coupon Wallet helpers (server-side only)
//
// Data queries use direct PostgreSQL; callers must pass the authenticated user id.
//
// auto-pick uses the Phase 1 Combination Solver so wallet coupons
// stack optimally with platform/store coupons already in the system.

import { filterEligibleCoupons } from '@/features/engine/eligibility-filter'
import { solveBestCombination }   from '@/features/engine/combination-solver'
import { db } from '@/lib/db'
import type { CouponWallet, WalletDiscountType }   from '@/types'
import type { Coupon, CouponStackRule } from '@/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AddWalletInput {
  code: string
  title: string
  discount_type: WalletDiscountType
  discount_value: number
  min_spend?: number
  platform?: 'shopee' | 'lazada' | 'all'
  expire_at?: string | null
}

export interface AutoPickResult {
  /** Wallet coupons converted + picked by the Combination Solver */
  pickedCoupons: Coupon[]
  payNow: number
  effectiveNet: number
  savings: number
}

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

/**
 * List all wallet coupons for the authenticated user.
 * Sorted: non-expired first (expire_at ASC nulls last), then expired.
 */
export async function getWallet(
  userId: string,
): Promise<CouponWallet[]> {
  return db<CouponWallet[]>`
    SELECT *
    FROM coupon_wallet
    WHERE user_ref = ${userId}
      AND is_used = false
      AND (expire_at IS NULL OR expire_at > NOW())
    ORDER BY expire_at ASC NULLS LAST
  `
}

/**
 * Return wallet coupons expiring within `hours` hours.
 * Used for near-expiry highlight in the UI.
 */
export async function getNearExpiry(
  userId: string,
  hours = 48,
): Promise<CouponWallet[]> {
  const cutoff = new Date(Date.now() + hours * 3_600_000).toISOString()

  return db<CouponWallet[]>`
    SELECT *
    FROM coupon_wallet
    WHERE user_ref = ${userId}
      AND is_used = false
      AND expire_at IS NOT NULL
      AND expire_at <= ${cutoff}
      AND expire_at >= ${new Date().toISOString()}
    ORDER BY expire_at ASC
  `
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/** Save a new coupon to the user's wallet. */
export async function addToWallet(
  userId: string,
  input: AddWalletInput,
): Promise<CouponWallet> {
  const row = {
    user_ref:       userId,
    code:           input.code.trim().toUpperCase(),
    title:          input.title.trim(),
    discount_type:  input.discount_type,
    discount_value: input.discount_value,
    min_spend:      input.min_spend ?? 0,
    platform:       input.platform ?? 'all',
    expire_at:      input.expire_at ?? null,
    is_used:        false,
  }

  const [data] = await db<CouponWallet[]>`
    INSERT INTO coupon_wallet (
      user_ref,
      code,
      title,
      discount_type,
      discount_value,
      min_spend,
      platform,
      expire_at,
      is_used
    )
    VALUES (
      ${row.user_ref},
      ${row.code},
      ${row.title},
      ${row.discount_type},
      ${row.discount_value},
      ${row.min_spend},
      ${row.platform},
      ${row.expire_at},
      ${row.is_used}
    )
    RETURNING *
  `

  if (!data) throw new Error('Failed to add coupon to wallet')
  return data
}

/** Remove a coupon from the wallet (owner-only, enforced by RLS). */
export async function removeFromWallet(
  userId: string,
  couponId: string,
): Promise<void> {
  await db`
    DELETE FROM coupon_wallet
    WHERE id = ${couponId}
      AND user_ref = ${userId}
  `
}

// ---------------------------------------------------------------------------
// Auto-pick — Combination Solver integration
// ---------------------------------------------------------------------------

/**
 * Convert a CouponWallet row to the Coupon shape that the Combination Solver
 * expects. Wallet coupons are treated as Tier 1 (store/seller coupon).
 */
export function walletCouponToCoupon(wc: CouponWallet): Coupon {
  return {
    id:                   wc.id,
    code:                 wc.code,
    title:                wc.title,
    description:          null,
    platform:             wc.platform ?? 'all',
    tier:                 1,           // wallet coupons = Tier 1 store coupon
    type:                 wc.discount_type,
    discount_value:       wc.discount_value,
    max_discount:         null,
    min_spend:            wc.min_spend,
    applicable_categories: [],         // applies to all categories
    can_stack:            true,
    user_segment:         'all',
    expire_at:            wc.expire_at,
    is_active:            true,
    source:               'wallet',
    created_at:           wc.created_at,
    updated_at:           wc.created_at,
  }
}

/**
 * Auto-pick the best wallet coupons for a given product price using the
 * Phase 1 Combination Solver.
 *
 * @param walletCoupons - all wallet coupons for the user
 * @param originalPrice - product's current price (before discount)
 * @param platform      - product platform for eligibility filtering
 * @param stackRules    - coupon_stack_rules from DB (can be [] for wallet-only)
 * @param shippingFee   - default 40 (Shopee/Lazada standard)
 */
export function autoPickBestWalletCoupons(
  walletCoupons: CouponWallet[],
  originalPrice: number,
  platform: 'shopee' | 'lazada',
  stackRules: CouponStackRule[],
  shippingFee = 40,
): AutoPickResult {
  const coupons = walletCoupons.map(walletCouponToCoupon)

  // Filter by platform manually (wallet coupons already carry platform field)
  const platformFiltered = coupons.filter(
    c => c.platform === 'all' || c.platform === platform,
  )

  const eligible = filterEligibleCoupons(platformFiltered, {
    orderTotal:  originalPrice,
    userSegment: 'all',
  })

  const priceResult = solveBestCombination({
    originalPrice,
    shippingFee,
    coupons: eligible,
    stackRules,
  })

  return {
    pickedCoupons: priceResult.usedCombination,
    payNow:        priceResult.payNow,
    effectiveNet:  priceResult.effectiveNet,
    savings:       originalPrice - priceResult.effectiveNet,
  }
}
