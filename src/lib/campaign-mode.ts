// src/lib/campaign-mode.ts
// TASK 2.13 — Campaign Mode System (Peak Traffic)
//
// Strategy (no extra infra required):
//   1. isPeakMode()       — true when PEAK_MODE=true OR campaign context ≠ normal
//   2. getPeakConfig()    — throttle limits + extended TTLs for peak periods
//   3. withPeakFallback() — runs heavy query with timeout; returns stale cache on failure

import { getCampaignContext, type CampaignType } from './campaign-context'
import { cache, CACHE_TTL } from './cache'

// ---------------------------------------------------------------------------
// Peak detection
// ---------------------------------------------------------------------------

/** Campaign types that trigger peak mode automatically (without env flag). */
const PEAK_CAMPAIGN_TYPES: CampaignType[] = ['double_date', 'payday']

/**
 * Returns true if the system is in peak traffic mode.
 * Activated by:
 *   - env var PEAK_MODE=true (manual override by admin)
 *   - current date is double_date or payday (automatic)
 */
export function isPeakMode(date: Date = new Date()): boolean {
  if (process.env.PEAK_MODE === 'true') return true
  const ctx = getCampaignContext(date)
  return PEAK_CAMPAIGN_TYPES.includes(ctx.type)
}

// ---------------------------------------------------------------------------
// Peak configuration
// ---------------------------------------------------------------------------

export interface PeakConfig {
  /** Max heavy queries (Combination Solver) per IP per second */
  throttleRpsPerIp: number
  /** TTL multiplier for product + coupon cache during peak */
  cacheTtlMultiplier: number
  /** Extended product cache TTL (ms) */
  productCacheTtlMs: number
  /** Extended coupon cache TTL (ms) */
  couponCacheTtlMs: number
  /** Timeout for heavy DB queries before falling back to cache (ms) */
  heavyQueryTimeoutMs: number
  /** Label shown to user when serving stale cache */
  staleLabel: string
}

const NORMAL_CONFIG: PeakConfig = {
  throttleRpsPerIp:     10,
  cacheTtlMultiplier:   1,
  productCacheTtlMs:    CACHE_TTL.PRODUCTS,      // 5 min
  couponCacheTtlMs:     CACHE_TTL.COUPONS,       // 5 min
  heavyQueryTimeoutMs:  5_000,
  staleLabel:           '',
}

const PEAK_CONFIG: PeakConfig = {
  throttleRpsPerIp:     3,
  cacheTtlMultiplier:   3,
  productCacheTtlMs:    CACHE_TTL.PRODUCTS  * 3, // 15 min
  couponCacheTtlMs:     CACHE_TTL.COUPONS   * 3, // 15 min
  heavyQueryTimeoutMs:  3_000,
  staleLabel:           'อัปเดตล่าสุด 15 นาทีที่แล้ว',
}

/** Returns the active config based on current mode. */
export function getPeakConfig(date: Date = new Date()): PeakConfig {
  return isPeakMode(date) ? PEAK_CONFIG : NORMAL_CONFIG
}

// ---------------------------------------------------------------------------
// Static fallback wrapper
// ---------------------------------------------------------------------------

export interface FallbackResult<T> {
  data: T
  stale: boolean
  staleLabel: string
}

/**
 * Runs `loader()` with a timeout.
 * On success: stores result in cache and returns it.
 * On timeout/error: returns previously cached value (stale) if available.
 * Throws only when both loader and cache miss.
 *
 * @param cacheKey  - unique cache key for this query
 * @param loader    - async function that fetches fresh data
 * @param date      - used to determine peak config (default: now)
 */
export async function withPeakFallback<T>(
  cacheKey: string,
  loader: () => Promise<T>,
  date: Date = new Date(),
): Promise<FallbackResult<T>> {
  const config = getPeakConfig(date)

  // 1. Race loader against timeout
  let fresh: T | null = null
  let loaderFailed = false

  try {
    fresh = await Promise.race([
      loader(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), config.heavyQueryTimeoutMs),
      ),
    ])
  } catch {
    loaderFailed = true
  }

  if (!loaderFailed && fresh !== null) {
    // Store fresh result with peak-aware TTL
    cache.set(cacheKey, fresh, config.productCacheTtlMs)
    return { data: fresh, stale: false, staleLabel: '' }
  }

  // 2. Loader failed — try stale cache
  const staleData = cache.get<T>(cacheKey)
  if (staleData !== null) {
    return { data: staleData, stale: true, staleLabel: config.staleLabel }
  }

  // 3. Both failed — propagate
  throw new Error(`[campaign-mode] cache miss and loader failed for key: ${cacheKey}`)
}

// ---------------------------------------------------------------------------
// Pre-warm helpers
// ---------------------------------------------------------------------------

export const PREWARM_CACHE_KEY = {
  TOP_PRODUCTS: 'prewarm:top_products',
  TOP_COUPONS:  'prewarm:top_coupons',
} as const

/** TTL for pre-warmed entries: 2 hours (survives the peak window). */
export const PREWARM_TTL_MS = 2 * 60 * 60_000
