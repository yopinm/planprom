import { describe, it, expect } from 'vitest'
import { generateCaption, pickCaptionStyle } from '../facebook-post-queue'

const coupon = {
  title: 'Sephora ลิปสติก MAC',
  platform: 'shopee',
  discount_value: 15,
  type: 'percent',
  code: 'SHOP15',
  expire_at: null,
}

describe('pickCaptionStyle', () => {
  it('rotates saving → urgency → direct', () => {
    expect(pickCaptionStyle(0)).toBe('saving')
    expect(pickCaptionStyle(1)).toBe('urgency')
    expect(pickCaptionStyle(2)).toBe('direct')
    expect(pickCaptionStyle(3)).toBe('saving')
  })
})

describe('generateCaption', () => {
  const lineOaId = '@couponkum'

  it('saving style contains discount + code + wallet link + LINE link', () => {
    const cap = generateCaption(coupon, 'saving', lineOaId)
    expect(cap).toContain('💰')
    expect(cap).toContain('ลด 15%')
    expect(cap).toContain('SHOP15')
    expect(cap).toContain('couponkum.com/wallet')
    expect(cap).toContain('@couponkum')
  })

  it('urgency style contains urgency emoji + LINE link', () => {
    const cap = generateCaption(coupon, 'urgency', lineOaId)
    expect(cap).toContain('⏰')
    expect(cap).toContain('🔥')
    expect(cap).toContain('SHOP15')
    expect(cap).toContain('@couponkum')
  })

  it('direct style contains platform name + wallet link', () => {
    const cap = generateCaption(coupon, 'direct', lineOaId)
    expect(cap).toContain('Shopee ลด 15%')
    expect(cap).toContain('SHOP15')
    expect(cap).toContain('couponkum.com/wallet')
  })

  it('formats fixed discount correctly', () => {
    const fixed = { ...coupon, type: 'fixed', discount_value: 200 }
    const cap = generateCaption(fixed, 'saving', lineOaId)
    expect(cap).toContain('ลด ฿200')
  })

  it('formats shipping discount correctly', () => {
    const ship = { ...coupon, type: 'shipping', discount_value: 0 }
    const cap = generateCaption(ship, 'saving', lineOaId)
    expect(cap).toContain('ส่งฟรี')
  })

  it('shows expire date when set', () => {
    const withExpire = { ...coupon, expire_at: '2026-12-31T00:00:00Z' }
    const cap = generateCaption(withExpire, 'saving', lineOaId)
    expect(cap).toContain('⏰ หมด:')
  })

  it('shows ไม่จำกัดเวลา when expire_at is null', () => {
    const cap = generateCaption(coupon, 'saving', lineOaId)
    expect(cap).toContain('ไม่จำกัดเวลา')
  })

  it('maps lazada platform name', () => {
    const laz = { ...coupon, platform: 'lazada' }
    const cap = generateCaption(laz, 'direct', lineOaId)
    expect(cap).toContain('Lazada')
  })
})
