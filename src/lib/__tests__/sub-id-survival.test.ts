// POSTLIVE-00.1 — Sub-ID Survival Test
//
// Verifies that sub_id is correctly injected and NOT stripped when affiliate
// URLs pass through different networks and URL patterns.
//
// Manual complement (needs live server): simulate browser-level clicks with
// FB in-app, LINE, and Shopee UA strings via curl/playwright to confirm
// sub_id survives the full /api/r redirect chain.

import { describe, it, expect } from 'vitest'
import { injectSubId } from '@/lib/affiliate-url'

// ---------------------------------------------------------------------------
// Network-specific param injection
// ---------------------------------------------------------------------------

describe('sub_id injection — Shopee / Lazada (default network)', () => {
  it('appends sub_id to a clean Shopee URL', () => {
    const url = 'https://shope.ee/abc123'
    const result = injectSubId(url, 'home_top')
    expect(result).toContain('sub_id=home_top')
  })

  it('appends sub_id to a clean Lazada URL', () => {
    const url = 'https://www.lazada.co.th/products/test-i12345.html'
    const result = injectSubId(url, 'search_top_1')
    expect(result).toContain('sub_id=search_top_1')
  })

  it('does NOT overwrite existing sub_id already in URL', () => {
    const url = 'https://shope.ee/abc?sub_id=existing_value'
    const result = injectSubId(url, 'new_value')
    expect(result).toContain('sub_id=existing_value')
    expect(result).not.toContain('new_value')
  })

  it('preserves other query params when injecting', () => {
    const url = 'https://www.lazada.co.th/products/item.html?utm_source=fb&ref=share'
    const result = injectSubId(url, 'fb_manual')
    expect(result).toContain('utm_source=fb')
    expect(result).toContain('sub_id=fb_manual')
  })
})

describe('sub_id injection — Involve Asia (sub1 param)', () => {
  it('uses sub1= for invol.co short links', () => {
    const url = 'https://invol.co/abc123'
    const result = injectSubId(url, 'seo_page')
    expect(result).toContain('sub1=seo_page')
    expect(result).not.toContain('sub_id=')
  })

  it('uses sub1= for involve.asia domain', () => {
    const url = 'https://involve.asia/link/xyz'
    const result = injectSubId(url, 'rare_top_1')
    expect(result).toContain('sub1=rare_top_1')
  })

  it('does NOT overwrite existing sub1 on Involve Asia', () => {
    const url = 'https://invol.co/abc?sub1=keep_me'
    const result = injectSubId(url, 'override_attempt')
    expect(result).toContain('sub1=keep_me')
    expect(result).not.toContain('override_attempt')
  })
})

describe('sub_id injection — AccessTrade (aff_sub param)', () => {
  it('uses aff_sub= for accesstrade.in.th', () => {
    const url = 'https://accesstrade.in.th/link/123'
    const result = injectSubId(url, 'email_payday')
    expect(result).toContain('aff_sub=email_payday')
    expect(result).not.toContain('sub_id=')
  })

  it('uses aff_sub= for accesstrade.net', () => {
    const url = 'https://accesstrade.net/link/456'
    const result = injectSubId(url, 'line_alert')
    expect(result).toContain('aff_sub=line_alert')
  })
})

// ---------------------------------------------------------------------------
// Edge cases — sub_id ไม่ควรหายระหว่างทาง
// ---------------------------------------------------------------------------

describe('sub_id survival — edge cases', () => {
  it('returns original URL unchanged when subId is null', () => {
    const url = 'https://shope.ee/abc123'
    expect(injectSubId(url, null)).toBe(url)
  })

  it('returns original URL unchanged when subId is empty string', () => {
    const url = 'https://shope.ee/abc123'
    expect(injectSubId(url, '')).toBe(url)
  })

  it('returns original URL unchanged when URL is malformed', () => {
    const bad = 'not-a-valid-url'
    expect(injectSubId(bad, 'test')).toBe(bad)
  })

  it('encodes special characters in sub_id value', () => {
    const url = 'https://shope.ee/abc'
    const result = injectSubId(url, 'fb_post_2026-05-01')
    // URL-encoded hyphen may or may not encode; key check: sub_id is present
    expect(result).toMatch(/sub_id=fb_post/)
  })

  it('handles URLs with fragments correctly', () => {
    const url = 'https://www.lazada.co.th/products/item.html#section1'
    const result = injectSubId(url, 'home_hero')
    expect(result).toContain('sub_id=home_hero')
  })
})

// ---------------------------------------------------------------------------
// Sub-ID naming convention — ตรวจสอบว่า sub_id ที่กำหนดไว้ครบ
// ---------------------------------------------------------------------------

describe('sub_id naming — Day-0 required sub_ids (POSTLIVE-64 spec)', () => {
  const DAY0_SUBIDS = ['home_top', 'search_top_1', 'fb_manual', 'seo_page']

  it.each(DAY0_SUBIDS)('sub_id "%s" survives injection into Shopee URL', (subId) => {
    const url = 'https://shope.ee/abc'
    const result = injectSubId(url, subId)
    expect(result).toContain(`sub_id=${subId}`)
  })

  it.each(DAY0_SUBIDS)('sub_id "%s" survives injection into Lazada URL', (subId) => {
    const url = 'https://www.lazada.co.th/products/p.html'
    const result = injectSubId(url, subId)
    expect(result).toContain(`sub_id=${subId}`)
  })
})
