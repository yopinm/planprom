// Lazada REST API adapter
// Implements PlatformAdapter interface
//
// Data source priority:
//   1. LAZADA_APP_KEY present      → calls Lazada Open API
//   2. Neither                     → reads data/lazada-products.json (manual import fallback)

import type { Platform, Product } from '@/types'
import type { PlatformAdapter, SearchParams, SearchResult } from '@/services/platform.interface'
import { lazadaGet } from './api'
import { toProduct, feedToProduct } from './normalizer'
import type { LazadaFeedItem } from './normalizer'
import { loadManualImportProducts } from './manual-import'

const HAS_API_KEY = Boolean(process.env.LAZADA_APP_KEY)

// /marketing/product/feed response: lazadaGet returns json.result = { data: [...], total_results: N }
interface ProductFeedResponse {
  data?:          LazadaFeedItem[]
  total_results?: number
}

interface ProductLinkResponse {
  data?: { trackingLink?: string }
}

export class LazadaAdapter implements PlatformAdapter {
  readonly platform: Platform = 'lazada'

  async search(params: SearchParams): Promise<SearchResult> {
    if (HAS_API_KEY) {
      return this._searchApi(params)
    }

    return this._searchManual(params)
  }

  private async _searchApi(params: SearchParams): Promise<SearchResult> {
    const limit     = params.limit  ?? 20
    const offset    = params.offset ?? 0
    const pageNo    = Math.floor(offset / limit) + 1
    const userToken = process.env.LAZADA_USER_TOKEN ?? ''

    const data = await lazadaGet<ProductFeedResponse>(
      '/marketing/product/feed',
      {
        offerType: '1',   // Regular offer
        userToken,
        page:      String(pageNo),
        limit:     String(limit),
      },
      // userToken is already in params — do NOT pass as access_token
    )

    const items     = data.data ?? []
    const checkedAt = new Date().toISOString()

    // Fetch tracking link for each product (serialised via lazadaQueue inside lazadaGet)
    const withLinks = await Promise.all(
      items.map(async (item) => {
        try {
          const link = await lazadaGet<ProductLinkResponse>(
            '/marketing/product/link',
            { userToken, productId: String(item.productId) },
          )
          return { ...item, trackingLink: link.data?.trackingLink }
        } catch {
          return item
        }
      }),
    )

    return {
      products: withLinks.map(item => ({ ...feedToProduct(item, checkedAt), data_source: 'api' as const })),
      total:    data.total_results ?? items.length,
      page:     pageNo,
    }
  }

  private _searchManual(params: SearchParams): SearchResult {
    const all = loadManualImportProducts()
    const filtered = all.filter((p) => {
      const matchQuery    = p.name.toLowerCase().includes(params.query.toLowerCase())
      const matchCategory = !params.category || p.category === params.category
      const matchMin      = !params.minPrice  || p.price_current >= params.minPrice
      const matchMax      = !params.maxPrice  || p.price_current <= params.maxPrice
      return matchQuery && matchCategory && matchMin && matchMax
    })

    const limit  = params.limit  ?? 20
    const offset = params.offset ?? 0
    return {
      products: filtered.slice(offset, offset + limit).map(p => ({ ...p, data_source: 'manual' as const })),
      total:    filtered.length,
      page:     Math.floor(offset / limit) + 1,
    }
  }

  async getProduct(productId: string): Promise<Product | null> {
    if (HAS_API_KEY) {
      const data = await lazadaGet<{ item: import('./normalizer').LazadaProductItem }>(
        '/products/get',
        { item_id: productId },
      )
      const checkedAt = new Date().toISOString()
      return data.item ? toProduct(data.item, checkedAt) : null
    }

    const all = loadManualImportProducts()
    return all.find((p) => p.platform_id === productId) ?? null
  }

  async getAffiliateLink(productUrl: string): Promise<string> {
    if (!HAS_API_KEY) return productUrl

    // Extract numeric productId from a Lazada product URL (e.g. /products/name-i123456-s...)
    const match = productUrl.match(/[/-]i(\d{6,})/)
    if (!match) return productUrl

    const userToken = process.env.LAZADA_USER_TOKEN ?? ''
    try {
      const data = await lazadaGet<ProductLinkResponse>(
        '/marketing/product/link',
        { userToken, productId: match[1] },
      )
      return data.data?.trackingLink ?? productUrl
    } catch {
      return productUrl
    }
  }
}

export const lazadaAdapter = new LazadaAdapter()
