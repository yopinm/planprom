// Shopee Affiliate Open API strategy — productOfferV2

import type { Product } from '@/types'
import type { SearchParams, SearchResult } from '@/services/platform.interface'
import type { ShopeeStrategy } from './strategy'
import { shopeeGql } from './api'
import { toProduct, type ShopeeProductOffer } from './normalizer'

const PRODUCT_OFFER_QUERY = `
  query productOfferV2($sortType: Int, $limit: Int, $page: Int, $keyword: String) {
    productOfferV2(sortType: $sortType, limit: $limit, page: $page, keyword: $keyword) {
      nodes {
        itemId
        productName
        priceMin
        priceMax
        ratingStar
        sales
        imageUrl
        shopId
        shopName
        shopType
        productLink
        offerLink
        commissionRate
        productCatIds
        priceDiscountRate
      }
      pageInfo {
        page
        limit
        hasNextPage
      }
    }
  }
`

interface ProductOfferResult {
  productOfferV2: {
    nodes:    ShopeeProductOffer[]
    pageInfo: { page: number; limit: number; hasNextPage: boolean }
  }
}

export class LiveApiStrategy implements ShopeeStrategy {
  readonly source = 'live_api' as const

  async search(params: SearchParams): Promise<SearchResult> {
    const limit  = Math.min(params.limit ?? 20, 100)
    const offset = params.offset ?? 0
    const page   = Math.floor(offset / limit) + 1

    const data = await shopeeGql<ProductOfferResult>(PRODUCT_OFFER_QUERY, {
      sortType: 2,  // ITEM_SOLD_DESC
      limit,
      page,
      keyword: params.query || undefined,
    })

    const nodes     = data.productOfferV2.nodes
    const checkedAt = new Date().toISOString()

    return {
      products: nodes.map(n => toProduct(n, checkedAt)),
      total:    nodes.length,   // API doesn't expose total count in productOfferV2
      page,
    }
  }

  async getProduct(productId: string): Promise<Product | null> {
    const data = await shopeeGql<ProductOfferResult>(PRODUCT_OFFER_QUERY, {
      sortType: 2,
      limit:    1,
      page:     1,
      keyword:  productId,
    })
    const item = data.productOfferV2.nodes.find(n => String(n.itemId) === productId)
    return item ? toProduct(item) : null
  }

  async getAffiliateLink(productUrl: string): Promise<string> {
    // offerLink is already embedded in the product; no separate link-gen API needed.
    return productUrl
  }
}
