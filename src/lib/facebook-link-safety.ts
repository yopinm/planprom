// TASK 3.22 — 3-Point Matching & Link Safety

import type { Coupon, Product } from '@/types'

export type LinkSafetyViolationCode =
  | 'product_url_missing'
  | 'product_url_invalid'
  | 'product_url_mismatch'
  | 'product_url_unavailable'
  | 'coupon_invalid'
  | 'price_missing'
  | 'price_mismatch'

export interface LinkSafetyViolation {
  code: LinkSafetyViolationCode
  severity: 'block'
  detail?: string
  message: string
}

export interface LinkSafetyResult {
  passed: boolean
  violations: LinkSafetyViolation[]
  checkedAt: string
}

export interface LinkSafetyOptions {
  baseUrl?: string
  now?: Date
  priceTolerancePct?: number
}

const DEFAULT_BASE_URL = 'https://couponkum.com'
const DEFAULT_PRICE_TOLERANCE_PCT = 5

const URL_PATTERN = /https?:\/\/[^\s<>"')\]]+/g
const COUPON_PATTERN = /(?:โค้ด|code|coupon)\s*[:：]\s*([A-Z0-9][A-Z0-9_-]{1,63})/giu
const BAHT_PATTERN = /(?:฿\s*)?((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?)\s*บาท/gu

function stripTrailingPunctuation(url: string): string {
  return url.replace(/[.,!?]+$/u, '')
}

function normalizeHost(host: string): string {
  return host.replace(/^www\./u, '').toLowerCase()
}

function allowedProductHosts(baseUrl: string): Set<string> {
  const hosts = new Set<string>(['couponkum.com'])
  try {
    hosts.add(normalizeHost(new URL(baseUrl).hostname))
  } catch {
    hosts.add(normalizeHost(DEFAULT_BASE_URL))
  }
  return hosts
}

export function extractCaptionUrls(caption: string): string[] {
  return (caption.match(URL_PATTERN) ?? []).map(stripTrailingPunctuation)
}

export function extractCouponCodes(caption: string): string[] {
  const codes = new Set<string>()
  for (const match of caption.matchAll(COUPON_PATTERN)) {
    const code = match[1]?.trim().toUpperCase()
    if (code) codes.add(code)
  }
  return [...codes]
}

export function extractBahtAmounts(caption: string): number[] {
  const amounts: number[] = []
  for (const match of caption.matchAll(BAHT_PATTERN)) {
    const raw = match[1]?.replace(/,/gu, '')
    if (!raw) continue
    const amount = Number(raw)
    if (Number.isFinite(amount)) amounts.push(amount)
  }
  return amounts
}

function extractProductSlugs(caption: string, baseUrl: string): string[] {
  const hosts = allowedProductHosts(baseUrl)
  const slugs: string[] = []

  for (const rawUrl of extractCaptionUrls(caption)) {
    let parsed: URL
    try {
      parsed = new URL(rawUrl)
    } catch {
      continue
    }

    if (!hosts.has(normalizeHost(parsed.hostname))) continue
    const parts = parsed.pathname.split('/').filter(Boolean)
    if (parts[0] !== 'product' || !parts[1]) continue
    slugs.push(decodeURIComponent(parts[1]))
  }

  return slugs
}

function isCouponUsable(coupon: Coupon, product: Product, now: Date): boolean {
  if (!coupon.is_active) return false
  if (coupon.platform !== 'all' && coupon.platform !== product.platform) return false
  if (Number(coupon.min_spend) > Number(product.price_current)) return false
  if (!coupon.expire_at) return true
  return new Date(coupon.expire_at).getTime() > now.getTime()
}

function checkProductUrl(caption: string, product: Product, baseUrl: string): LinkSafetyViolation | null {
  const urls = extractCaptionUrls(caption)
  if (urls.length === 0) {
    return {
      code: 'product_url_missing',
      severity: 'block',
      message: 'Caption must include a couponkum.com product URL',
    }
  }

  const productSlugs = extractProductSlugs(caption, baseUrl)
  if (productSlugs.length === 0) {
    return {
      code: 'product_url_invalid',
      severity: 'block',
      detail: urls.join(', '),
      message: 'Caption URL must point to couponkum.com/product/[id]',
    }
  }

  if (!product.is_active) {
    return {
      code: 'product_url_unavailable',
      severity: 'block',
      detail: product.id,
      message: 'Caption product URL would resolve to an inactive product',
    }
  }

  if (!productSlugs.includes(product.id)) {
    return {
      code: 'product_url_mismatch',
      severity: 'block',
      detail: productSlugs.join(', '),
      message: 'Caption product URL does not match the queued product',
    }
  }

  return null
}

function checkCoupons(caption: string, product: Product, coupons: Coupon[], now: Date): LinkSafetyViolation[] {
  const violations: LinkSafetyViolation[] = []
  const codes = extractCouponCodes(caption)
  if (codes.length === 0) return violations

  const usableCodes = new Set(
    coupons
      .filter(coupon => coupon.code && isCouponUsable(coupon, product, now))
      .map(coupon => coupon.code?.toUpperCase()),
  )

  for (const code of codes) {
    if (usableCodes.has(code)) continue
    violations.push({
      code: 'coupon_invalid',
      severity: 'block',
      detail: code,
      message: `Coupon code "${code}" is not active, expired, or not valid for this product`,
    })
  }

  return violations
}

function checkPrice(caption: string, product: Product, tolerancePct: number): LinkSafetyViolation | null {
  const amounts = extractBahtAmounts(caption)
  if (amounts.length === 0) {
    return {
      code: 'price_missing',
      severity: 'block',
      message: 'Caption must include a baht price',
    }
  }

  const currentPrice = Number(product.price_current)
  const tolerance = Math.abs(currentPrice * (tolerancePct / 100))
  const min = currentPrice - tolerance
  const max = currentPrice + tolerance

  if (amounts.some(amount => amount >= min && amount <= max)) return null

  return {
    code: 'price_mismatch',
    severity: 'block',
    detail: `caption=${amounts.join(', ')} current=${currentPrice} tolerance=${tolerancePct}%`,
    message: `Caption price must match current product price within ${tolerancePct}%`,
  }
}

export function runLinkSafetyCheck(
  caption: string,
  product: Product,
  coupons: Coupon[],
  options: LinkSafetyOptions = {},
): LinkSafetyResult {
  const baseUrl = options.baseUrl ?? process.env.NEXT_PUBLIC_BASE_URL ?? DEFAULT_BASE_URL
  const now = options.now ?? new Date()
  const tolerancePct = options.priceTolerancePct ?? DEFAULT_PRICE_TOLERANCE_PCT

  const violations: LinkSafetyViolation[] = []

  const productUrlViolation = checkProductUrl(caption, product, baseUrl)
  if (productUrlViolation) violations.push(productUrlViolation)

  violations.push(...checkCoupons(caption, product, coupons, now))

  const priceViolation = checkPrice(caption, product, tolerancePct)
  if (priceViolation) violations.push(priceViolation)

  return {
    passed: violations.length === 0,
    violations,
    checkedAt: now.toISOString(),
  }
}
