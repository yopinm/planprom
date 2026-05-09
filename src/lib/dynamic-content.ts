// src/lib/dynamic-content.ts
// TASK 3.8 — Dynamic Content System
//
// Pure functions that generate content blocks from live product/deal data.
// Unlike PSEO (3.7) which is static at build time, these run at request time
// and reflect current prices, trending deals, and campaign context.

import { getCampaignContext } from './campaign-context'
import type { Product } from '@/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DynamicBlockType =
  | 'trending_deals'
  | 'savings_callout'
  | 'campaign_banner'
  | 'platform_highlight'

export interface TrendingDealsBlock {
  type: 'trending_deals'
  headline: string
  subline: string
  products: Product[]
  updatedAt: string
}

export interface SavingsCalloutBlock {
  type: 'savings_callout'
  headline: string
  maxSaving: number
  avgSaving: number
  currency: string
}

export interface CampaignBannerBlock {
  type: 'campaign_banner'
  campaignType: string
  headline: string
  badge: string
  ctaText: string
  ctaHref: string
}

export interface PlatformHighlightBlock {
  type: 'platform_highlight'
  platform: 'shopee' | 'lazada'
  label: string
  dealCount: number
  topDealTitle: string
}

export type DynamicContentBlock =
  | TrendingDealsBlock
  | SavingsCalloutBlock
  | CampaignBannerBlock
  | PlatformHighlightBlock

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/**
 * Top N products sorted by deal_score descending.
 * Used to populate "ดีลเด็ดตอนนี้" sections on landing/search pages.
 */
export function generateTrendingDeals(
  products: Product[],
  limit = 6,
  date: Date = new Date(),
): TrendingDealsBlock {
  const ctx = getCampaignContext(date)
  const sorted = [...products]
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, limit)

  const headline =
    ctx.type === 'double_date' ? `ดีลเด็ดช่วง ${ctx.label}` :
    ctx.type === 'payday'      ? 'ดีลวันเงินเดือน — ประหยัดสูงสุด' :
    ctx.type === 'month_start' ? 'ดีลต้นเดือนมาแล้ว' :
                                 'ดีลเด็ดตอนนี้'

  return {
    type: 'trending_deals',
    headline,
    subline: `อัปเดตทุก 5 นาที · ${sorted.length} รายการ`,
    products: sorted,
    updatedAt: date.toISOString(),
  }
}

/**
 * Savings summary block — shows max/avg savings across products.
 * Used in above-the-fold sections for conversion uplift.
 */
export function generateSavingsCallout(products: Product[]): SavingsCalloutBlock {
  const savings = products
    .map(p => {
      if (p.price_original && p.price_current) return p.price_original - p.price_current
      return 0
    })
    .filter(s => s > 0)

  const maxSaving = savings.length > 0 ? Math.max(...savings) : 0
  const avgSaving =
    savings.length > 0 ? Math.round(savings.reduce((a, b) => a + b, 0) / savings.length) : 0

  const headline =
    maxSaving > 0
      ? `ประหยัดสูงสุด ฿${maxSaving.toLocaleString('th-TH')}`
      : 'ราคาดีที่สุดจากทุกแพลตฟอร์ม'

  return {
    type: 'savings_callout',
    headline,
    maxSaving,
    avgSaving,
    currency: 'THB',
  }
}

/**
 * Campaign banner driven by current date context.
 * Returns a seasonal CTA banner for landing/search pages.
 */
export function generateCampaignBanner(date: Date = new Date()): CampaignBannerBlock {
  const ctx = getCampaignContext(date)

  const banners: Record<string, Omit<CampaignBannerBlock, 'type' | 'campaignType'>> = {
    double_date: {
      headline: ctx.label,
      badge: '🔥 แคมเปญพิเศษ',
      ctaText: 'ดูดีลทั้งหมด',
      ctaHref: '/search?q=ลดราคา',
    },
    payday: {
      headline: 'วันเงินเดือน — ช้อปให้คุ้มด้วยคูปองคุ้ม',
      badge: '💰 วันเงินเดือน',
      ctaText: 'ดูโปรพิเศษ',
      ctaHref: '/deals/payday',
    },
    month_start: {
      headline: 'ต้นเดือนนี้มีดีลอะไรบ้าง?',
      badge: '🆕 ดีลใหม่',
      ctaText: 'เช็กเลย',
      ctaHref: '/search?q=โปรโมชั่น',
    },
    normal: {
      headline: 'คูปองและดีลที่ดีที่สุด อัปเดตทุกวัน',
      badge: '',
      ctaText: 'ค้นหาดีล',
      ctaHref: '/',
    },
  }

  const banner = banners[ctx.type] ?? banners.normal

  return { type: 'campaign_banner', campaignType: ctx.type, ...banner }
}

/**
 * Per-platform deal highlight block.
 * Shows how many deals are available on a given platform.
 */
export function generatePlatformHighlight(
  platform: 'shopee' | 'lazada',
  products: Product[],
): PlatformHighlightBlock {
  const platformProducts = products.filter(p => p.platform === platform)
  const top = platformProducts.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0]

  const label = platform === 'shopee' ? 'Shopee' : 'Lazada'

  return {
    type: 'platform_highlight',
    platform,
    label,
    dealCount: platformProducts.length,
    topDealTitle: top?.name ?? `ดีลเด็ดจาก ${label}`,
  }
}
