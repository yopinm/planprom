// Deep Link Parser — TASK 1.4 / TASK T.1
// Parses Shopee / Lazada / TikTok product URLs into structured data
//
// Supported formats:
//
// Shopee:
//   https://shopee.co.th/{shop-slug}/{product-slug}-i.{shopId}.{itemId}
//   https://shopee.co.th/product/{shopId}/{itemId}
//   https://shp.ee/{code}  ← short URL (is_short_url: true)
//
// Lazada:
//   https://www.lazada.co.th/products/{slug}-i{itemId}s{skuId}.html
//   https://www.lazada.co.th/products/{slug}.html?id={itemId}
//   https://s.lazada.co.th/s.{code}  ← short URL (is_short_url: true)
//
// TikTok:
//   https://www.tiktok.com/@{user}/video/{videoId}
//   https://www.tiktok.com/view/product/{productId}
//   https://vt.tiktok.com/{code}  ← short URL (is_short_url: true)
//   https://www.tiktok.com/t/{code} ← short URL (is_short_url: true)

import { detectCategory } from '@/lib/constants/categories'

import type { Platform } from '@/types'

// ---------------------------------------------------------------------------
// Output type
// ---------------------------------------------------------------------------

export interface DeepLinkResult {
  platform: Platform
  /** 
   * Shopee: "{shopId}.{itemId}"
   * Lazada: "{itemId}"
   * TikTok: "{videoId}" or "{productId}"
   * undefined if unresolvable
   */
  product_id: string | undefined
  /** Shopee: "{shopId}" | Others: undefined */
  shop_id: string | undefined
  /** Category inferred from URL slug keywords */
  category: string | undefined
  /** true for short URLs — cannot parse without network */
  is_short_url: boolean
  raw_url: string
}

// ---------------------------------------------------------------------------
// Slug extraction helpers
// ---------------------------------------------------------------------------

/** Extract the human-readable slug portion from a Shopee URL for category hints */
function shopeeSlug(url: string): string {
  try {
    const { pathname } = new URL(url)
    // Remove the -i.shopId.itemId suffix and leading slash
    return pathname.replace(/-i\.\d+\.\d+$/, '').replace(/^\//, '')
  } catch {
    return url
  }
}

/** Extract the human-readable slug from a Lazada URL for category hints */
function lazadaSlug(url: string): string {
  try {
    const { pathname } = new URL(url)
    // Remove -i{itemId}s{skuId}.html suffix and /products/ prefix
    return pathname
      .replace(/^\/products\//, '')
      .replace(/-i\d+s\d+\.html$/, '')
      .replace(/\.html$/, '')
  } catch {
    return url
  }
}

/** Extract the human-readable slug from a TikTok URL for category hints */
function tiktokSlug(url: string): string {
  try {
    const parsed = new URL(url)
    // Combine pathname and search to capture keywords in query params (often present in shared TikTok links)
    const text = parsed.pathname + parsed.search
    return text
      .replace(/^\/view\/product\//, '')
      .replace(/^\/video\//, '')
      .replace(/^\/@[^/]+\/video\//, '')
      .replace(/^\//, '')
      .replace(/\/\d+$/, '')
  } catch {
    return url
  }
}

// ---------------------------------------------------------------------------
// Shopee parsers
// ---------------------------------------------------------------------------

function parseShopeeProductId(url: string): { product_id: string; shop_id: string } | undefined {
  // Format 1: -i.{shopId}.{itemId}
  const m1 = url.match(/-i\.(\d+)\.(\d+)/)
  if (m1) return { product_id: `${m1[1]}.${m1[2]}`, shop_id: m1[1] }

  // Format 2: /product/{shopId}/{itemId}
  const m2 = url.match(/\/product\/(\d+)\/(\d+)/)
  if (m2) return { product_id: `${m2[1]}.${m2[2]}`, shop_id: m2[1] }

  return undefined
}

// ---------------------------------------------------------------------------
// Lazada parsers
// ---------------------------------------------------------------------------

function parseLazadaProductId(url: string): { product_id: string } | undefined {
  // Format 1: -i{itemId}s{skuId}.html
  const m1 = url.match(/-i(\d+)s\d+\.html/)
  if (m1) return { product_id: m1[1] }

  // Format 2: ?id={itemId} or &id={itemId}
  const m2 = url.match(/[?&]id=(\d+)/)
  if (m2) return { product_id: m2[1] }

  return undefined
}

// ---------------------------------------------------------------------------
// TikTok parsers
// ---------------------------------------------------------------------------

function parseTiktokProductId(url: string): { product_id: string } | undefined {
  // Format 1: Video ID /@user/video/{videoId} or /video/{videoId}
  const m1 = url.match(/\/video\/(\d+)/)
  if (m1) return { product_id: m1[1] }

  // Format 2: Shop Product ID /view/product/{productId}
  const m2 = url.match(/\/view\/product\/(\d+)/)
  if (m2) return { product_id: m2[1] }

  return undefined
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Parse a Shopee, Lazada, or TikTok product URL.
 * Returns null if the URL is not recognized as a supported platform.
 */
export function parseDeepLink(url: string): DeepLinkResult | null {
  // Shopee short URL
  if (/^https?:\/\/shp\.ee\//i.test(url)) {
    return {
      platform: 'shopee',
      product_id: undefined,
      shop_id: undefined,
      category: undefined,
      is_short_url: true,
      raw_url: url,
    }
  }

  // Lazada short URL
  if (/^https?:\/\/s\.lazada\.co\.th\//i.test(url)) {
    return {
      platform: 'lazada',
      product_id: undefined,
      shop_id: undefined,
      category: undefined,
      is_short_url: true,
      raw_url: url,
    }
  }

  // TikTok short URL (vt.tiktok.com or tiktok.com/t/)
  if (/^https?:\/\/vt\.tiktok\.com\//i.test(url) || /tiktok\.com\/t\//i.test(url)) {
    return {
      platform: 'tiktok',
      product_id: undefined,
      shop_id: undefined,
      category: undefined,
      is_short_url: true,
      raw_url: url,
    }
  }

  // Shopee standard URL
  if (/shopee\.co\.th/i.test(url)) {
    const ids = parseShopeeProductId(url)
    return {
      platform: 'shopee',
      product_id: ids?.product_id,
      shop_id: ids?.shop_id,
      category: detectCategory(shopeeSlug(url)),
      is_short_url: false,
      raw_url: url,
    }
  }

  // Lazada standard URL
  if (/lazada\.co\.th/i.test(url)) {
    const ids = parseLazadaProductId(url)
    return {
      platform: 'lazada',
      product_id: ids?.product_id,
      shop_id: undefined,
      category: detectCategory(lazadaSlug(url)),
      is_short_url: false,
      raw_url: url,
    }
  }

  // TikTok standard URL
  if (/tiktok\.com/i.test(url)) {
    const ids = parseTiktokProductId(url)
    return {
      platform: 'tiktok',
      product_id: ids?.product_id,
      shop_id: undefined,
      category: detectCategory(tiktokSlug(url)),
      is_short_url: false,
      raw_url: url,
    }
  }

  return null
}

/**
 * Returns true if the URL looks like a supported platform URL.
 */
export function isPlatformUrl(url: string): boolean {
  return /shopee\.co\.th|lazada\.co\.th|tiktok\.com|shp\.ee|s\.lazada\.co\.th/i.test(url)
}
