import { describe, expect, it } from 'vitest'
import {
  CACHE_POLICY,
  buildActiveCouponsCacheKey,
  buildActiveStackRulesCacheKey,
  buildProductsCacheKey,
  getSearchCacheControlHeader,
  getValidCachePrefixes,
  normalizeCachePrefix,
} from '../cache-policy'

describe('TASK 4.2-PREP cache policy registry', () => {
  it('centralizes TTLs and invalidation prefixes', () => {
    expect(CACHE_POLICY.PRODUCTS.prefix).toBe('products:')
    expect(CACHE_POLICY.COUPONS.ttlMs).toBe(5 * 60_000)
    expect(getValidCachePrefixes()).toEqual([
      'products:',
      'coupons:',
      'stack_rules:',
      'bank_promos:',
    ])
  })

  it('builds stable cache keys for search dependencies', () => {
    expect(buildProductsCacheKey(' iPhone 15 Pro ', 'Shopee')).toBe('products:shopee:iphone-15-pro')
    expect(buildActiveCouponsCacheKey()).toBe('coupons:active')
    expect(buildActiveStackRulesCacheKey()).toBe('stack_rules:active')
  })

  it('normalizes admin invalidation prefixes safely', () => {
    expect(normalizeCachePrefix('products')).toBe('products:')
    expect(normalizeCachePrefix('coupons:')).toBe('coupons:')
    expect(normalizeCachePrefix('unknown')).toBeNull()
  })

  it('defines the search CDN stale-while-revalidate header', () => {
    expect(getSearchCacheControlHeader()).toBe('public, s-maxage=300, stale-while-revalidate=600')
  })
})
