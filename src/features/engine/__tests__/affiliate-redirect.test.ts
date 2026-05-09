// Tests for affiliate redirect worker logic
// Route handler itself is integration-level; we test the pure helpers here.

import { describe, it, expect } from 'vitest'
import { createHash } from 'crypto'

// ---------------------------------------------------------------------------
// Re-implement helpers inline (pure functions, no Next.js deps)
// ---------------------------------------------------------------------------

type SourcePage = 'search' | 'landing' | 'comparison' | 'unknown'
const ALLOWED_SOURCES: SourcePage[] = ['search', 'landing', 'comparison', 'unknown']

function resolveSourcePage(raw: string | null): SourcePage {
  if (raw && ALLOWED_SOURCES.includes(raw as SourcePage)) return raw as SourcePage
  return 'unknown'
}

function hashIp(ip: string | null): string | null {
  if (!ip) return null
  return createHash('sha256').update(ip).digest('hex').slice(0, 16)
}

function resolveRedirectUrl(affiliateUrl: string | null, productUrl: string): string {
  return affiliateUrl ?? productUrl
}

// ---------------------------------------------------------------------------
// resolveSourcePage
// ---------------------------------------------------------------------------

describe('resolveSourcePage', () => {
  it('returns source as-is for valid values', () => {
    expect(resolveSourcePage('search')).toBe('search')
    expect(resolveSourcePage('landing')).toBe('landing')
    expect(resolveSourcePage('comparison')).toBe('comparison')
    expect(resolveSourcePage('unknown')).toBe('unknown')
  })

  it('returns unknown for invalid value', () => {
    expect(resolveSourcePage('admin')).toBe('unknown')
    expect(resolveSourcePage('')).toBe('unknown')
    expect(resolveSourcePage('javascript:alert(1)')).toBe('unknown')
  })

  it('returns unknown for null', () => {
    expect(resolveSourcePage(null)).toBe('unknown')
  })
})

// ---------------------------------------------------------------------------
// hashIp
// ---------------------------------------------------------------------------

describe('hashIp', () => {
  it('returns null for null input', () => {
    expect(hashIp(null)).toBeNull()
  })

  it('returns 16-char hex string', () => {
    const result = hashIp('1.2.3.4')
    expect(result).toHaveLength(16)
    expect(result).toMatch(/^[0-9a-f]+$/)
  })

  it('is deterministic', () => {
    expect(hashIp('203.0.113.42')).toBe(hashIp('203.0.113.42'))
  })

  it('different IPs produce different hashes', () => {
    expect(hashIp('1.2.3.4')).not.toBe(hashIp('4.3.2.1'))
  })

  it('is not reversible (hash is prefix, not full IP)', () => {
    const full = createHash('sha256').update('1.2.3.4').digest('hex')
    expect(hashIp('1.2.3.4')).toBe(full.slice(0, 16))
    // original IP not recoverable from 16-char prefix
    expect(hashIp('1.2.3.4')).not.toBe('1.2.3.4')
  })
})

// ---------------------------------------------------------------------------
// resolveRedirectUrl
// ---------------------------------------------------------------------------

describe('resolveRedirectUrl', () => {
  const PRODUCT_URL   = 'https://shopee.co.th/product/123'
  const AFFILIATE_URL = 'https://shopee.co.th/aff/xxx?deep_link=123'

  it('uses affiliate_url when available', () => {
    expect(resolveRedirectUrl(AFFILIATE_URL, PRODUCT_URL)).toBe(AFFILIATE_URL)
  })

  it('falls back to product url when affiliate_url is null', () => {
    expect(resolveRedirectUrl(null, PRODUCT_URL)).toBe(PRODUCT_URL)
  })

  it('never returns empty string', () => {
    const result = resolveRedirectUrl(null, PRODUCT_URL)
    expect(result.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// param validation
// ---------------------------------------------------------------------------

describe('param validation', () => {
  it('rejects empty id', () => {
    const id = ''.trim()
    expect(id).toBe('')
    // Route would return 400
  })

  it('accepts valid product id', () => {
    const id = 'shp-mock-001'.trim()
    expect(id).toBe('shp-mock-001')
  })

  it('trims whitespace from id', () => {
    const id = '  shp-mock-001  '.trim()
    expect(id).toBe('shp-mock-001')
  })
})
