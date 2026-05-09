// Platform adapter interface — implemented by LazadaAdapter + ShopeeAdapter
// Platform adapters return live API or approved manual-import data.

import type { Platform, Product } from '@/types'

export interface SearchParams {
  query: string
  category?: string
  minPrice?: number
  maxPrice?: number
  limit?: number
  offset?: number
}

export interface SearchResult {
  products: Product[]
  total: number
  page: number
}

export interface PlatformAdapter {
  readonly platform: Platform
  search(params: SearchParams): Promise<SearchResult>
  getProduct(productId: string): Promise<Product | null>
  getAffiliateLink(productUrl: string): Promise<string>
}
