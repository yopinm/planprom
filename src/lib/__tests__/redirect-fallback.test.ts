import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildLinkUnavailableFallbackUrl } from '@/lib/redirect-fallback'

describe('buildLinkUnavailableFallbackUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('preserves the original query when available', () => {
    const url = new URL(buildLinkUnavailableFallbackUrl({
      origin: 'https://couponkum.com',
      product: {
        id:       'p1',
        name:     'Noise cancelling earbuds',
        platform: 'shopee',
      },
      query:  'หูฟัง',
      reason: 'dead_cache',
    }))

    expect(url.pathname).toBe('/search')
    expect(url.searchParams.get('notice')).toBe('link_unavailable')
    expect(url.searchParams.get('product_id')).toBe('p1')
    expect(url.searchParams.get('platform')).toBe('shopee')
    expect(url.searchParams.get('q')).toBe('หูฟัง')
    expect(url.searchParams.get('reason')).toBe('dead_cache')
  })

  it('falls back to product name when query is missing', () => {
    const url = new URL(buildLinkUnavailableFallbackUrl({
      origin: 'https://couponkum.com',
      product: {
        id:       'p2',
        name:     'Portable monitor',
        platform: 'lazada',
      },
      query: null,
    }))

    expect(url.searchParams.get('q')).toBe('Portable monitor')
    expect(url.searchParams.get('platform')).toBe('lazada')
  })

  it('does not emit localhost fallback URLs in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_BASE_URL', 'https://couponkum.com')

    const url = new URL(buildLinkUnavailableFallbackUrl({
      origin: 'http://localhost:3000',
      product: {
        id:       'p3',
        name:     'Wireless mouse',
        platform: 'shopee',
      },
      query: null,
    }))

    expect(url.origin).toBe('https://couponkum.com')
    expect(url.pathname).toBe('/search')
  })
})
