// SHOP-API-READY-1: ManualStrategy — placeholder until Shopee API/manual import is approved.
// Swap to LiveApiStrategy when Shopee Affiliate API is approved.

import type { Product } from '@/types'
import type { SearchParams, SearchResult } from '@/services/platform.interface'
import type { ShopeeStrategy } from './strategy'

export class ManualStrategy implements ShopeeStrategy {
  readonly source = 'manual' as const

  async search(params: SearchParams): Promise<SearchResult> {
    const limit  = params.limit  ?? 20
    const offset = params.offset ?? 0

    return {
      products: [],
      total: 0,
      page:  Math.floor(offset / limit) + 1,
    }
  }

  async getProduct(productId: string): Promise<Product | null> {
    void productId
    return null
  }

  async getAffiliateLink(productUrl: string): Promise<string> {
    return productUrl
  }
}
