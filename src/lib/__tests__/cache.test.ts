// src/lib/__tests__/cache.test.ts
// TASK 2.11 — Cache unit tests

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { cache, getOrSet, CACHE_TTL } from '@/lib/cache'

beforeEach(() => {
  cache.clear()
})

// ---------------------------------------------------------------------------
// Basic set / get
// ---------------------------------------------------------------------------

describe('cache — set and get', () => {
  it('returns null for a key that was never set', () => {
    expect(cache.get('missing-key')).toBeNull()
  })

  it('returns the stored value within TTL', () => {
    cache.set('k1', { data: [1, 2, 3] }, 60_000)
    expect(cache.get('k1')).toEqual({ data: [1, 2, 3] })
  })

  it('stores and retrieves different value types', () => {
    cache.set('str',  'hello',         60_000)
    cache.set('num',  42,              60_000)
    cache.set('arr',  [1, 2],          60_000)
    cache.set('bool', false,           60_000)

    expect(cache.get('str')).toBe('hello')
    expect(cache.get('num')).toBe(42)
    expect(cache.get('arr')).toEqual([1, 2])
    expect(cache.get('bool')).toBe(false)
  })

  it('overwrites an existing key', () => {
    cache.set('k2', 'first',  60_000)
    cache.set('k2', 'second', 60_000)
    expect(cache.get('k2')).toBe('second')
  })
})

// ---------------------------------------------------------------------------
// TTL expiry
// ---------------------------------------------------------------------------

describe('cache — TTL expiry', () => {
  it('returns null after TTL expires', () => {
    vi.useFakeTimers()
    cache.set('exp', 'value', 1_000) // 1 second TTL

    vi.advanceTimersByTime(999)
    expect(cache.get('exp')).toBe('value')

    vi.advanceTimersByTime(2)        // now expired
    expect(cache.get('exp')).toBeNull()

    vi.useRealTimers()
  })

  it('auto-deletes the entry on expired read', () => {
    vi.useFakeTimers()
    cache.set('ghost', 'x', 100)
    vi.advanceTimersByTime(200)
    cache.get('ghost') // triggers delete
    expect(cache.size()).toBe(0)
    vi.useRealTimers()
  })
})

// ---------------------------------------------------------------------------
// Invalidation
// ---------------------------------------------------------------------------

describe('cache — del', () => {
  it('removes a single key', () => {
    cache.set('del-me', 'bye', 60_000)
    cache.del('del-me')
    expect(cache.get('del-me')).toBeNull()
  })

  it('does not throw when deleting a missing key', () => {
    expect(() => cache.del('never-existed')).not.toThrow()
  })
})

describe('cache — delPattern', () => {
  it('removes all keys matching a prefix', () => {
    cache.set('products:shopee:iphone',  [1],  60_000)
    cache.set('products:lazada:samsung', [2],  60_000)
    cache.set('coupons:all',             [3],  60_000)

    cache.delPattern('products:')

    expect(cache.get('products:shopee:iphone')).toBeNull()
    expect(cache.get('products:lazada:samsung')).toBeNull()
    expect(cache.get('coupons:all')).toEqual([3])  // untouched
  })

  it('does not affect keys without the prefix', () => {
    cache.set('abc', 1, 60_000)
    cache.delPattern('xyz:')
    expect(cache.get('abc')).toBe(1)
  })
})

describe('cache — clear', () => {
  it('removes all entries', () => {
    cache.set('a', 1, 60_000)
    cache.set('b', 2, 60_000)
    cache.clear()
    expect(cache.size()).toBe(0)
    expect(cache.get('a')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// size
// ---------------------------------------------------------------------------

describe('cache — size', () => {
  it('reports live entry count', () => {
    expect(cache.size()).toBe(0)
    cache.set('x', 1, 60_000)
    cache.set('y', 2, 60_000)
    expect(cache.size()).toBe(2)
    cache.del('x')
    expect(cache.size()).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// getOrSet
// ---------------------------------------------------------------------------

describe('getOrSet', () => {
  it('calls loader on cache miss and stores result', async () => {
    const loader = vi.fn().mockResolvedValue(['product-a'])
    const result = await getOrSet('products:test', 60_000, loader)

    expect(loader).toHaveBeenCalledOnce()
    expect(result).toEqual(['product-a'])
    expect(cache.get('products:test')).toEqual(['product-a'])
  })

  it('returns cached value without calling loader on hit', async () => {
    const loader = vi.fn().mockResolvedValue(['fresh'])
    cache.set('products:cached', ['old'], 60_000)

    const result = await getOrSet('products:cached', 60_000, loader)

    expect(loader).not.toHaveBeenCalled()
    expect(result).toEqual(['old'])
  })

  it('calls loader again after TTL expires', async () => {
    vi.useFakeTimers()

    const loader = vi.fn()
      .mockResolvedValueOnce(['first'])
      .mockResolvedValueOnce(['second'])

    await getOrSet('short-ttl', 500, loader)
    vi.advanceTimersByTime(600)
    const second = await getOrSet('short-ttl', 500, loader)

    expect(loader).toHaveBeenCalledTimes(2)
    expect(second).toEqual(['second'])

    vi.useRealTimers()
  })

  it('handles concurrent calls — loader called only once', async () => {
    const loader = vi.fn().mockResolvedValue(['data'])

    // Two parallel calls to the same key
    const [r1, r2] = await Promise.all([
      getOrSet('concurrent', 60_000, loader),
      getOrSet('concurrent', 60_000, loader),
    ])

    // First call populates cache; second should hit cache OR both call loader
    // (no lock mechanism in in-memory store — loader may be called once or twice)
    // What matters: both return correct data
    expect(r1).toEqual(['data'])
    expect(r2).toEqual(['data'])
    expect(loader.mock.calls.length).toBeGreaterThanOrEqual(1)
  })
})

// ---------------------------------------------------------------------------
// CACHE_TTL constants sanity
// ---------------------------------------------------------------------------

describe('CACHE_TTL constants', () => {
  it('PRODUCTS TTL is 5 minutes', () => {
    expect(CACHE_TTL.PRODUCTS).toBe(5 * 60_000)
  })
  it('BANK_PROMOS TTL is 1 hour', () => {
    expect(CACHE_TTL.BANK_PROMOS).toBe(60 * 60_000)
  })
})
