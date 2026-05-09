import { describe, expect, it } from 'vitest'
import { productsFromScoredRows } from '@/lib/product-query'
import type { Product } from '@/types'

const PRODUCT = {
  id:             'p1',
  platform:       'shopee',
  platform_id:    's1',
  name:           'Demo',
  url:            'https://shopee.co.th/demo',
  affiliate_url:  null,
  category:       null,
  price_current:  100,
  price_original: null,
  price_min:      null,
  price_max:      null,
  shop_id:        null,
  shop_name:      null,
  shop_type:      null,
  rating:         4.5,
  sold_count:     10,
  image_url:      null,
  is_active:      true,
  created_at:     '2026-04-20T00:00:00.000Z',
  updated_at:     '2026-04-20T00:00:00.000Z',
} satisfies Product

describe('TASK 4.1 product query helpers', () => {
  it('extracts products from rare_item_scores join rows', () => {
    expect(productsFromScoredRows([{ products: PRODUCT }])).toEqual([PRODUCT])
  })

  it('handles Supabase relation arrays defensively', () => {
    expect(productsFromScoredRows([{ products: [PRODUCT] }])).toEqual([PRODUCT])
  })

  it('drops rows without product joins', () => {
    expect(productsFromScoredRows([{ products: null }])).toEqual([])
  })
})
