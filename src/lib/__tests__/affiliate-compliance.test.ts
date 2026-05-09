import { describe, it, expect } from 'vitest'
import {
  isAllowedAffiliateUrl,
  isValidSubId,
  auditAffiliateUrl,
  auditRedirectTarget,
  hasAffiliateDisclosure,
  auditPageDisclosure,
} from '../affiliate-compliance'

// ---------------------------------------------------------------------------
// isAllowedAffiliateUrl
// ---------------------------------------------------------------------------

describe('isAllowedAffiliateUrl', () => {
  it('accepts shopee.co.th', () => {
    expect(isAllowedAffiliateUrl('https://shopee.co.th/product/123')).toBe(true)
  })
  it('accepts www.shopee.co.th', () => {
    expect(isAllowedAffiliateUrl('https://www.shopee.co.th/product/123')).toBe(true)
  })
  it('accepts shope.ee short link', () => {
    expect(isAllowedAffiliateUrl('https://shope.ee/abc123')).toBe(true)
  })
  it('accepts lazada.co.th', () => {
    expect(isAllowedAffiliateUrl('https://www.lazada.co.th/products/xyz.html')).toBe(true)
  })
  it('accepts s.lazada.co.th short link', () => {
    expect(isAllowedAffiliateUrl('https://s.lazada.co.th/s.XYZ')).toBe(true)
  })
  it('rejects unknown domain', () => {
    expect(isAllowedAffiliateUrl('https://evil.com/redirect')).toBe(false)
  })
  it('rejects malformed URL', () => {
    expect(isAllowedAffiliateUrl('not-a-url')).toBe(false)
  })
  it('accepts tiktok shop links (supported affiliate platform)', () => {
    expect(isAllowedAffiliateUrl('https://www.tiktok.com/shop/product/123')).toBe(true)
  })
  it('accepts Involve Asia invol.co link', () => {
    expect(isAllowedAffiliateUrl('https://invol.co/abc123')).toBe(true)
  })
  it('accepts AccessTrade link', () => {
    expect(isAllowedAffiliateUrl('https://accesstrade.in.th/click?offer_id=1')).toBe(true)
  })
  it('rejects http:// even for allowed domain', () => {
    expect(isAllowedAffiliateUrl('http://shopee.co.th/product/123')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// isValidSubId
// ---------------------------------------------------------------------------

describe('isValidSubId', () => {
  it('accepts search_top_1', () => expect(isValidSubId('search_top_1')).toBe(true))
  it('accepts compare_2_shopee', () => expect(isValidSubId('compare_2_shopee')).toBe(true))
  it('accepts product_hero', () => expect(isValidSubId('product_hero')).toBe(true))
  it('accepts rare_top_3', () => expect(isValidSubId('rare_top_3')).toBe(true))
  it('accepts admin_preview', () => expect(isValidSubId('admin_preview')).toBe(true))
  it('rejects empty string', () => expect(isValidSubId('')).toBe(false))
  it('rejects uppercase', () => expect(isValidSubId('Search_Top_1')).toBe(false))
  it('rejects spaces', () => expect(isValidSubId('search top 1')).toBe(false))
  it('rejects special chars', () => expect(isValidSubId('search@top#1')).toBe(false))
})

// ---------------------------------------------------------------------------
// auditAffiliateUrl
// ---------------------------------------------------------------------------

describe('auditAffiliateUrl', () => {
  it('passes a valid shopee URL with valid sub_id', () => {
    const result = auditAffiliateUrl('https://shopee.co.th/product/123', 'search_top_1')
    expect(result.ok).toBe(true)
    expect(result.violations).toHaveLength(0)
  })

  it('fails an external URL', () => {
    const result = auditAffiliateUrl('https://external.com/product', 'search_top_1')
    expect(result.ok).toBe(false)
    expect(result.violations).toContain('invalid_domain')
  })

  it('fails when sub_id is empty', () => {
    const result = auditAffiliateUrl('https://lazada.co.th/products/x.html', '')
    expect(result.ok).toBe(false)
    expect(result.violations).toContain('missing_sub_id')
  })

  it('fails when sub_id has bad format', () => {
    const result = auditAffiliateUrl('https://shopee.co.th/product/123', 'BAD FORMAT')
    expect(result.ok).toBe(false)
    expect(result.violations).toContain('invalid_sub_id')
  })

  it('skips sub_id check when expectedSubId is undefined', () => {
    const result = auditAffiliateUrl('https://shopee.co.th/product/123')
    expect(result.ok).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// auditRedirectTarget
// ---------------------------------------------------------------------------

describe('auditRedirectTarget', () => {
  it('passes a lazada redirect', () => {
    const result = auditRedirectTarget('https://www.lazada.co.th/products/abc.html')
    expect(result.ok).toBe(true)
  })

  it('flags open redirect to external domain', () => {
    const result = auditRedirectTarget('https://attacker.com/steal')
    expect(result.ok).toBe(false)
    expect(result.violations).toContain('open_redirect')
  })
})

// ---------------------------------------------------------------------------
// hasAffiliateDisclosure / auditPageDisclosure
// ---------------------------------------------------------------------------

describe('hasAffiliateDisclosure', () => {
  it('detects "affiliate link" in English', () => {
    expect(hasAffiliateDisclosure('This page contains affiliate links.')).toBe(true)
  })
  it('detects Thai disclosure with ค่าคอมมิชชัน', () => {
    expect(hasAffiliateDisclosure('ลิงก์บางรายการเป็น Affiliate Link และ Couponkum จะได้รับค่าคอมมิชชัน')).toBe(true)
  })
  it('detects #โฆษณา', () => {
    expect(hasAffiliateDisclosure('#โฆษณา')).toBe(true)
  })
  it('returns false when no disclosure present', () => {
    expect(hasAffiliateDisclosure('Buy this product now!')).toBe(false)
  })
})

describe('auditPageDisclosure', () => {
  it('passes a page with disclosure', () => {
    const result = auditPageDisclosure('ลิงก์บางรายการเป็น Affiliate Link ซึ่ง Couponkum จะได้รับค่าคอมมิชชัน')
    expect(result.ok).toBe(true)
  })

  it('fails a page without disclosure', () => {
    const result = auditPageDisclosure('<html>Buy cheap products here!</html>')
    expect(result.ok).toBe(false)
    expect(result.violations).toContain('missing_disclosure')
  })
})
