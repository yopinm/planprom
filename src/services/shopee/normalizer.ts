// Shopee ProductOfferV2 → Product normalizer

import type { Product } from '@/types'

import type { ShopType } from '@/types'

// shopType flags: 1=Shopee Mall/official, 2=preferred, 4=preferred_plus
function resolveShopType(shopType: number[] | undefined): ShopType | null {
  if (!shopType?.length) return null
  if (shopType.includes(1)) return 'mall'
  if (shopType.includes(2) || shopType.includes(4)) return 'official'
  return 'normal'
}

export interface ShopeeProductOffer {
  itemId:             number | string
  productName:        string
  priceMin?:          string
  priceMax?:          string
  ratingStar?:        string
  sales?:             number
  imageUrl?:          string
  shopId?:            number | string
  shopName?:          string
  shopType?:          number[]
  productLink?:       string
  offerLink?:         string
  commissionRate?:    string
  productCatIds?:     number[]
  priceDiscountRate?: number
}

export function toProduct(item: ShopeeProductOffer, checkedAt?: string): Product {
  const now = new Date().toISOString()
  const id  = String(item.itemId)

  const priceMin = item.priceMin != null ? parseFloat(item.priceMin) : null
  const priceMax = item.priceMax != null ? parseFloat(item.priceMax) : null
  const price    = priceMin ?? 0

  const productUrl = item.productLink
    ?? `https://shopee.co.th/product/-/${id}`

  return {
    id,
    platform:        'shopee',
    platform_id:     id,
    name:            item.productName,
    url:             item.offerLink ?? productUrl,
    affiliate_url:   item.offerLink ?? null,
    category:        item.productCatIds?.[0] != null ? String(item.productCatIds[0]) : null,
    price_current:   price,
    price_original:  null,
    price_min:       priceMin,
    price_max:       priceMax,
    shop_id:         item.shopId != null ? String(item.shopId) : null,
    shop_name:       item.shopName ?? null,
    shop_type:       resolveShopType(item.shopType),
    rating:          item.ratingStar != null ? parseFloat(item.ratingStar) : null,
    sold_count:      item.sales ?? 0,
    image_url:       item.imageUrl ?? null,
    is_active:       true,
    price_checked_at: checkedAt ?? now,
    created_at:      now,
    updated_at:      now,
  }
}
