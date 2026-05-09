import type { Coupon, Product } from '@/types'
import { getCouponFreshnessTimestamp, getProductFreshnessTimestamp } from '@/lib/freshness'

export type FacebookDealFreshnessViolationCode =
  | 'price_data_unknown'
  | 'price_data_stale'
  | 'coupon_data_unknown'
  | 'coupon_data_stale'
  | 'stock_data_unknown'
  | 'stock_data_stale'
  | 'link_health_unknown'
  | 'link_health_stale'
  | 'link_health_failed'

export interface FacebookDealFreshnessViolation {
  code: FacebookDealFreshnessViolationCode
  severity: 'block'
  detail?: string
  message: string
}

export interface ProductLinkHealthCheck {
  ok: boolean
  status: number
  checked_at: string | null
}

export interface StockSignalFreshness {
  badge: string | null
  last_calculated_at: string | null
}

export interface FacebookDealFreshnessInput {
  product: Product
  coupons: Coupon[]
  linkHealth: ProductLinkHealthCheck | null
  stockSignal?: StockSignalFreshness | null
  caption?: string
}

export interface FacebookDealFreshnessOptions {
  now?: Date
  maxProductAgeHours?: number
  maxCouponAgeHours?: number
  maxStockAgeHours?: number
  maxLinkHealthAgeHours?: number
}

export interface FacebookDealFreshnessResult {
  passed: boolean
  violations: FacebookDealFreshnessViolation[]
  checkedAt: string
}

const DEFAULT_MAX_PRODUCT_AGE_HOURS = 24
const DEFAULT_MAX_COUPON_AGE_HOURS = 24
const DEFAULT_MAX_STOCK_AGE_HOURS = 24
const DEFAULT_MAX_LINK_HEALTH_AGE_HOURS = 24
const SCARCITY_PATTERN = /(เหลือน้อย|ใกล้หมด|หมดไว|รีบก่อนหมด|ของมีจำกัด|rare|low\s*stock)/iu

function positiveNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return parsed
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function ageHours(value: string | null | undefined, now: Date): number | null {
  const parsed = parseDate(value)
  if (!parsed) return null
  return Math.max(0, (now.getTime() - parsed.getTime()) / 3_600_000)
}

function limitHours(
  explicit: number | undefined,
  envName: 'FB_MAX_DEAL_DATA_AGE_HOURS' | 'FB_MAX_LINK_HEALTH_AGE_HOURS',
  fallback: number,
): number {
  if (explicit !== undefined && Number.isFinite(explicit) && explicit > 0) return explicit
  return positiveNumber(process.env[envName], fallback)
}

function staleViolation(
  code: FacebookDealFreshnessViolationCode,
  checkedAt: string | null | undefined,
  age: number,
  limit: number,
  message: string,
): FacebookDealFreshnessViolation {
  return {
    code,
    severity: 'block',
    detail: `checked_at=${checkedAt ?? 'missing'} age_hours=${Math.round(age * 100) / 100} max_hours=${limit}`,
    message,
  }
}

function requiresStockFreshness(input: FacebookDealFreshnessInput): boolean {
  if (input.stockSignal?.badge === 'low_stock' || input.stockSignal?.badge === 'rare') return true
  return SCARCITY_PATTERN.test(input.caption ?? '')
}

function checkTimestamp(
  value: string | null | undefined,
  now: Date,
  maxAgeHours: number,
  unknownCode: FacebookDealFreshnessViolationCode,
  staleCode: FacebookDealFreshnessViolationCode,
  label: string,
  fieldName: string,
): FacebookDealFreshnessViolation | null {
  const age = ageHours(value, now)
  if (age === null) {
    return {
      code: unknownCode,
      severity: 'block',
      detail: `field=${fieldName} checked_at=${value ?? 'missing'}`,
      message: `${label} verified timestamp is missing.`,
    }
  }
  if (age > maxAgeHours) {
    return staleViolation(
      staleCode,
      value,
      age,
      maxAgeHours,
      `${label} data is older than the approved ${maxAgeHours}-hour freshness threshold.`,
    )
  }
  return null
}

export function checkFacebookDealFreshness(
  input: FacebookDealFreshnessInput,
  options: FacebookDealFreshnessOptions = {},
): FacebookDealFreshnessResult {
  const now = options.now ?? new Date()
  const checkedAt = now.toISOString()
  const maxProductAgeHours = limitHours(
    options.maxProductAgeHours,
    'FB_MAX_DEAL_DATA_AGE_HOURS',
    DEFAULT_MAX_PRODUCT_AGE_HOURS,
  )
  const maxCouponAgeHours = options.maxCouponAgeHours ?? positiveNumber(
    process.env.FB_MAX_COUPON_DATA_AGE_HOURS,
    DEFAULT_MAX_COUPON_AGE_HOURS,
  )
  const maxStockAgeHours = options.maxStockAgeHours ?? DEFAULT_MAX_STOCK_AGE_HOURS
  const maxLinkHealthAgeHours = limitHours(
    options.maxLinkHealthAgeHours,
    'FB_MAX_LINK_HEALTH_AGE_HOURS',
    DEFAULT_MAX_LINK_HEALTH_AGE_HOURS,
  )

  const violations: FacebookDealFreshnessViolation[] = []
  const priceViolation = checkTimestamp(
    getProductFreshnessTimestamp(input.product),
    now,
    maxProductAgeHours,
    'price_data_unknown',
    'price_data_stale',
    'Product price',
    'products.price_checked_at',
  )
  if (priceViolation) violations.push(priceViolation)

  for (const coupon of input.coupons) {
    const couponViolation = checkTimestamp(
      getCouponFreshnessTimestamp(coupon),
      now,
      maxCouponAgeHours,
      'coupon_data_unknown',
      'coupon_data_stale',
      `Coupon ${coupon.code ?? coupon.id}`,
      'coupons.source_checked_at',
    )
    if (couponViolation) violations.push(couponViolation)
  }

  if (requiresStockFreshness(input)) {
    const stockViolation = checkTimestamp(
      input.stockSignal?.last_calculated_at,
      now,
      maxStockAgeHours,
      'stock_data_unknown',
      'stock_data_stale',
      'Stock/scarcity',
      'rare_item_scores.last_calculated_at',
    )
    if (stockViolation) violations.push(stockViolation)
  }

  if (!input.linkHealth) {
    violations.push({
      code: 'link_health_unknown',
      severity: 'block',
      message: 'Product link health has not been checked yet.',
    })
  } else {
    if (!input.linkHealth.ok) {
      violations.push({
        code: 'link_health_failed',
        severity: 'block',
        detail: `status=${input.linkHealth.status}`,
        message: 'Product outbound link health check is failing.',
      })
    }

    const linkViolation = checkTimestamp(
      input.linkHealth.checked_at,
      now,
      maxLinkHealthAgeHours,
      'link_health_unknown',
      'link_health_stale',
      'Product link health',
      'product_link_checks.checked_at',
    )
    if (linkViolation) violations.push(linkViolation)
  }

  return {
    passed: violations.length === 0,
    violations,
    checkedAt,
  }
}
