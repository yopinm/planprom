import { describe, expect, it } from 'vitest'
import {
  buildFakeDiscountProductPatch,
  detectFakeDiscount,
  FAKE_DISCOUNT_ORIGINAL_PRICE_MULTIPLIER,
} from '@/lib/fake-discount'

describe('TASK 4.4 fake discount detection', () => {
  it('flags products when original price is more than 2.5x current price', () => {
    const result = detectFakeDiscount({ price_current: 1000, price_original: 2600 })

    expect(result).toEqual({
      suspicious: true,
      reason:     `original_price_gt_current_price_${FAKE_DISCOUNT_ORIGINAL_PRICE_MULTIPLIER}x`,
      ratio:      2.6,
    })
  })

  it('does not flag the exact 2.5x threshold', () => {
    expect(detectFakeDiscount({ price_current: 1000, price_original: 2500 })).toEqual({
      suspicious: false,
      reason:     null,
      ratio:      2.5,
    })
  })

  it('ignores missing original price', () => {
    expect(detectFakeDiscount({ price_current: 1000, price_original: null })).toEqual({
      suspicious: false,
      reason:     null,
      ratio:      null,
    })
  })

  it('keeps invalid current price out of the review queue', () => {
    expect(detectFakeDiscount({ price_current: 0, price_original: 5000 })).toEqual({
      suspicious: false,
      reason:     'invalid_current_price',
      ratio:      null,
    })
  })

  it('builds a products table patch with a stable checked timestamp', () => {
    const checkedAt = new Date('2026-04-20T01:02:03.000Z')

    expect(buildFakeDiscountProductPatch(
      { price_current: 1000, price_original: 3000 },
      checkedAt,
    )).toEqual({
      suspicious_discount:            true,
      suspicious_discount_reason:     'original_price_gt_current_price_2.5x',
      suspicious_discount_checked_at: '2026-04-20T01:02:03.000Z',
    })
  })
})
