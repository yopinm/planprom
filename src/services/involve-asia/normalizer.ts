// Involve Asia offer normalization — maps IA /offers/all item to Product type

import type { Product } from '@/types'

export interface IaOfferItem {
  offer_id:      number | string
  offer_name:    string
  merchant_id?:  number | string | null
  tracking_link: string
  preview_url?:  string | null
  logo?:         string | null
  categories?:   Array<{ name: string }> | null
  commissions?:  Array<{ type: string; value: number }> | null
}

export function toProductFromOffer(item: IaOfferItem, checkedAt?: string): Product {
  const now = new Date().toISOString()
  return {
    id:               `ia-${item.offer_id}`,
    platform:         'shopee',
    platform_id:      `ia-${item.offer_id}`,
    name:             item.offer_name,
    url:              item.preview_url || item.tracking_link,
    affiliate_url:    item.tracking_link || null,
    category:         item.categories?.[0]?.name ?? null,
    price_current:    0,
    price_original:   null,
    price_min:        null,
    price_max:        null,
    shop_id:          item.merchant_id != null ? String(item.merchant_id) : null,
    shop_name:        item.offer_name,
    shop_type:        null,
    rating:           null,
    sold_count:       0,
    image_url:        item.logo || null,
    is_active:        true,
    price_checked_at: checkedAt ?? now,
    created_at:       now,
    updated_at:       now,
  }
}

export function isValidIaOffer(item: unknown): item is IaOfferItem {
  if (!item || typeof item !== 'object') return false
  const obj = item as Record<string, unknown>
  return (
    (typeof obj.offer_id === 'string' || typeof obj.offer_id === 'number') &&
    typeof obj.offer_name === 'string' && (obj.offer_name as string).length > 0 &&
    typeof obj.tracking_link === 'string' && (obj.tracking_link as string).startsWith('https')
  )
}
