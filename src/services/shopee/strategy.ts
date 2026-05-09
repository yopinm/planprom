// SHOP-API-READY-1: ShopeeStrategy interface — pluggable manual/live-API adapter
// When Shopee API is approved, swap ShopeeAdapter.strategy to LiveApiStrategy
// without touching any UI or product query code.

import type { Product } from '@/types'
import type { SearchParams, SearchResult } from '@/services/platform.interface'

export interface ShopeeStrategy {
  readonly source: 'manual' | 'live_api'
  search(params: SearchParams): Promise<SearchResult>
  getProduct(productId: string): Promise<Product | null>
  getAffiliateLink(productUrl: string): Promise<string>
}
