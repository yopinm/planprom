import { describe, it, expect } from 'vitest'
import { toProduct, type ShopeeProductOffer } from '@/services/shopee/normalizer'
import type { Product } from '@/types'

const REQUIRED_KEYS: (keyof Product)[] = [
  'id', 'platform', 'platform_id', 'name', 'url', 'affiliate_url',
  'category', 'price_current', 'price_original', 'price_min', 'price_max',
  'shop_id', 'shop_name', 'shop_type', 'rating', 'sold_count', 'image_url',
  'is_active', 'price_checked_at', 'created_at', 'updated_at',
]

const sample: ShopeeProductOffer = {
  itemId:        17979995178,
  productName:   'IKEA starfish',
  priceMin:      '45.99',
  priceMax:      '55.99',
  ratingStar:    '4.7',
  sales:         25,
  imageUrl:      'https://cf.shopee.co.th/file/abc.jpg',
  shopId:        84499012,
  shopName:      'IKEA',
  shopType:      [1],
  productLink:   'https://shopee.co.th/product/84499012/17979995178',
  offerLink:     'https://shope.ee/abctest',
  commissionRate: '0.05',
  productCatIds: [100012, 100068],
}

function assertShape(p: Product): void {
  for (const key of REQUIRED_KEYS) {
    expect(p, `missing key: ${key}`).toHaveProperty(key)
  }
  expect(p.platform).toBe('shopee')
  expect(typeof p.price_current).toBe('number')
  expect(typeof p.sold_count).toBe('number')
  expect(typeof p.is_active).toBe('boolean')
}

describe('toProduct (Shopee normalizer)', () => {
  it('maps all required Product fields', () => {
    assertShape(toProduct(sample))
  })

  it('uses offerLink as url and affiliate_url', () => {
    const p = toProduct(sample)
    expect(p.url).toBe('https://shope.ee/abctest')
    expect(p.affiliate_url).toBe('https://shope.ee/abctest')
  })

  it('falls back to productLink when offerLink missing', () => {
    const p = toProduct({ ...sample, offerLink: undefined })
    expect(p.url).toBe('https://shopee.co.th/product/84499012/17979995178')
    expect(p.affiliate_url).toBeNull()
  })

  it('parses price strings to numbers', () => {
    const p = toProduct(sample)
    expect(p.price_min).toBe(45.99)
    expect(p.price_max).toBe(55.99)
    expect(p.price_current).toBe(45.99)
  })

  it('resolves shopType flags to ShopType', () => {
    expect(toProduct({ ...sample, shopType: [1] }).shop_type).toBe('mall')
    expect(toProduct({ ...sample, shopType: [2] }).shop_type).toBe('official')
    expect(toProduct({ ...sample, shopType: [4] }).shop_type).toBe('official')
    expect(toProduct({ ...sample, shopType: [] }).shop_type).toBeNull()
  })

  it('uses productCatIds[0] as category', () => {
    expect(toProduct(sample).category).toBe('100012')
  })

  it('sets price_checked_at when provided', () => {
    const at = '2026-05-06T00:00:00.000Z'
    expect(toProduct(sample, at).price_checked_at).toBe(at)
  })

  it('defaults to constructed URL when both links missing', () => {
    const p = toProduct({ ...sample, productLink: undefined, offerLink: undefined })
    expect(p.url).toContain(String(sample.itemId))
  })
})
