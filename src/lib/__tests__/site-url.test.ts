import { afterEach, describe, expect, it, vi } from 'vitest'
import { getConfiguredPublicBaseUrl, getSafePublicOrigin } from '@/lib/site-url'

describe('site-url helpers', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('uses NEXT_PUBLIC_BASE_URL as the configured public origin', () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_URL', 'https://www.couponkum.com/some/path')

    expect(getConfiguredPublicBaseUrl()).toBe('https://www.couponkum.com')
  })

  it('replaces localhost origin in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_BASE_URL', 'https://couponkum.com')

    expect(getSafePublicOrigin('http://localhost:3000')).toBe('https://couponkum.com')
  })

  it('keeps localhost origin outside production', () => {
    vi.stubEnv('NODE_ENV', 'development')

    expect(getSafePublicOrigin('http://localhost:3000')).toBe('http://localhost:3000')
  })
})
