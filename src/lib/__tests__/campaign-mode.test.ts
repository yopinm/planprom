import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { isPeakMode, getPeakConfig, withPeakFallback } from '../campaign-mode'
import { cache } from '../cache'

// Helper: build date
function d(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day)
}

// ---------------------------------------------------------------------------
// isPeakMode
// ---------------------------------------------------------------------------

describe('isPeakMode — date-based detection', () => {
  it('double_date (11/11) → peak', () => {
    expect(isPeakMode(d(2026, 11, 11))).toBe(true)
  })
  it('double_date (12/12) → peak', () => {
    expect(isPeakMode(d(2026, 12, 12))).toBe(true)
  })
  it('payday (day 28) → peak', () => {
    expect(isPeakMode(d(2026, 3, 28))).toBe(true)
  })
  it('month_start (day 3) → NOT peak', () => {
    expect(isPeakMode(d(2026, 2, 3))).toBe(false)
  })
  it('normal day → NOT peak', () => {
    expect(isPeakMode(d(2026, 4, 18))).toBe(false)
  })
})

describe('isPeakMode — PEAK_MODE env override', () => {
  const original = process.env.PEAK_MODE

  afterEach(() => {
    process.env.PEAK_MODE = original
  })

  it('PEAK_MODE=true forces peak on a normal day', () => {
    process.env.PEAK_MODE = 'true'
    expect(isPeakMode(d(2026, 4, 18))).toBe(true)
  })

  it('PEAK_MODE=false does not override date detection', () => {
    process.env.PEAK_MODE = 'false'
    expect(isPeakMode(d(2026, 11, 11))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// getPeakConfig
// ---------------------------------------------------------------------------

describe('getPeakConfig', () => {
  it('returns tighter throttle + longer TTL on peak day', () => {
    const cfg = getPeakConfig(d(2026, 11, 11))
    expect(cfg.throttleRpsPerIp).toBe(3)
    expect(cfg.cacheTtlMultiplier).toBe(3)
    expect(cfg.staleLabel).not.toBe('')
  })

  it('returns relaxed config on normal day', () => {
    const cfg = getPeakConfig(d(2026, 4, 18))
    expect(cfg.throttleRpsPerIp).toBe(10)
    expect(cfg.cacheTtlMultiplier).toBe(1)
    expect(cfg.staleLabel).toBe('')
  })
})

// ---------------------------------------------------------------------------
// withPeakFallback
// ---------------------------------------------------------------------------

describe('withPeakFallback', () => {
  beforeEach(() => cache.clear())

  it('returns fresh data on success and marks stale=false', async () => {
    const loader = vi.fn().mockResolvedValue({ id: 1 })
    const result = await withPeakFallback('test:fresh', loader)
    expect(result.stale).toBe(false)
    expect(result.data).toEqual({ id: 1 })
    expect(result.staleLabel).toBe('')
  })

  it('stores result in cache after success', async () => {
    const loader = vi.fn().mockResolvedValue(['item'])
    await withPeakFallback('test:cached', loader)
    expect(cache.get('test:cached')).toEqual(['item'])
  })

  it('returns stale cache when loader times out', async () => {
    // Pre-seed stale value
    cache.set('test:stale', { old: true }, 60_000)

    // Loader always times out (10 s > 3 s peak timeout)
    const slowLoader = () => new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('slow')), 10_000),
    )

    const result = await withPeakFallback(
      'test:stale',
      slowLoader,
      d(2026, 11, 11), // peak day → 3s timeout
    )

    expect(result.stale).toBe(true)
    expect(result.data).toEqual({ old: true })
    expect(result.staleLabel).not.toBe('')
  }, 10_000)

  it('throws when both loader fails and cache is empty', async () => {
    const failLoader = () => Promise.reject(new Error('db down'))
    await expect(
      withPeakFallback('test:empty', failLoader),
    ).rejects.toThrow('cache miss')
  })
})
