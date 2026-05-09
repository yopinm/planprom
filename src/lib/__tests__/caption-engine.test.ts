// src/lib/__tests__/caption-engine.test.ts
// TASK 2.5.3 — Caption Engine unit tests

import { describe, it, expect } from 'vitest'
import { generateCaption, formatThaiNumber } from '@/lib/caption-engine'
import type { CaptionInput } from '@/lib/caption-engine'
import type { CampaignContext } from '@/lib/campaign-context'

const normalCtx: CampaignContext = {
  type: 'normal',
  label: 'คุ้มทุกการใช้จ่าย · ง่ายทุกการวางแผน',
  month: 'เม.ย.',
}
const paydayCtx: CampaignContext = {
  type: 'payday',
  label: 'วันเงินเดือน — โปรพิเศษรอคุณอยู่',
  month: 'เม.ย.',
}
const doubleCtx: CampaignContext = {
  type: 'double_date',
  label: '04.04 ดีลพิเศษ',
  month: 'เม.ย.',
}

function makeInput(overrides: Partial<CaptionInput> = {}): CaptionInput {
  return {
    productName:    'หูฟัง Sony WH-1000XM5',
    productSlug:    'sony-wh-1000xm5',
    originalPrice:  10990,
    effectiveNet:   7990,
    campaignContext: normalCtx,
    baseUrl:        'https://couponkum.com',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Product URL
// ---------------------------------------------------------------------------

describe('generateCaption — productUrl', () => {
  it('builds correct product URL from slug and baseUrl', () => {
    const { productUrl } = generateCaption(makeInput())
    expect(productUrl).toBe('https://couponkum.com/product/sony-wh-1000xm5')
  })

  it('uses custom baseUrl when provided', () => {
    const { productUrl } = generateCaption(makeInput({ baseUrl: 'https://staging.couponkum.com' }))
    expect(productUrl).toContain('staging.couponkum.com')
  })
})

// ---------------------------------------------------------------------------
// Short caption
// ---------------------------------------------------------------------------

describe('generateCaption — short', () => {
  it('contains product name', () => {
    const { short } = generateCaption(makeInput())
    expect(short).toContain('Sony WH-1000XM5')
  })

  it('contains effectiveNet price', () => {
    const { short } = generateCaption(makeInput())
    expect(short).toContain('7,990')
  })

  it('contains saving amount when saving > 0', () => {
    const { short } = generateCaption(makeInput())
    // saving = 10990 - 7990 = 3000
    expect(short).toContain('3,000')
    expect(short).toContain('ประหยัด')
  })

  it('omits saving when originalPrice === effectiveNet', () => {
    const { short } = generateCaption(makeInput({ originalPrice: 7990, effectiveNet: 7990 }))
    expect(short).not.toContain('ประหยัด')
  })

  it('contains product URL', () => {
    const { short } = generateCaption(makeInput())
    expect(short).toContain('couponkum.com/product/sony-wh-1000xm5')
  })

  it('contains disclosure template', () => {
    const { short } = generateCaption(makeInput())
    expect(short).toContain('# โฆษณา')
  })

  it('uses custom disclosure when provided', () => {
    const { short } = generateCaption(makeInput({ disclosureTemplate: '# สนับสนุน' }))
    expect(short).toContain('# สนับสนุน')
    expect(short).not.toContain('# โฆษณา')
  })

  it('contains campaign headline', () => {
    const { short } = generateCaption(makeInput({ campaignContext: paydayCtx }))
    expect(short).toContain('วันเงินเดือน')
  })

  it('contains coupon code when provided', () => {
    const { short } = generateCaption(makeInput({ couponCode: 'SAVE300' }))
    expect(short).toContain('SAVE300')
  })

  it('omits coupon line when couponCode is null', () => {
    const { short } = generateCaption(makeInput({ couponCode: null }))
    expect(short).not.toContain('โค้ด:')
  })

  it('contains bank promo snippet when provided', () => {
    const { short } = generateCaption(makeInput({ bankPromoSnippet: 'KBank ลด 5% เพิ่ม' }))
    expect(short).toContain('KBank ลด 5% เพิ่ม')
  })

  it('omits bank line when bankPromoSnippet is null', () => {
    const { short } = generateCaption(makeInput({ bankPromoSnippet: null }))
    expect(short).not.toContain('KBank')
  })
})

// ---------------------------------------------------------------------------
// Long caption
// ---------------------------------------------------------------------------

describe('generateCaption — long', () => {
  it('contains product name', () => {
    const { long } = generateCaption(makeInput())
    expect(long).toContain('Sony WH-1000XM5')
  })

  it('contains original price', () => {
    const { long } = generateCaption(makeInput())
    expect(long).toContain('10,990')
  })

  it('contains effective net price', () => {
    const { long } = generateCaption(makeInput())
    expect(long).toContain('7,990')
  })

  it('contains saving line when saving > 0', () => {
    const { long } = generateCaption(makeInput())
    expect(long).toContain('ประหยัดไป')
    expect(long).toContain('3,000')
  })

  it('shows ฟรีเลย when effectiveNet <= 0', () => {
    const { long } = generateCaption(makeInput({ effectiveNet: 0, originalPrice: 500 }))
    expect(long).toContain('ฟรีเลย')
  })

  it('contains campaign headline', () => {
    const { long } = generateCaption(makeInput({ campaignContext: doubleCtx }))
    expect(long).toContain('04.04')
  })

  it('contains coupon block with instruction when couponCode provided', () => {
    const { long } = generateCaption(makeInput({ couponCode: 'XMAS50' }))
    expect(long).toContain('XMAS50')
    expect(long).toContain('วิธีรับส่วนลด')
  })

  it('contains bank block when bankPromoSnippet provided', () => {
    const { long } = generateCaption(makeInput({ bankPromoSnippet: 'SCB ลด 8%' }))
    expect(long).toContain('SCB ลด 8%')
    expect(long).toContain('วิธีรับส่วนลด')
  })

  it('omits วิธีรับส่วนลด when neither coupon nor bank promo', () => {
    const { long } = generateCaption(makeInput({ couponCode: null, bankPromoSnippet: null }))
    expect(long).not.toContain('วิธีรับส่วนลด')
  })

  it('contains product URL', () => {
    const { long } = generateCaption(makeInput())
    expect(long).toContain('couponkum.com/product/sony-wh-1000xm5')
  })

  it('contains disclosure at end', () => {
    const { long } = generateCaption(makeInput())
    expect(long.trimEnd()).toMatch(/# โฆษณา$/)
  })

  it('long caption is longer than short caption', () => {
    const result = generateCaption(makeInput())
    expect(result.long.length).toBeGreaterThan(result.short.length)
  })
})

// ---------------------------------------------------------------------------
// templateType
// ---------------------------------------------------------------------------

describe('generateCaption — templateType', () => {
  it('returns "basic" templateType', () => {
    expect(generateCaption(makeInput()).templateType).toBe('basic')
  })
})

// ---------------------------------------------------------------------------
// formatThaiNumber
// ---------------------------------------------------------------------------

describe('formatThaiNumber', () => {
  it('formats 7990 as "7,990"', () => {
    expect(formatThaiNumber(7990)).toBe('7,990')
  })

  it('formats 1000000 with correct separators', () => {
    expect(formatThaiNumber(1000000)).toBe('1,000,000')
  })

  it('formats 500 as "500"', () => {
    expect(formatThaiNumber(500)).toBe('500')
  })
})
