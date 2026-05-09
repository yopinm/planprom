import { describe, expect, it } from 'vitest'
import {
  getCouponFreshnessTimestamp,
  getFreshnessInfo,
  getLatestTimestamp,
  getProductFreshnessTimestamp,
} from '@/lib/freshness'
import type { Coupon, Product } from '@/types'

const NOW = new Date('2026-04-21T09:00:00.000Z')

describe('freshness helpers', () => {
  it('marks recent data as reliable', () => {
    const info = getFreshnessInfo('2026-04-21T08:45:00.000Z', NOW)

    expect(info.status).toBe('fresh')
    expect(info.source).toBe('verified')
    expect(info.isReliable).toBe(true)
    expect(info.mobileLabel).toContain('15 นาทีที่แล้ว')
  })

  it('marks 32-hour-old data as aging but still usable', () => {
    // 2026-04-21T09:00Z - 32.5h = 2026-04-20T00:30Z  → >24h fresh threshold → aging
    const info = getFreshnessInfo('2026-04-20T00:30:00.000Z', NOW)

    expect(info.status).toBe('aging')
    expect(info.isReliable).toBe(true)
  })

  it('marks older than 72 hours as stale', () => {
    // 2026-04-21T09:00Z - 96h = 2026-04-17T09:00Z  → >72h stale threshold → stale
    const info = getFreshnessInfo('2026-04-17T09:00:00.000Z', NOW)

    expect(info.status).toBe('stale')
    expect(info.isReliable).toBe(false)
  })

  it('marks missing timestamps as unknown', () => {
    const info = getFreshnessInfo(null, NOW)

    expect(info.status).toBe('unknown')
    expect(info.source).toBe('unknown')
    expect(info.isReliable).toBe(false)
  })

  it('finds the latest valid timestamp', () => {
    expect(getLatestTimestamp([
      null,
      '2026-04-20T08:00:00.000Z',
      'not-a-date',
      '2026-04-21T08:00:00.000Z',
    ])).toBe('2026-04-21T08:00:00.000Z')
  })

  it('resolves product freshness from source-verified timestamps only', () => {
    const product = {
      id: 'prod-1',
      platform: 'shopee',
      platform_id: 'SP1',
      name: 'Test product',
      url: 'https://example.com/product',
      affiliate_url: null,
      category: null,
      price_current: 100,
      price_original: null,
      price_min: null,
      price_max: null,
      shop_id: null,
      shop_name: null,
      shop_type: null,
      rating: null,
      sold_count: 0,
      image_url: null,
      is_active: true,
      price_checked_at: '2026-04-21T08:00:00.000Z',
      created_at: '2026-04-21T07:00:00.000Z',
      updated_at: '2026-04-21T08:30:00.000Z',
    } satisfies Product

    expect(getProductFreshnessTimestamp(product)).toBe('2026-04-21T08:00:00.000Z')
  })

  it('does not treat coupon updated_at as a verified freshness timestamp', () => {
    const coupon = {
      id: 'coupon-1',
      code: 'SAVE100',
      title: 'Save 100',
      description: null,
      platform: 'shopee',
      tier: 1,
      type: 'fixed',
      discount_value: 100,
      max_discount: null,
      min_spend: 0,
      applicable_categories: [],
      can_stack: true,
      user_segment: 'all',
      expire_at: null,
      is_active: true,
      source: 'test',
      created_at: '2026-04-21T07:00:00.000Z',
      updated_at: '2026-04-21T08:30:00.000Z',
    } satisfies Coupon

    expect(getCouponFreshnessTimestamp(coupon)).toBeNull()
  })
})
