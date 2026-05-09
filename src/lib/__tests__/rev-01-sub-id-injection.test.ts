// REV-01 / AFFNET-1 — acceptance test
//
// Proves that injectSubId appends the correct network-specific tracking param:
//   Involve Asia → sub1=, AccessTrade → aff_sub=, all others → sub_id=
// Does not overwrite an existing param, and is a no-op for null/empty/unparseable.

import { describe, expect, it } from 'vitest'
import { injectSubId } from '@/lib/affiliate-url'

describe('REV-01: injectSubId — Shopee', () => {
  it('appends sub_id to a plain Shopee product URL', () => {
    expect(injectSubId('https://shopee.co.th/product/1', 'search_top_1'))
      .toBe('https://shopee.co.th/product/1?sub_id=search_top_1')
  })

  it('appends sub_id alongside existing Shopee SLink params', () => {
    expect(injectSubId('https://s.shopee.co.th/slink?aff_id=123', 'search_top_1'))
      .toBe('https://s.shopee.co.th/slink?aff_id=123&sub_id=search_top_1')
  })
})

describe('REV-01: injectSubId — Lazada', () => {
  it('appends sub_id to a Lazada affiliate URL', () => {
    expect(
      injectSubId(
        'https://www.lazada.co.th/products/test.html?url_from=affiliate',
        'search_rare_1',
      ),
    ).toBe('https://www.lazada.co.th/products/test.html?url_from=affiliate&sub_id=search_rare_1')
  })
})

describe('REV-01: injectSubId — TikTok', () => {
  it('appends sub_id after affiliate_id in a TikTok shop URL', () => {
    expect(
      injectSubId(
        'https://shop.tiktok.com/view/product/123?affiliate_id=abc',
        'landing_top_1',
      ),
    ).toBe('https://shop.tiktok.com/view/product/123?affiliate_id=abc&sub_id=landing_top_1')
  })
})

describe('AFFNET-1: injectSubId — Involve Asia', () => {
  it('injects sub1= for invol.co short-link', () => {
    expect(injectSubId('https://invol.co/abc123', 'fb_post_20260425'))
      .toBe('https://invol.co/abc123?sub1=fb_post_20260425')
  })

  it('injects sub1= for involve.asia domain', () => {
    expect(injectSubId('https://involve.asia/offer/xyz?aff_id=999', 'seo_iphone15'))
      .toBe('https://involve.asia/offer/xyz?aff_id=999&sub1=seo_iphone15')
  })

  it('does not overwrite existing sub1 on Involve Asia URL', () => {
    expect(injectSubId('https://invol.co/abc123?sub1=already_set', 'new_value'))
      .toBe('https://invol.co/abc123?sub1=already_set')
  })

  it('does not inject sub_id on Involve Asia URL (wrong param for this network)', () => {
    const result = injectSubId('https://invol.co/abc123', 'test_id')
    expect(result).not.toContain('sub_id=')
    expect(result).toContain('sub1=test_id')
  })
})

describe('AFFNET-1: injectSubId — AccessTrade Thailand', () => {
  it('injects aff_sub= for accesstrade.in.th domain', () => {
    expect(injectSubId('https://c.accesstrade.in.th/click?offer_id=555', 'seo_iphone15'))
      .toBe('https://c.accesstrade.in.th/click?offer_id=555&aff_sub=seo_iphone15')
  })

  it('injects aff_sub= for root accesstrade.in.th', () => {
    expect(injectSubId('https://accesstrade.in.th/go/campaign', 'search_top_1'))
      .toBe('https://accesstrade.in.th/go/campaign?aff_sub=search_top_1')
  })

  it('does not overwrite existing aff_sub on AccessTrade URL', () => {
    expect(injectSubId('https://c.accesstrade.in.th/click?aff_sub=already_set', 'new_value'))
      .toBe('https://c.accesstrade.in.th/click?aff_sub=already_set')
  })

  it('does not inject sub_id on AccessTrade URL (wrong param for this network)', () => {
    const result = injectSubId('https://c.accesstrade.in.th/click', 'test_id')
    expect(result).not.toContain('sub_id=')
    expect(result).toContain('aff_sub=test_id')
  })
})

describe('REV-01: injectSubId — no-op cases', () => {
  it('returns original URL unchanged when subId is null', () => {
    const url = 'https://shopee.co.th/product/1'
    expect(injectSubId(url, null)).toBe(url)
  })

  it('returns original URL unchanged when subId is an empty string', () => {
    const url = 'https://shopee.co.th/product/1'
    expect(injectSubId(url, '')).toBe(url)
  })

  it('does not overwrite an existing sub_id', () => {
    expect(
      injectSubId(
        'https://www.lazada.co.th/products/item.html?sub_id=already_set',
        'new_value',
      ),
    ).toBe('https://www.lazada.co.th/products/item.html?sub_id=already_set')
  })

  it('returns the original string when the URL cannot be parsed', () => {
    const bad = 'not-a-valid-url'
    expect(injectSubId(bad, 'search_top_1')).toBe(bad)
  })
})
