import { describe, expect, it } from 'vitest'
import { toProduct, feedToProduct } from '@/services/lazada/normalizer'
import type { LazadaFeedItem } from '@/services/lazada/normalizer'
import { normalizeManualImport } from '@/services/lazada/manual-import'
import type { Product } from '@/types'

const REQUIRED_KEYS: (keyof Product)[] = [
  'id', 'platform', 'platform_id', 'name', 'url', 'affiliate_url',
  'category', 'price_current', 'price_original', 'price_min', 'price_max',
  'shop_id', 'shop_name', 'shop_type', 'rating', 'sold_count', 'image_url',
  'is_active', 'price_checked_at', 'created_at', 'updated_at',
]

const sampleRaw = {
  item_id:        12345,
  title:          'Test Product',
  product_url:    'https://www.lazada.co.th/products/test',
  affiliate_url:  'https://s.lazada.co.th/s.aff',
  category_id:    'electronics',
  price:          '9990',
  original_price: '12990',
  min_price:      '9990',
  max_price:      '9990',
  seller_id:      'seller-123',
  seller_name:    'Test Shop',
  rating_score:   4.5,
  sold:           1200,
  main_image:     'https://example.com/image.jpg',
}

function assertProductShape(p: Product): void {
  for (const key of REQUIRED_KEYS) {
    expect(p, `missing key: ${key}`).toHaveProperty(key)
  }
  expect(p.platform).toBe('lazada')
  expect(typeof p.price_current).toBe('number')
  expect(typeof p.sold_count).toBe('number')
  expect(typeof p.is_active).toBe('boolean')
  expect(typeof p.created_at).toBe('string')
  expect(typeof p.updated_at).toBe('string')
}

describe('toProduct (normalizer)', (): void => {
  it('maps all required Product fields', (): void => {
    assertProductShape(toProduct(sampleRaw))
  })

  it('parses price strings to numbers', (): void => {
    const p = toProduct(sampleRaw)
    expect(p.price_current).toBe(9990)
    expect(p.price_original).toBe(12990)
    expect(p.price_min).toBe(9990)
    expect(p.price_max).toBe(9990)
  })

  it('sets price_checked_at when provided', (): void => {
    const at = '2026-04-24T00:00:00.000Z'
    expect(toProduct(sampleRaw, at).price_checked_at).toBe(at)
  })

  it('defaults price_checked_at to current time', (): void => {
    const before = Date.now()
    const p = toProduct(sampleRaw)
    expect(new Date(p.price_checked_at!).getTime()).toBeGreaterThanOrEqual(before)
  })

  it('defaults sold_count to 0 when missing', (): void => {
    expect(toProduct({ ...sampleRaw, sold: undefined }).sold_count).toBe(0)
  })

  it('returns null for optional missing fields', (): void => {
    const minimal = {
      item_id: 1,
      title: 'T',
      product_url: 'https://www.lazada.co.th/products/minimal',
      affiliate_url: '',
      category_id: '',
      price: '100',
    }
    const p = toProduct(minimal)
    expect(p.price_original).toBeNull()
    expect(p.shop_type).toBeNull()
    expect(p.rating).toBeNull()
    expect(p.image_url).toBeNull()
  })
})

const sampleFeedItem: LazadaFeedItem = {
  productId:    99999,
  productName:  'Feed Test Product',
  discountPrice: 4990,
  pictures:     ['https://example.com/feed.jpg'],
  categoryL1:   1,
  sellerId:     777,
  sellerName:   'Feed Shop',
  sales7d:      50,
  outOfStock:   false,
  trackingLink: 'https://c.lazada.co.th/t/c.test',
}

describe('feedToProduct (live API normalizer)', (): void => {
  it('maps all required Product fields', (): void => {
    assertProductShape(feedToProduct(sampleFeedItem))
  })

  it('uses trackingLink as both url and affiliate_url', (): void => {
    const p = feedToProduct(sampleFeedItem)
    expect(p.url).toBe('https://c.lazada.co.th/t/c.test')
    expect(p.affiliate_url).toBe('https://c.lazada.co.th/t/c.test')
  })

  it('falls back to constructed URL when trackingLink missing', (): void => {
    const p = feedToProduct({ ...sampleFeedItem, trackingLink: undefined })
    expect(p.url).toContain('99999')
    expect(p.affiliate_url).toBeNull()
  })

  it('maps outOfStock=true to is_active=false', (): void => {
    expect(feedToProduct({ ...sampleFeedItem, outOfStock: true }).is_active).toBe(false)
    expect(feedToProduct({ ...sampleFeedItem, outOfStock: false }).is_active).toBe(true)
  })

  it('scales sales7d × 30 for sold_count (monthly estimate, floor 50)', (): void => {
    // sampleFeedItem.sales7d = 50 → max(50*30, 50) = 1500
    expect(feedToProduct(sampleFeedItem).sold_count).toBe(1500)
    // sales7d = 1 → max(1*30, 50) = 50
    expect(feedToProduct({ ...sampleFeedItem, sales7d: 1 }).sold_count).toBe(50)
    // sales7d = 0 → max(0*30, 50) = 50
    expect(feedToProduct({ ...sampleFeedItem, sales7d: 0 }).sold_count).toBe(50)
  })

  it('sets price_checked_at when provided', (): void => {
    const at = '2026-05-06T00:00:00.000Z'
    expect(feedToProduct(sampleFeedItem, at).price_checked_at).toBe(at)
  })
})

describe('normalizeManualImport (manual fallback)', (): void => {
  it('normalizes a valid raw item to Product shape', (): void => {
    const [p] = normalizeManualImport([sampleRaw])
    assertProductShape(p)
  })

  it('skips items with missing required fields', (): void => {
    const bad = [
      null,
      { item_id: 'not-a-number', title: 'bad', price: '100' },
      { item_id: 1, price: '100' },
      sampleRaw,
    ]
    expect(normalizeManualImport(bad)).toHaveLength(1)
  })

  it('returns empty array for empty input', (): void => {
    expect(normalizeManualImport([])).toEqual([])
  })

  it('API and manual import paths produce structurally identical Product keys', (): void => {
    const fromAdapter = toProduct(sampleRaw, '2026-04-24T00:00:00.000Z')
    const [fromImport] = normalizeManualImport([sampleRaw])

    expect(Object.keys(fromImport).sort()).toEqual(Object.keys(fromAdapter).sort())
  })
})
