// Involve Asia REST API adapter — AFFNET-IA-API
// SAFE MODE: when IA_REST_API_KEY absent → returns empty, no error, no crash
// Auth: POST /authenticate → 2h token → POST /offers/all

import type { Product } from '@/types'
import { iaPost, IaApiError } from './api'
import { toProductFromOffer, isValidIaOffer, type IaOfferItem } from './normalizer'

interface IaOffersResponse {
  status: string
  data: {
    page:     number
    limit:    number
    count:    number
    nextPage: number | null
    data:     IaOfferItem[]
  }
}

export interface IaSyncResult {
  offers:      Product[]
  total:       number
  pagesLoaded: number
}

export class InvolveAsiaAdapter {
  async syncOffers(limit = 100): Promise<IaSyncResult> {
    if (!process.env.IA_REST_API_KEY) return { offers: [], total: 0, pagesLoaded: 0 }

    const allOffers: Product[] = []
    let page = 1
    let pagesLoaded = 0
    let total = 0
    const checkedAt = new Date().toISOString()

    try {
      while (true) {
        const res = await iaPost<IaOffersResponse>('/offers/all', { page, limit })
        pagesLoaded++
        total = res.data.count

        for (const item of res.data.data) {
          if (isValidIaOffer(item)) {
            allOffers.push({
              ...toProductFromOffer(item, checkedAt),
              data_source: 'involve_asia' as const,
            })
          }
        }

        if (!res.data.nextPage) break
        page = res.data.nextPage
      }
    } catch (err) {
      if (err instanceof IaApiError) {
        console.error('involve-asia: syncOffers failed:', err.message)
      }
    }

    return { offers: allOffers, total, pagesLoaded }
  }

  async generateDeeplink(offerId: string | number, url: string, subId?: string): Promise<string | null> {
    if (!process.env.IA_REST_API_KEY) return null
    try {
      const body: Record<string, unknown> = { offer_id: offerId, url }
      if (subId) body.aff_sub = subId

      const res = await iaPost<{ status: string; data: { tracking_link: string } }>(
        '/deeplink/generate',
        body,
      )
      return res.data?.tracking_link ?? null
    } catch {
      return null
    }
  }
}

export const involveAsiaAdapter = new InvolveAsiaAdapter()
