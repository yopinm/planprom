import { describe, it, expect } from 'vitest'
import {
  generatePlatformCouponContent,
  generateCategoryDealsContent,
  generateComparisonContent,
  generateProductDetailContent,
  generateCampaignContent,
  buildFaqJsonLd,
  COUPON_STATIC_PARAMS,
  DEALS_STATIC_PARAMS,
} from '../pseo-generator'

// ---------------------------------------------------------------------------
// generatePlatformCouponContent
// ---------------------------------------------------------------------------

describe('generatePlatformCouponContent', () => {
  it('returns h1 containing platform name', () => {
    expect(generatePlatformCouponContent('shopee').h1).toContain('Shopee')
    expect(generatePlatformCouponContent('lazada').h1).toContain('Lazada')
  })

  it('returns at least 3 FAQs', () => {
    expect(generatePlatformCouponContent('shopee').faqs.length).toBeGreaterThanOrEqual(3)
  })

  it('each FAQ has non-empty question and answer', () => {
    for (const faq of generatePlatformCouponContent('shopee').faqs) {
      expect(faq.question.length).toBeGreaterThan(0)
      expect(faq.answer.length).toBeGreaterThan(0)
    }
  })

  it('relatedLinks includes rival platform', () => {
    const shopee = generatePlatformCouponContent('shopee').relatedLinks
    expect(shopee.some(l => l.href.includes('lazada'))).toBe(true)
    const lazada = generatePlatformCouponContent('lazada').relatedLinks
    expect(lazada.some(l => l.href.includes('shopee'))).toBe(true)
  })

  it('relatedLinks all start with /', () => {
    for (const link of generatePlatformCouponContent('shopee').relatedLinks) {
      expect(link.href.startsWith('/')).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// generateCategoryDealsContent
// ---------------------------------------------------------------------------

describe('generateCategoryDealsContent', () => {
  it('returns h1 containing category name', () => {
    const content = generateCategoryDealsContent('shopee', 'มือถือ')
    expect(content.h1).toContain('มือถือ')
  })

  it('returns at least 2 FAQs', () => {
    expect(generateCategoryDealsContent('both', 'ความงามและสกินแคร์').faqs.length).toBeGreaterThanOrEqual(2)
  })

  it('includes compare link in relatedLinks', () => {
    const links = generateCategoryDealsContent('shopee', 'มือถือ').relatedLinks
    expect(links.some(l => l.href === '/compare')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// generateComparisonContent
// ---------------------------------------------------------------------------

describe('generateComparisonContent', () => {
  it('returns h1 mentioning Shopee and Lazada', () => {
    const h1 = generateComparisonContent().h1
    expect(h1).toContain('Shopee')
    expect(h1).toContain('Lazada')
  })

  it('returns at least 3 FAQs', () => {
    expect(generateComparisonContent().faqs.length).toBeGreaterThanOrEqual(3)
  })
})

// ---------------------------------------------------------------------------
// generateProductDetailContent
// ---------------------------------------------------------------------------

describe('generateProductDetailContent', () => {
  it('returns h1 containing product name', () => {
    const content = generateProductDetailContent('Samsung Galaxy A55', 'shopee')
    expect(content.h1).toContain('Samsung Galaxy A55')
  })

  it('returns at least 2 FAQs', () => {
    expect(generateProductDetailContent('iPhone 15', 'lazada').faqs.length).toBeGreaterThanOrEqual(2)
  })
})

// ---------------------------------------------------------------------------
// generateCampaignContent
// ---------------------------------------------------------------------------

describe('generateCampaignContent', () => {
  it('payday content mentions วันเงินเดือนออก', () => {
    const content = generateCampaignContent('payday')
    expect(content.h1).toContain('วันเงินเดือนออก')
  })

  it('returns at least 2 FAQs', () => {
    expect(generateCampaignContent('payday').faqs.length).toBeGreaterThanOrEqual(2)
  })
})

// ---------------------------------------------------------------------------
// buildFaqJsonLd
// ---------------------------------------------------------------------------

describe('buildFaqJsonLd', () => {
  const faqs = [
    { question: 'คำถาม 1?', answer: 'คำตอบ 1' },
    { question: 'คำถาม 2?', answer: 'คำตอบ 2' },
  ]

  it('returns FAQPage @type', () => {
    const ld = buildFaqJsonLd(faqs) as Record<string, unknown>
    expect(ld['@type']).toBe('FAQPage')
    expect(ld['@context']).toBe('https://schema.org')
  })

  it('mainEntity length matches faq count', () => {
    const ld = buildFaqJsonLd(faqs) as { mainEntity: unknown[] }
    expect(ld.mainEntity).toHaveLength(faqs.length)
  })

  it('each entity has Question type and answer', () => {
    const ld = buildFaqJsonLd(faqs) as { mainEntity: Array<Record<string, unknown>> }
    for (const entity of ld.mainEntity) {
      expect(entity['@type']).toBe('Question')
      expect(typeof entity.name).toBe('string')
    }
  })
})

// ---------------------------------------------------------------------------
// Static params
// ---------------------------------------------------------------------------

describe('COUPON_STATIC_PARAMS', () => {
  it('includes shopee and lazada', () => {
    const platforms = COUPON_STATIC_PARAMS.map(p => p.platform)
    expect(platforms).toContain('shopee')
    expect(platforms).toContain('lazada')
  })

  it('has exactly 2 entries', () => {
    expect(COUPON_STATIC_PARAMS).toHaveLength(2)
  })
})

describe('DEALS_STATIC_PARAMS', () => {
  it('has at least 4 entries', () => {
    expect(DEALS_STATIC_PARAMS.length).toBeGreaterThanOrEqual(4)
  })

  it('every entry has platform and category', () => {
    for (const p of DEALS_STATIC_PARAMS) {
      expect(typeof p.platform).toBe('string')
      expect(typeof p.category).toBe('string')
      expect(p.platform.length).toBeGreaterThan(0)
      expect(p.category.length).toBeGreaterThan(0)
    }
  })
})
