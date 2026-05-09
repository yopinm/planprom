// Search Pipeline — wires all engine layers together (Layers 1–8)
// Pure function: no HTTP, no Supabase — fully testable
//
// Flow:
//   ParsedIntent → filter products → per-product: filter coupons →
//   solve best combination → collect CandidateResults → rank

import type { Coupon, CouponStackRule, DataSource, ParsedIntent, Platform, Product, UserSegment } from '@/types'
import type { FreshnessInfo } from '@/lib/freshness'
import {
  getCouponFreshnessTimestamp,
  getFreshnessInfo,
  getLatestTimestamp,
  getProductFreshnessTimestamp,
} from '@/lib/freshness'
import { filterEligibleCoupons } from './eligibility-filter'
import { solveBestCombination } from './combination-solver'
import { rankResults, computeDealConfidence } from './ranking-engine'
import type { Confidence, RankedResult } from './ranking-engine'

export type SortOption = 'deal' | 'price' | 'rating' | 'sold'

export interface SearchPipelineInput {
  intent: ParsedIntent
  products: Product[]
  coupons: Coupon[]
  stackRules: CouponStackRule[]
  /** Override user segment for eligibility filter; default 'all' */
  userSegment?: UserSegment
  /** Shipping fee applied to all products (baht); default 40 */
  shippingFee?: number
  sort?: SortOption
  /** Max results returned; default 20 */
  limit?: number
  /** For deterministic tests */
  now?: Date
}

export interface SearchPipelineResult {
  results: RankedResult[]
  totalBeforeLimit: number
}

// ---------------------------------------------------------------------------
// Candidate filtering helpers
// ---------------------------------------------------------------------------

/** True when product name, category, or shop_name matches the query string */
function textMatches(product: Product, query: string): boolean {
  if (!query) return true
  const q = query.toLowerCase()
  const name = product.name.toLowerCase()
  const cat = (product.category ?? '').toLowerCase()
  const shop = (product.shop_name ?? '').toLowerCase()
  return name.includes(q) || cat.includes(q) || shop.includes(q)
}

/** Filter products by parsed intent dimensions */
function filterByIntent(products: Product[], intent: ParsedIntent): Product[] {
  return products.filter(p => {
    // Platform filter
    if (intent.platform && p.platform !== intent.platform) return false

    // Budget filter — use price_current as proxy for orderTotal
    if (intent.budget !== undefined && p.price_current > intent.budget) return false

    // Category filter
    if (intent.category && p.category && p.category !== intent.category) return false

    // Text query filter (product_name / url intents)
    if (intent.query && !textMatches(p, intent.query)) return false

    return true
  })
}

// ---------------------------------------------------------------------------
// Sort helpers (post-ranking)
// ---------------------------------------------------------------------------

function applySort(results: RankedResult[], sort: SortOption): RankedResult[] {
  if (sort === 'deal') return results // already sorted by rankResults()

  return [...results].sort((a, b) => {
    switch (sort) {
      case 'price':
        return a.priceResult.effectiveNet - b.priceResult.effectiveNet
      case 'rating':
        return (b.product.rating ?? 0) - (a.product.rating ?? 0)
      case 'sold':
        return b.product.sold_count - a.product.sold_count
    }
  })
}

// ---------------------------------------------------------------------------
// Main pipeline
// ---------------------------------------------------------------------------

export function runSearchPipeline(input: SearchPipelineInput): SearchPipelineResult {
  const {
    intent,
    products,
    coupons,
    stackRules,
    userSegment = 'all',
    shippingFee = 40,
    sort = 'deal',
    limit = 20,
    now = new Date(),
  } = input

  // 1. Filter products by intent
  const filteredProducts = filterByIntent(products, intent)

  // 2. Per-product: filter coupons + solve best combination
  const candidates = filteredProducts
    .filter(p => p.is_active)
    .map(product => {
      const orderTotal = product.price_current
      const category = product.category ?? undefined

      const eligibleCoupons = filterEligibleCoupons(coupons, {
        orderTotal,
        userSegment,
        category,
        now,
      })

      // Use per-product fee from DB when available; fall back to pipeline default
      const productShippingFee =
        product.shipping_fee !== null && product.shipping_fee !== undefined
          ? product.shipping_fee
          : shippingFee

      const priceResult = solveBestCombination({
        originalPrice: product.price_current,
        shippingFee: productShippingFee,
        coupons: eligibleCoupons,
        stackRules,
      })

      return { product, priceResult }
    })

  // 3. Rank (Layer 6-8)
  const ranked = rankResults(candidates, now)
  const totalBeforeLimit = ranked.length

  // 4. Sort + limit
  const sorted = applySort(ranked, sort)
  const results = sorted.slice(0, limit)

  return { results, totalBeforeLimit }
}

// ---------------------------------------------------------------------------
// Response shaping (used by route handler)
// ---------------------------------------------------------------------------

export interface SearchResultItem {
  id: string
  platform: Platform
  name: string
  url: string
  // affiliate_url intentionally omitted — Security Fix #5 (info leak)
  // Clients must use /api/r?id= to go through tracking + domain allowlist
  image_url: string | null
  category: string | null
  shop_name: string | null
  shop_type: string | null
  rating: number | null
  sold_count: number
  price_current: number
  originalPrice: number
  payNow: number
  effectiveNet: number
  shippingFee: number
  itemSubtotal: number
  shippingFinal: number
  itemDiscount: number
  shippingDiscount: number
  cashbackSaving: number
  bankSaving: number
  usedCombination: Coupon[]
  priceFreshness: FreshnessInfo
  couponFreshness: FreshnessInfo | null
  savingsReliable: boolean
  dealScore: RankedResult['dealScore']
  explanation: RankedResult['explanation']
  data_source: DataSource
  dealConfidence: Confidence
  has_affiliate_url: boolean
  /** Aggregate click count from click_logs — 0 when unavailable */
  click_count: number
  /** True = shipping_fee came from DB (accurate); false = 40 baht fallback estimate */
  shipping_fee_known: boolean
  /** ISO timestamp of last price check — used for TRUST-BADGE-1 "ตรวจสอบแล้ว Xh" */
  price_checked_at: string | null
}

export function shapeResult(
  r: RankedResult,
  referenceDate: Date | number = new Date(),
): SearchResultItem {
  const freshnessReference = referenceDate instanceof Date ? referenceDate : new Date()
  const priceFreshness = getFreshnessInfo(getProductFreshnessTimestamp(r.product), freshnessReference)
  const couponTimestamp = getLatestTimestamp(r.priceResult.usedCombination.map(getCouponFreshnessTimestamp))
  const couponFreshness = r.priceResult.usedCombination.length > 0
    ? getFreshnessInfo(couponTimestamp, freshnessReference)
    : null
  const savingsReliable = priceFreshness.isReliable && (couponFreshness?.isReliable ?? true)

  return {
    id:               r.product.id,
    platform:         r.product.platform,
    name:             r.product.name,
    url:              r.product.url,
    image_url:        r.product.image_url,
    category:         r.product.category,
    shop_name:        r.product.shop_name,
    shop_type:        r.product.shop_type,
    rating:           r.product.rating,
    sold_count:       r.product.sold_count,
    price_current:    r.product.price_current,
    originalPrice:    r.priceResult.originalPrice,
    payNow:           r.priceResult.payNow,
    effectiveNet:     r.priceResult.effectiveNet,
    shippingFee:      r.priceResult.shippingFee ?? 0,
    itemSubtotal:     r.priceResult.itemSubtotal ?? r.priceResult.originalPrice,
    shippingFinal:    r.priceResult.shippingFinal ?? 0,
    itemDiscount:     r.priceResult.itemDiscount ?? 0,
    shippingDiscount: r.priceResult.shippingDiscount ?? 0,
    cashbackSaving:   r.priceResult.cashbackSaving ?? 0,
    bankSaving:       r.priceResult.bankSaving ?? 0,
    usedCombination:  r.priceResult.usedCombination,
    priceFreshness,
    couponFreshness,
    savingsReliable,
    dealScore:        r.dealScore,
    explanation:      r.explanation,
    data_source:        r.product.data_source ?? 'api',
    dealConfidence:     computeDealConfidence(
      r.dealScore.total,
      priceFreshness.status,
      r.product.data_source ?? 'api',
    ),
    has_affiliate_url:    Boolean(r.product.affiliate_url),
    click_count:          0,
    shipping_fee_known:   r.product.shipping_fee !== null && r.product.shipping_fee !== undefined,
    price_checked_at:     r.product.price_checked_at ?? null,
  }
}
