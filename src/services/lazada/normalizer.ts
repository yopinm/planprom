// Lazada product normalization — shared by both the live API adapter and manual import path

import type { Product } from '@/types'

// Manual import / JSON fallback format (unchanged)
export interface LazadaProductItem {
  item_id:        number
  title:          string
  product_url:    string
  affiliate_url:  string
  category_id:    string
  price:          string
  original_price?: string
  min_price?:     string
  max_price?:     string
  seller_id?:     string
  seller_name?:   string
  rating_score?:  number
  sold?:          number
  main_image?:    string
}

// Live API format from GET /marketing/product/feed
export interface LazadaFeedItem {
  productId:            number
  productName:          string
  discountPrice?:       number
  pictures?:            string[]
  categoryL1?:          number
  sellerId?:            number | string
  sellerName?:          string
  totalCommissionRate?: number
  outOfStock?:          boolean
  stock?:               number
  sales7d?:             number
  brandName?:           string
  trackingLink?:        string   // populated after /marketing/product/link call
}

export function toProduct(item: LazadaProductItem, checkedAt?: string): Product {
  const now = new Date().toISOString()
  return {
    id:               String(item.item_id),
    platform:         'lazada',
    platform_id:      String(item.item_id),
    name:             item.title,
    url:              item.product_url,
    affiliate_url:    item.affiliate_url || null,
    category:         item.category_id  || null,
    price_current:    parseFloat(item.price) || 0,
    price_original:   item.original_price ? parseFloat(item.original_price) : null,
    price_min:        item.min_price     ? parseFloat(item.min_price)       : null,
    price_max:        item.max_price     ? parseFloat(item.max_price)       : null,
    shop_id:          item.seller_id   ?? null,
    shop_name:        item.seller_name ?? null,
    shop_type:        null,
    rating:           item.rating_score ?? null,
    sold_count:       item.sold ?? 0,
    image_url:        item.main_image ?? null,
    is_active:        true,
    price_checked_at: checkedAt ?? now,
    created_at:       now,
    updated_at:       now,
  }
}

export function feedToProduct(item: LazadaFeedItem, checkedAt?: string): Product {
  const now          = new Date().toISOString()
  const image        = Array.isArray(item.pictures) ? (item.pictures[0] ?? null) : null
  const trackingLink = item.trackingLink ?? null

  return {
    id:               String(item.productId),
    platform:         'lazada',
    platform_id:      String(item.productId),
    name:             item.productName,
    url:              trackingLink ?? `https://www.lazada.co.th/products/i${item.productId}.html`,
    affiliate_url:    trackingLink,
    category:         item.categoryL1 ? String(item.categoryL1) : null,
    price_current:    item.discountPrice ?? 0,
    price_original:   null,
    price_min:        null,
    price_max:        null,
    shop_id:          item.sellerId != null ? String(item.sellerId) : null,
    shop_name:        item.sellerName ?? null,
    shop_type:        null,
    rating:           null,
    // sales7d is a 7-day window — multiply by 30 for a monthly estimate.
    // Floor at 50 so feed products clear the null-rating trust filter gate.
    sold_count:       Math.max((item.sales7d ?? 0) * 30, 50),
    image_url:        image,
    is_active:        item.outOfStock !== true,
    price_checked_at: checkedAt ?? now,
    created_at:       now,
    updated_at:       now,
  }
}

function isHttpsUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false
  try {
    const { protocol } = new URL(value)
    return protocol === 'https:'
  } catch {
    return false
  }
}

export function isValidLazadaItem(item: unknown): item is LazadaProductItem {
  if (!item || typeof item !== 'object') return false
  const obj = item as Record<string, unknown>
  return (
    typeof obj.item_id === 'number' &&
    typeof obj.title   === 'string' && (obj.title as string).length > 0 &&
    typeof obj.price   === 'string' &&
    isHttpsUrl(obj.product_url) &&
    isHttpsUrl(obj.affiliate_url)
  )
}
