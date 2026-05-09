// src/lib/cache.ts
// TASK 2.11 — Caching Layer
//
// Generic TTL cache with a Redis-ready interface.
//
// Current implementation: InMemoryCacheStore (Map-based, no dependencies).
// Production swap:        Replace with RedisCacheStore when REDIS_URL is set.
//                         The interface is identical — callers need no changes.
//
// Pre-built namespaced helpers (avoid magic strings at call sites):
//   ProductCache       — TTL 5 min
//   CouponCache        — TTL 5 min
//   StackRuleCache     — TTL 10 min
//   BankPromoCache     — TTL 1 hr
//
// Invalidation:
//   cache.del(key)         — single key
//   cache.delPattern(pfx)  — all keys starting with prefix
//   cache.clear()          — full flush (admin only)

// ---------------------------------------------------------------------------
// TTL constants (ms)
// ---------------------------------------------------------------------------

export const CACHE_TTL = {
  PRODUCTS:     5  * 60_000,  // 5 min
  COUPONS:      5  * 60_000,  // 5 min
  STACK_RULES:  10 * 60_000,  // 10 min
  BANK_PROMOS:  60 * 60_000,  // 1 hr
} as const

// ---------------------------------------------------------------------------
// Interface (swap to RedisStore without touching callers)
// ---------------------------------------------------------------------------

export interface CacheStore {
  get<T>(key: string): T | null
  set<T>(key: string, value: T, ttlMs: number): void
  del(key: string): void
  /** Delete all keys that start with `prefix` */
  delPattern(prefix: string): void
  clear(): void
  /** For monitoring — number of live entries */
  size(): number
}

// ---------------------------------------------------------------------------
// In-memory implementation
// ---------------------------------------------------------------------------

interface CacheEntry<T> {
  value:     T
  expiresAt: number
}

class InMemoryCacheStore implements CacheStore {
  private map = new Map<string, CacheEntry<unknown>>()

  get<T>(key: string): T | null {
    const entry = this.map.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
      this.map.delete(key)
      return null
    }
    return entry.value as T
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    this.map.set(key, { value, expiresAt: Date.now() + ttlMs })
    // Lazy cleanup: if map grows large, evict expired entries
    if (this.map.size > 5_000) this.evictExpired()
  }

  del(key: string): void {
    this.map.delete(key)
  }

  delPattern(prefix: string): void {
    for (const key of this.map.keys()) {
      if (key.startsWith(prefix)) this.map.delete(key)
    }
  }

  clear(): void {
    this.map.clear()
  }

  size(): number {
    return this.map.size
  }

  private evictExpired(): void {
    const now = Date.now()
    for (const [key, entry] of this.map) {
      if (now > entry.expiresAt) this.map.delete(key)
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton — module-level (survives hot reload in dev, not across workers)
// In production with multiple instances, swap for Redis to share state.
// ---------------------------------------------------------------------------

export const cache: CacheStore = new InMemoryCacheStore()

// ---------------------------------------------------------------------------
// Namespaced helpers
// ---------------------------------------------------------------------------

/** Cache key prefixes — used for pattern-based invalidation */
export const CACHE_PREFIX = {
  PRODUCTS:    'products:',
  COUPONS:     'coupons:',
  STACK_RULES: 'stack_rules:',
  BANK_PROMOS: 'bank_promos:',
} as const

/**
 * getOrSet — fetch from cache; on miss call `loader()`, store result, return it.
 * @param key   - full cache key (include platform/query discriminators)
 * @param ttlMs - TTL in ms
 * @param loader - async function that returns the fresh value
 */
export async function getOrSet<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<T> {
  const cached = cache.get<T>(key)
  if (cached !== null) return cached

  const fresh = await loader()
  cache.set(key, fresh, ttlMs)
  return fresh
}
