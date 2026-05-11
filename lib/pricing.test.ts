import { describe, it, expect } from 'vitest'
import { calculateCartTotal, itemsUntilNextTier, currentTierLabel } from './pricing'

describe('calculateCartTotal', () => {
  it('0 ชิ้น = ฿0', () => {
    expect(calculateCartTotal(0).total).toBe(0)
  })
  it('1 ชิ้น = ฿20', () => {
    expect(calculateCartTotal(1).total).toBe(20)
  })
  it('2 ชิ้น = ฿30', () => {
    expect(calculateCartTotal(2).total).toBe(30)
  })
  it('3 ชิ้น = ฿40', () => {
    expect(calculateCartTotal(3).total).toBe(40)
  })
  it('4 ชิ้น = ฿50', () => {
    expect(calculateCartTotal(4).total).toBe(50)
  })
  it('5 ชิ้น = ฿60', () => {
    expect(calculateCartTotal(5).total).toBe(60)
  })
  it('6 ชิ้น = ฿67', () => {
    expect(calculateCartTotal(6).total).toBe(67)
  })
  it('7 ชิ้น = ฿74', () => {
    expect(calculateCartTotal(7).total).toBe(74)
  })
  it('10 ชิ้น = ฿95', () => {
    expect(calculateCartTotal(10).total).toBe(95)
  })
  it('11 ชิ้น = ฿102', () => {
    expect(calculateCartTotal(11).total).toBe(102)
  })

  describe('nextItemPrice', () => {
    it('ชิ้นที่ 1 → 2 = ฿10', () => {
      expect(calculateCartTotal(1).nextItemPrice).toBe(10)
    })
    it('ชิ้นที่ 5 → 6 = ฿7 (unlock tier 3)', () => {
      expect(calculateCartTotal(5).nextItemPrice).toBe(7)
    })
    it('ชิ้นที่ 10 → 11 = ฿7', () => {
      expect(calculateCartTotal(10).nextItemPrice).toBe(7)
    })
  })

  describe('savedVsFullPrice (เทียบกับ ฿20 ทุกชิ้น)', () => {
    it('1 ชิ้น ประหยัด ฿0', () => {
      expect(calculateCartTotal(1).savedVsFullPrice).toBe(0)
    })
    it('5 ชิ้น ประหยัด ฿40 (100-60)', () => {
      expect(calculateCartTotal(5).savedVsFullPrice).toBe(40)
    })
    it('10 ชิ้น ประหยัด ฿105 (200-95)', () => {
      expect(calculateCartTotal(10).savedVsFullPrice).toBe(105)
    })
  })

  it('total เพิ่มขึ้น monotonic ไม่มี inversion', () => {
    for (let i = 1; i < 15; i++) {
      expect(calculateCartTotal(i + 1).total).toBeGreaterThan(calculateCartTotal(i).total)
    }
  })
})

describe('itemsUntilNextTier', () => {
  it('0 ชิ้น → ต้องการ 1 ชิ้น', () => {
    expect(itemsUntilNextTier(0)).toBe(1)
  })
  it('1 ชิ้น → ต้องการอีก 4', () => {
    expect(itemsUntilNextTier(1)).toBe(4)
  })
  it('4 ชิ้น → ต้องการอีก 1', () => {
    expect(itemsUntilNextTier(4)).toBe(1)
  })
  it('5 ชิ้น → ต้องการอีก 1 (unlock tier 3)', () => {
    expect(itemsUntilNextTier(5)).toBe(1)
  })
  it('6+ ชิ้น → null (อยู่ tier 3 แล้ว)', () => {
    expect(itemsUntilNextTier(6)).toBeNull()
    expect(itemsUntilNextTier(10)).toBeNull()
  })
})

describe('currentTierLabel', () => {
  it('1 ชิ้น = ฿20/ชิ้น', () => {
    expect(currentTierLabel(1)).toBe('฿20/ชิ้น')
  })
  it('3 ชิ้น = ฿10/ชิ้น', () => {
    expect(currentTierLabel(3)).toBe('฿10/ชิ้น')
  })
  it('6 ชิ้น = ฿7/ชิ้น', () => {
    expect(currentTierLabel(6)).toBe('฿7/ชิ้น')
  })
})
