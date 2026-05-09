import { CACHE_PREFIX, CACHE_TTL } from '@/lib/cache'

export interface CachePolicy {
  prefix: string
  ttlMs: number
  invalidationScope: 'product' | 'coupon' | 'rule' | 'promotion'
  reason: string
}

export interface CdnCachePolicy {
  maxAgeSeconds: number
  staleWhileRevalidateSeconds: number
}

export const CACHE_POLICY = {
  PRODUCTS: {
    prefix: CACHE_PREFIX.PRODUCTS,
    ttlMs: CACHE_TTL.PRODUCTS,
    invalidationScope: 'product',
    reason: 'Product name, price, stock, and affiliate URL can change frequently.',
  },
  COUPONS: {
    prefix: CACHE_PREFIX.COUPONS,
    ttlMs: CACHE_TTL.COUPONS,
    invalidationScope: 'coupon',
    reason: 'Coupon activation and expiry need quick admin invalidation.',
  },
  STACK_RULES: {
    prefix: CACHE_PREFIX.STACK_RULES,
    ttlMs: CACHE_TTL.STACK_RULES,
    invalidationScope: 'rule',
    reason: 'Combination rules change less often than product and coupon rows.',
  },
  BANK_PROMOS: {
    prefix: CACHE_PREFIX.BANK_PROMOS,
    ttlMs: CACHE_TTL.BANK_PROMOS,
    invalidationScope: 'promotion',
    reason: 'Bank promotions are public campaign data with slower churn.',
  },
} as const satisfies Record<string, CachePolicy>

export const SEARCH_CDN_CACHE_POLICY: CdnCachePolicy = {
  maxAgeSeconds: 300,
  staleWhileRevalidateSeconds: 600,
}

export function buildProductsCacheKey(query: string, platform = 'all'): string {
  const normalizedQuery = normalizeCacheSegment(query, 50)
  const normalizedPlatform = normalizeCacheSegment(platform || 'all', 24)
  return `${CACHE_POLICY.PRODUCTS.prefix}${normalizedPlatform}:${normalizedQuery}`
}

export function buildActiveCouponsCacheKey(): string {
  return `${CACHE_POLICY.COUPONS.prefix}active`
}

export function buildActiveStackRulesCacheKey(): string {
  return `${CACHE_POLICY.STACK_RULES.prefix}active`
}

export function getValidCachePrefixes(): string[] {
  return Object.values(CACHE_POLICY).map(policy => policy.prefix)
}

export function normalizeCachePrefix(input: string): string | null {
  const normalized = input.endsWith(':') ? input : `${input}:`
  return getValidCachePrefixes().includes(normalized) ? normalized : null
}

export function getSearchCacheControlHeader(): string {
  const { maxAgeSeconds, staleWhileRevalidateSeconds } = SEARCH_CDN_CACHE_POLICY
  return `public, s-maxage=${maxAgeSeconds}, stale-while-revalidate=${staleWhileRevalidateSeconds}`
}

function normalizeCacheSegment(value: string, maxLength: number): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9ก-๙_-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength) || 'all'
}
