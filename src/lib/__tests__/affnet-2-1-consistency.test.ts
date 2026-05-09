// AFFNET-2.1: Network consistency guard
// Verifies that affiliate_url domain must match declared network to prevent
// silent fallback to 'manual' when Involve Asia or AccessTrade is expected.

import { describe, it, expect } from 'vitest'
import { checkNetworkConsistency, inferNetworkFromAffiliateUrl } from '@/lib/affiliate-url'

describe('inferNetworkFromAffiliateUrl', () => {
  it('returns involve_asia for invol.co URLs', () => {
    expect(inferNetworkFromAffiliateUrl('https://invol.co/abc123')).toBe('involve_asia')
  })
  it('returns involve_asia for invol.pe URLs (Shopee Affiliate shortlink)', () => {
    expect(inferNetworkFromAffiliateUrl('https://invol.pe/abc123')).toBe('involve_asia')
  })
  it('returns involve_asia for involve.asia URLs', () => {
    expect(inferNetworkFromAffiliateUrl('https://involve.asia/track/xyz')).toBe('involve_asia')
  })
  it('returns accesstrade for accesstrade.in.th URLs', () => {
    expect(inferNetworkFromAffiliateUrl('https://accesstrade.in.th/go/abc')).toBe('accesstrade')
  })
  it('returns accesstrade for c.accesstrade.in.th URLs', () => {
    expect(inferNetworkFromAffiliateUrl('https://c.accesstrade.in.th/go/abc')).toBe('accesstrade')
  })
  it('returns direct for Shopee URLs', () => {
    expect(inferNetworkFromAffiliateUrl('https://shopee.co.th/product/123')).toBe('direct')
  })
  it('returns direct for shope.ee short URLs', () => {
    expect(inferNetworkFromAffiliateUrl('https://shope.ee/abc')).toBe('direct')
  })
  it('returns direct for Lazada URLs', () => {
    expect(inferNetworkFromAffiliateUrl('https://s.lazada.co.th/s.abc')).toBe('direct')
  })
  it('returns null for unparseable URLs', () => {
    expect(inferNetworkFromAffiliateUrl('not-a-url')).toBeNull()
  })
})

describe('checkNetworkConsistency', () => {
  it('returns null for IA URL + involve_asia network ✅', () => {
    expect(checkNetworkConsistency('involve_asia', 'https://invol.co/abc123')).toBeNull()
  })
  it('returns null for AT URL + accesstrade network ✅', () => {
    expect(checkNetworkConsistency('accesstrade', 'https://accesstrade.in.th/go/abc')).toBeNull()
  })
  it('returns null for Shopee URL + direct network ✅', () => {
    expect(checkNetworkConsistency('direct', 'https://shopee.co.th/product/123')).toBeNull()
  })

  it('returns error for IA URL + direct network ❌', () => {
    const err = checkNetworkConsistency('direct', 'https://invol.co/abc123')
    expect(err).toMatch(/involve_asia/)
    expect(err).toMatch(/network="direct"/)
  })
  it('returns error for AT URL + direct network ❌', () => {
    const err = checkNetworkConsistency('direct', 'https://accesstrade.in.th/go/abc')
    expect(err).toMatch(/accesstrade/)
    expect(err).toMatch(/network="direct"/)
  })
  it('returns error for Shopee URL + involve_asia network ❌', () => {
    const err = checkNetworkConsistency('involve_asia', 'https://shopee.co.th/product/123')
    expect(err).toMatch(/network="involve_asia"/)
  })
  it('returns error for Shopee URL + accesstrade network ❌', () => {
    const err = checkNetworkConsistency('accesstrade', 'https://shopee.co.th/product/123')
    expect(err).toMatch(/network="accesstrade"/)
  })
  it('returns error for AT URL + involve_asia network ❌', () => {
    const err = checkNetworkConsistency('involve_asia', 'https://accesstrade.in.th/go/abc')
    expect(err).toMatch(/involve_asia/)
    expect(err).toMatch(/accesstrade/)
  })
  it('returns error for IA URL + accesstrade network ❌', () => {
    const err = checkNetworkConsistency('accesstrade', 'https://invol.co/abc123')
    expect(err).toMatch(/accesstrade/)
    expect(err).toMatch(/involve_asia/)
  })
  it('returns null for unparseable URL (let other validation handle it)', () => {
    expect(checkNetworkConsistency('involve_asia', 'not-a-url')).toBeNull()
  })
})
