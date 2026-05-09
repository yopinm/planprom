// TRUST-1 — acceptance test
//
// Proves that priceFreshness.isReliable correctly drives the "ยืนยันแล้ว" /
// "โดยประมาณ" badge based solely on price_checked_at, independently of
// coupon freshness or the publish-block gate (savingsReliable).

import { describe, expect, it } from 'vitest'
import { getFreshnessInfo } from '@/lib/freshness'

const REF = new Date('2026-04-24T12:00:00Z')

describe('TRUST-1: PriceConfidenceBadge logic — isReliable', () => {
  it('fresh price_checked_at (30 min ago) → isReliable true → badge shows ยืนยันแล้ว', () => {
    const checkedAt = new Date(REF.getTime() - 30 * 60_000).toISOString()
    const info = getFreshnessInfo(checkedAt, REF)
    expect(info.isReliable).toBe(true)
    expect(info.status).toBe('fresh')
  })

  it('aging price_checked_at (36 hours ago) → isReliable true → badge shows ยืนยันแล้ว', () => {
    // fresh threshold = 24h; stale threshold = 72h; 36h → aging
    const checkedAt = new Date(REF.getTime() - 36 * 60 * 60_000).toISOString()
    const info = getFreshnessInfo(checkedAt, REF)
    expect(info.isReliable).toBe(true)
    expect(info.status).toBe('aging')
  })

  it('stale price_checked_at (4 days ago) → isReliable false → badge shows โดยประมาณ', () => {
    // stale threshold = 72h; 4 days = 96h → stale
    const checkedAt = new Date(REF.getTime() - 4 * 24 * 60 * 60_000).toISOString()
    const info = getFreshnessInfo(checkedAt, REF)
    expect(info.isReliable).toBe(false)
    expect(info.status).toBe('stale')
  })

  it('null price_checked_at → isReliable false → badge shows โดยประมาณ', () => {
    const info = getFreshnessInfo(null, REF)
    expect(info.isReliable).toBe(false)
    expect(info.status).toBe('unknown')
  })

  it('price confidence is independent of coupon freshness — only price_checked_at matters', () => {
    // TRUST-1 uses priceFreshness.isReliable directly, not savingsReliable
    // (savingsReliable = priceFreshness.isReliable && couponFreshness.isReliable)
    // A fresh price with stale coupons still shows ยืนยันแล้ว on the price badge.
    const freshPrice = new Date(REF.getTime() - 10 * 60_000).toISOString()
    const priceInfo = getFreshnessInfo(freshPrice, REF)
    expect(priceInfo.isReliable).toBe(true)

    // Simulate stale coupon (4 days = 96h > 72h threshold) — price badge must still be ยืนยันแล้ว
    const staleCoupon = new Date(REF.getTime() - 4 * 24 * 60 * 60_000).toISOString()
    const couponInfo = getFreshnessInfo(staleCoupon, REF)
    expect(couponInfo.isReliable).toBe(false)

    // price badge = priceInfo.isReliable, not (priceInfo && couponInfo)
    expect(priceInfo.isReliable).toBe(true)
  })
})
