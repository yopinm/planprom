// src/lib/__tests__/revenue-caption-engine.test.ts — TASK 3.19

import { describe, it, expect } from 'vitest'
import {
  selectTemplate,
  generateRevenueCaption,
  type RevenueCaptionInput,
} from '@/lib/revenue-caption-engine'
import type { CampaignContext } from '@/lib/campaign-context'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const normalCtx:  CampaignContext = { type: 'normal',       label: 'ดีลเด็ด',          month: 'เม.ย.' }
const paydayCtx:  CampaignContext = { type: 'payday',       label: 'วันเงินเดือน',      month: 'เม.ย.' }
const ddCtx:      CampaignContext = { type: 'double_date',  label: '04.04 ดีลพิเศษ',   month: 'เม.ย.' }
const peakCtx:    CampaignContext = { type: 'peak_traffic', label: 'เทศกาลช้อปปิ้ง',   month: 'เม.ย.' }
const monthCtx:   CampaignContext = { type: 'month_start',  label: 'ต้นเดือนนี้',       month: 'เม.ย.' }

function makeInput(overrides: Partial<RevenueCaptionInput> = {}): RevenueCaptionInput {
  return {
    productName:    'Samsung Galaxy S24',
    productSlug:    'samsung-galaxy-s24',
    originalPrice:  20000,
    effectiveNet:   15000,
    couponCode:     'SAVE5000',
    campaignContext: normalCtx,
    baseUrl:        'https://couponkum.com',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// selectTemplate
// ---------------------------------------------------------------------------

describe('selectTemplate', () => {
  it('returns rare_fomo when badge=rare', () => {
    expect(selectTemplate({ campaignType: 'normal', badge: 'rare' })).toBe('rare_fomo')
  })

  it('returns rare_fomo when badge=low_stock', () => {
    expect(selectTemplate({ campaignType: 'payday', badge: 'low_stock' })).toBe('rare_fomo')
  })

  it('rare_fomo beats timing (badge wins)', () => {
    expect(selectTemplate({ campaignType: 'double_date', badge: 'rare' })).toBe('rare_fomo')
  })

  it('returns timing for double_date', () => {
    expect(selectTemplate({ campaignType: 'double_date' })).toBe('timing')
  })

  it('returns timing for peak_traffic', () => {
    expect(selectTemplate({ campaignType: 'peak_traffic' })).toBe('timing')
  })

  it('returns money_pain for payday', () => {
    expect(selectTemplate({ campaignType: 'payday' })).toBe('money_pain')
  })

  it('returns money_pain for month_start', () => {
    expect(selectTemplate({ campaignType: 'month_start' })).toBe('money_pain')
  })

  it('returns lazy_buyer when postScore >= 70 + normal context', () => {
    expect(selectTemplate({ campaignType: 'normal', postScore: 70 })).toBe('lazy_buyer')
  })

  it('returns money_pain when postScore < 70 + normal context', () => {
    expect(selectTemplate({ campaignType: 'normal', postScore: 50 })).toBe('money_pain')
  })

  it('returns money_pain as default fallback', () => {
    expect(selectTemplate({ campaignType: 'normal' })).toBe('money_pain')
  })
})

// ---------------------------------------------------------------------------
// generateRevenueCaption — templateType propagation
// ---------------------------------------------------------------------------

describe('generateRevenueCaption — templateType', () => {
  it('auto-selects money_pain for payday context', () => {
    const { templateType } = generateRevenueCaption(makeInput({ campaignContext: paydayCtx }))
    expect(templateType).toBe('money_pain')
  })

  it('auto-selects timing for double_date context', () => {
    const { templateType } = generateRevenueCaption(makeInput({ campaignContext: ddCtx }))
    expect(templateType).toBe('timing')
  })

  it('auto-selects rare_fomo when badge=rare', () => {
    const { templateType } = generateRevenueCaption(makeInput({ badge: 'rare' }))
    expect(templateType).toBe('rare_fomo')
  })

  it('overrides auto-select when templateType is explicit', () => {
    const { templateType } = generateRevenueCaption(
      makeInput({ campaignContext: paydayCtx, templateType: 'lazy_buyer' }),
    )
    expect(templateType).toBe('lazy_buyer')
  })
})

// ---------------------------------------------------------------------------
// generateRevenueCaption — output structure
// ---------------------------------------------------------------------------

describe('generateRevenueCaption — output', () => {
  it('productUrl is always correct', () => {
    const { productUrl } = generateRevenueCaption(makeInput())
    expect(productUrl).toBe('https://couponkum.com/product/samsung-galaxy-s24')
  })

  it('short caption contains product name', () => {
    const { short } = generateRevenueCaption(makeInput())
    expect(short).toContain('Samsung Galaxy S24')
  })

  it('long caption contains product name', () => {
    const { long } = generateRevenueCaption(makeInput())
    expect(long).toContain('Samsung Galaxy S24')
  })

  it('disclosure always appended to short caption', () => {
    const { short } = generateRevenueCaption(makeInput())
    expect(short).toContain('# โฆษณา')
  })

  it('disclosure always appended to long caption', () => {
    const { long } = generateRevenueCaption(makeInput())
    expect(long).toContain('# โฆษณา')
  })

  it('coupon code appears in short caption when provided', () => {
    const { short } = generateRevenueCaption(makeInput())
    expect(short).toContain('SAVE5000')
  })

  it('product URL in short caption', () => {
    const { short } = generateRevenueCaption(makeInput())
    expect(short).toContain('couponkum.com/product/samsung-galaxy-s24')
  })
})

// ---------------------------------------------------------------------------
// money_pain template
// ---------------------------------------------------------------------------

describe('money_pain template', () => {
  const result = generateRevenueCaption(makeInput({ templateType: 'money_pain', campaignContext: paydayCtx }))

  it('short mentions saving', () => {
    expect(result.short).toContain('ประหยัด')
  })

  it('long has price comparison', () => {
    expect(result.long).toMatch(/20[,.]?000/)
    expect(result.long).toMatch(/15[,.]?000/)
  })
})

// ---------------------------------------------------------------------------
// rare_fomo template
// ---------------------------------------------------------------------------

describe('rare_fomo template', () => {
  const result = generateRevenueCaption(makeInput({ templateType: 'rare_fomo', badge: 'rare' }))

  it('short has urgency signal', () => {
    expect(result.short).toContain('⚠️')
  })

  it('long contains scarcity copy', () => {
    expect(result.long).toMatch(/หายาก|สต็อก/)
  })
})

// ---------------------------------------------------------------------------
// timing template
// ---------------------------------------------------------------------------

describe('timing template', () => {
  const result = generateRevenueCaption(makeInput({ templateType: 'timing', campaignContext: ddCtx }))

  it('short contains timing signal (⏰)', () => {
    expect(result.short).toContain('⏰')
  })

  it('long contains campaign label', () => {
    expect(result.long).toContain('04.04 ดีลพิเศษ')
  })
})

// ---------------------------------------------------------------------------
// lazy_buyer template
// ---------------------------------------------------------------------------

describe('lazy_buyer template', () => {
  const result = generateRevenueCaption(makeInput({ templateType: 'lazy_buyer', postScore: 80 }))

  it('short has no-friction signal (✅)', () => {
    expect(result.short).toContain('✅')
  })

  it('long contains easy-decision copy', () => {
    expect(result.long).toMatch(/ไม่ต้อง/)
  })
})

// ---------------------------------------------------------------------------
// peak_traffic context
// ---------------------------------------------------------------------------

describe('peak_traffic context auto-selects timing', () => {
  it('returns timing template', () => {
    const { templateType } = generateRevenueCaption(makeInput({ campaignContext: peakCtx }))
    expect(templateType).toBe('timing')
  })
})

// ---------------------------------------------------------------------------
// month_start context
// ---------------------------------------------------------------------------

describe('month_start context auto-selects money_pain', () => {
  it('returns money_pain template', () => {
    const { templateType } = generateRevenueCaption(makeInput({ campaignContext: monthCtx }))
    expect(templateType).toBe('money_pain')
  })
})
