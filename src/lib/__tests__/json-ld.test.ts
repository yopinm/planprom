// src/lib/__tests__/json-ld.test.ts
// TASK 2.12 — JSON-LD builder unit tests

import { describe, it, expect } from 'vitest'
import {
  buildProductJsonLd,
  buildBreadcrumbJsonLd,
  buildWebSiteJsonLd,
  toJsonLdString,
} from '@/lib/json-ld'

// ---------------------------------------------------------------------------
// buildProductJsonLd
// ---------------------------------------------------------------------------

describe('buildProductJsonLd', () => {
  const base = {
    id:           'prod-1',
    name:         'Samsung Galaxy A55',
    priceCurrent:  11990,
    currency:     'THB',
    platform:     'shopee',
    url:          'https://shopee.co.th/product/test',
  }

  it('includes required schema.org fields', () => {
    const schema = buildProductJsonLd(base) as Record<string, unknown>
    expect(schema['@context']).toBe('https://schema.org')
    expect(schema['@type']).toBe('Product')
    expect(schema['name']).toBe('Samsung Galaxy A55')
  })

  it('formats price as string with 2 decimal places', () => {
    const schema = buildProductJsonLd(base) as Record<string, unknown>
    const offer = schema['offers'] as Record<string, unknown>
    expect(offer['price']).toBe('11990.00')
    expect(offer['priceCurrency']).toBe('THB')
  })

  it('includes availability InStock', () => {
    const schema = buildProductJsonLd(base) as Record<string, unknown>
    const offer = schema['offers'] as Record<string, unknown>
    expect(offer['availability']).toContain('InStock')
  })

  it('adds highPrice when priceOriginal > priceCurrent', () => {
    const schema = buildProductJsonLd({
      ...base,
      priceOriginal: 13990,
    }) as Record<string, unknown>
    const offer = schema['offers'] as Record<string, unknown>
    expect(offer['highPrice']).toBe('13990.00')
    expect(offer['priceType']).toContain('SalePrice')
  })

  it('does not add highPrice when no priceOriginal', () => {
    const schema = buildProductJsonLd(base) as Record<string, unknown>
    const offer = schema['offers'] as Record<string, unknown>
    expect(offer['highPrice']).toBeUndefined()
  })

  it('adds AggregateRating when rating + soldCount are sufficient', () => {
    const schema = buildProductJsonLd({
      ...base,
      rating:    4.9,
      soldCount: 1000,
    }) as Record<string, unknown>
    const agg = schema['aggregateRating'] as Record<string, unknown>
    expect(agg['@type']).toBe('AggregateRating')
    expect(agg['ratingValue']).toBe('4.9')
    expect(agg['reviewCount']).toBe(1000)
  })

  it('omits AggregateRating when soldCount < 5', () => {
    const schema = buildProductJsonLd({
      ...base,
      rating:    4.5,
      soldCount: 2,
    }) as Record<string, unknown>
    expect(schema['aggregateRating']).toBeUndefined()
  })

  it('omits AggregateRating when rating is null', () => {
    const schema = buildProductJsonLd({
      ...base,
      rating:    null,
      soldCount: 500,
    }) as Record<string, unknown>
    expect(schema['aggregateRating']).toBeUndefined()
  })

  it('adds image when imageUrl is provided', () => {
    const schema = buildProductJsonLd({
      ...base,
      imageUrl: 'https://img.example.com/product.jpg',
    }) as Record<string, unknown>
    expect(schema['image']).toBe('https://img.example.com/product.jpg')
  })

  it('adds brand when shopName is provided', () => {
    const schema = buildProductJsonLd({
      ...base,
      shopName: 'Samsung Official',
    }) as Record<string, unknown>
    const brand = schema['brand'] as Record<string, unknown>
    expect(brand['name']).toBe('Samsung Official')
  })
})

// ---------------------------------------------------------------------------
// buildBreadcrumbJsonLd
// ---------------------------------------------------------------------------

describe('buildBreadcrumbJsonLd', () => {
  it('returns BreadcrumbList type', () => {
    const schema = buildBreadcrumbJsonLd([
      { name: 'หน้าแรก', href: '/' },
    ]) as Record<string, unknown>
    expect(schema['@type']).toBe('BreadcrumbList')
  })

  it('assigns correct positions (1-based)', () => {
    const schema = buildBreadcrumbJsonLd([
      { name: 'หน้าแรก', href: '/' },
      { name: 'ค้นหา',   href: '/search?q=iphone' },
      { name: 'iPhone',  href: '/product/xyz' },
    ]) as Record<string, unknown>
    const items = schema['itemListElement'] as Array<Record<string, unknown>>
    expect(items[0]['position']).toBe(1)
    expect(items[1]['position']).toBe(2)
    expect(items[2]['position']).toBe(3)
  })

  it('prepends BASE_URL for relative hrefs', () => {
    const schema = buildBreadcrumbJsonLd([
      { name: 'หน้าแรก', href: '/' },
    ]) as Record<string, unknown>
    const items = schema['itemListElement'] as Array<Record<string, unknown>>
    expect((items[0]['item'] as string)).toMatch(/^https?:\/\//)
  })

  it('preserves absolute hrefs as-is', () => {
    const abs = 'https://other.example.com/page'
    const schema = buildBreadcrumbJsonLd([
      { name: 'External', href: abs },
    ]) as Record<string, unknown>
    const items = schema['itemListElement'] as Array<Record<string, unknown>>
    expect(items[0]['item']).toBe(abs)
  })
})

// ---------------------------------------------------------------------------
// buildWebSiteJsonLd
// ---------------------------------------------------------------------------

describe('buildWebSiteJsonLd', () => {
  it('returns WebSite type with SearchAction', () => {
    const schema = buildWebSiteJsonLd() as Record<string, unknown>
    expect(schema['@type']).toBe('WebSite')
    const action = schema['potentialAction'] as Record<string, unknown>
    expect(action['@type']).toBe('SearchAction')
  })
})

// ---------------------------------------------------------------------------
// toJsonLdString
// ---------------------------------------------------------------------------

describe('toJsonLdString', () => {
  it('produces valid JSON', () => {
    const s = toJsonLdString({ '@type': 'Product', name: 'test' })
    expect(() => JSON.parse(s)).not.toThrow()
  })

  it('works with arrays', () => {
    const s = toJsonLdString([{ '@type': 'A' }, { '@type': 'B' }])
    const parsed = JSON.parse(s)
    expect(Array.isArray(parsed)).toBe(true)
    expect(parsed).toHaveLength(2)
  })
})
