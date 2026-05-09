import { describe, expect, it } from 'vitest'

import {
  sanitizeAffiliateUrl,
  sanitizeCode,
  sanitizeNumber,
  sanitizeText,
  stripHtml,
} from '@/lib/security/sanitizer'

describe('stripHtml', () => {
  it('returns empty string for empty and whitespace-only input', () => {
    expect(stripHtml('')).toBe('')
    expect(stripHtml('   \n\t  ')).toBe('')
  })

  it('removes simple HTML tags and trims the result', () => {
    expect(stripHtml('  <strong>Deal</strong> today  ')).toBe('Deal today')
  })

  it('removes nested and attribute-heavy tags', () => {
    const input = '<div class="x"><span data-id="1">Save</span> <b>100</b></div>'
    expect(stripHtml(input)).toBe('Save 100')
  })

  it('removes script tags and their executable text content', () => {
    expect(stripHtml('<script>alert("xss")</script>Deal')).toBe('Deal')
  })

  it('strips encoded HTML tags after decoding common entities', () => {
    expect(stripHtml('&lt;script&gt;alert(1)&lt;&#x2F;script&gt;Deal')).toBe('Deal')
    expect(stripHtml('&lt;b&gt;Deal&lt;&#x2F;b&gt;')).toBe('Deal')
  })

  it('decodes common safe text entities', () => {
    expect(stripHtml('AT&amp;T &quot;deal&quot; &#x27;today&#x27;')).toBe('AT&T "deal" \'today\'')
  })

  it('decodes decimal and nested entities before sanitizing', () => {
    expect(stripHtml('&#60;b&#62;Deal&#60;/b&#62;')).toBe('Deal')
    expect(stripHtml('&amp;lt;script&amp;gt;alert(1)&amp;lt;/script&amp;gt;Deal')).toBe('Deal')
  })

  it('removes dangerous text containers entirely', () => {
    expect(stripHtml('<style>body{display:none}</style>Deal')).toBe('Deal')
    expect(stripHtml('<svg><script>alert(1)</script></svg>Deal')).toBe('Deal')
    expect(stripHtml('<iframe src="https://evil.example">fallback</iframe>Deal')).toBe('Deal')
  })

  it('does not treat normal comparison text as HTML', () => {
    expect(stripHtml('2 < 3 and 5 > 4')).toBe('2 < 3 and 5 > 4')
  })

  it('handles malformed tags without preserving executable markup', () => {
    expect(stripHtml('<script alert(1)')).toBe('script alert(1)')
  })
})

describe('sanitizeText', () => {
  it('returns empty string for non-string values', () => {
    expect(sanitizeText(null)).toBe('')
    expect(sanitizeText(undefined)).toBe('')
    expect(sanitizeText(123)).toBe('')
    expect(sanitizeText({ value: 'deal' })).toBe('')
  })

  it('collapses repeated whitespace to single spaces', () => {
    expect(sanitizeText('  best\n\n deal\t today  ')).toBe('best deal today')
  })

  it('removes raw and encoded HTML from plain text fields', () => {
    expect(sanitizeText('<img src=x onerror=alert(1)> cheap')).toBe('cheap')
    expect(sanitizeText('&lt;img src=x onerror=alert(1)&gt; cheap')).toBe('cheap')
  })

  it('enforces max length after HTML stripping and whitespace collapse', () => {
    expect(sanitizeText('<b>abcdef</b> ghijkl', 8)).toBe('abcdef g')
  })

  it('handles zero and negative max length consistently with slice', () => {
    expect(sanitizeText('abcdef', 0)).toBe('')
    expect(sanitizeText('abcdef', -2)).toBe('abcd')
  })
})

describe('sanitizeCode', () => {
  it('returns empty string for non-string values', () => {
    expect(sanitizeCode(null)).toBe('')
    expect(sanitizeCode(undefined)).toBe('')
    expect(sanitizeCode(123)).toBe('')
  })

  it('uppercases and preserves alphanumeric dash underscore only', () => {
    expect(sanitizeCode(' deal_10-off ')).toBe('DEAL_10-OFF')
  })

  it('removes spaces, punctuation, HTML, and emoji', () => {
    expect(sanitizeCode(' <b>save ฿100!</b> 🎁 ')).toBe('BSAVE100B')
  })

  it('removes XSS-like characters from coupon code input', () => {
    expect(sanitizeCode('"><script>alert(1)</script>')).toBe('SCRIPTALERT1SCRIPT')
  })

  it('limits code length to 64 characters', () => {
    expect(sanitizeCode('a'.repeat(80))).toHaveLength(64)
  })
})

describe('sanitizeNumber', () => {
  it('parses finite numeric strings and numbers', () => {
    expect(sanitizeNumber('123.45')).toBe(123.45)
    expect(sanitizeNumber(99)).toBe(99)
    expect(sanitizeNumber('  250 baht')).toBe(250)
  })

  it('returns NaN for invalid numeric values', () => {
    expect(Number.isNaN(sanitizeNumber('abc'))).toBe(true)
    expect(Number.isNaN(sanitizeNumber(undefined))).toBe(true)
    expect(Number.isNaN(sanitizeNumber(Number.POSITIVE_INFINITY))).toBe(true)
  })

  it('supports negative and zero values because validation happens elsewhere', () => {
    expect(sanitizeNumber('-15.5')).toBe(-15.5)
    expect(sanitizeNumber('0')).toBe(0)
  })
})

describe('sanitizeAffiliateUrl', () => {
  it('returns empty string for non-string or blank inputs', () => {
    expect(sanitizeAffiliateUrl(null)).toBe('')
    expect(sanitizeAffiliateUrl(undefined)).toBe('')
    expect(sanitizeAffiliateUrl('')).toBe('')
    expect(sanitizeAffiliateUrl('   ')).toBe('')
  })

  it('allows trusted Shopee, Lazada, and TikTok HTTPS URLs', () => {
    expect(sanitizeAffiliateUrl('https://shopee.co.th/product/1?x=1')).toBe('https://shopee.co.th/product/1?x=1')
    expect(sanitizeAffiliateUrl('https://go.lazada.co.th/deal')).toBe('https://go.lazada.co.th/deal')
    expect(sanitizeAffiliateUrl('https://shop.tiktok.com/view/product/123')).toBe('https://shop.tiktok.com/view/product/123')
  })

  it('allows subdomains of trusted domains', () => {
    expect(sanitizeAffiliateUrl('https://seller.shopee.co.th/path')).toBe('https://seller.shopee.co.th/path')
    expect(sanitizeAffiliateUrl('https://pages.lazada.co.th/path')).toBe('https://pages.lazada.co.th/path')
  })

  it('rejects non-HTTPS protocols and protocol-relative URLs', () => {
    expect(sanitizeAffiliateUrl('http://shopee.co.th/product/1')).toBe('')
    expect(sanitizeAffiliateUrl('javascript:alert(1)')).toBe('')
    expect(sanitizeAffiliateUrl('//shopee.co.th/product/1')).toBe('')
  })

  it('rejects untrusted domains and domain spoofing', () => {
    expect(sanitizeAffiliateUrl('https://evil.example.com/product')).toBe('')
    expect(sanitizeAffiliateUrl('https://shopee.co.th.evil.example/product')).toBe('')
    expect(sanitizeAffiliateUrl('https://lazada.com.evil.example/product')).toBe('')
  })

  it('normalizes whitespace and hostname case through URL parsing', () => {
    expect(sanitizeAffiliateUrl('  https://SHOPEE.co.th/product/1  ')).toBe('https://shopee.co.th/product/1')
  })

  it('rejects malformed URLs', () => {
    expect(sanitizeAffiliateUrl('not a url')).toBe('')
    expect(sanitizeAffiliateUrl('https://')).toBe('')
  })
})
