// Shopee platform adapter — SHOP-API-READY-1
// Delegates all work to an injected ShopeeStrategy so the implementation
// can be swapped (ManualStrategy → LiveApiStrategy) without touching UI code.
//
// Swap: wire LiveApiStrategy once API is approved.

import type { Platform, Product } from '@/types'
import type { PlatformAdapter, SearchParams, SearchResult } from '@/services/platform.interface'
import type { ShopeeStrategy } from './strategy'
import { ManualStrategy } from './manual-strategy'
import { LiveApiStrategy } from './live-api-strategy'

export class ShopeeAdapter implements PlatformAdapter {
  readonly platform: Platform = 'shopee'

  constructor(private readonly strategy: ShopeeStrategy = new ManualStrategy()) {}

  get dataSource(): string {
    return this.strategy.source
  }

  async search(params: SearchParams): Promise<SearchResult> {
    // When live API is approved: swap strategy in shopeeAdapter singleton below
    return this.strategy.search(params)
  }

  async getProduct(productId: string): Promise<Product | null> {
    return this.strategy.getProduct(productId)
  }

  async getAffiliateLink(productUrl: string): Promise<string> {
    return this.strategy.getAffiliateLink(productUrl)
  }
}

const strategy: ShopeeStrategy = process.env.SHOPEE_APP_ID
  ? new LiveApiStrategy()
  : new ManualStrategy()

export const shopeeAdapter = new ShopeeAdapter(strategy)
