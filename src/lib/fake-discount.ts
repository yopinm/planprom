export const FAKE_DISCOUNT_ORIGINAL_PRICE_MULTIPLIER = 2.5

export interface FakeDiscountInput {
  price_current: number
  price_original: number | null
}

export interface FakeDiscountResult {
  suspicious: boolean
  reason: string | null
  ratio: number | null
}

export interface FakeDiscountProductPatch {
  suspicious_discount: boolean
  suspicious_discount_reason: string | null
  suspicious_discount_checked_at: string
}

export function detectFakeDiscount(input: FakeDiscountInput): FakeDiscountResult {
  const currentPrice = Number(input.price_current)
  const originalPrice = input.price_original === null ? null : Number(input.price_original)

  if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
    return { suspicious: false, reason: 'invalid_current_price', ratio: null }
  }

  if (originalPrice === null || !Number.isFinite(originalPrice) || originalPrice <= 0) {
    return { suspicious: false, reason: null, ratio: null }
  }

  const ratio = originalPrice / currentPrice
  const roundedRatio = Math.round(ratio * 100) / 100

  if (ratio > FAKE_DISCOUNT_ORIGINAL_PRICE_MULTIPLIER) {
    return {
      suspicious: true,
      reason: `original_price_gt_current_price_${FAKE_DISCOUNT_ORIGINAL_PRICE_MULTIPLIER}x`,
      ratio: roundedRatio,
    }
  }

  return { suspicious: false, reason: null, ratio: roundedRatio }
}

export function buildFakeDiscountProductPatch(
  input: FakeDiscountInput,
  checkedAt: Date = new Date(),
): FakeDiscountProductPatch {
  const result = detectFakeDiscount(input)

  return {
    suspicious_discount:            result.suspicious,
    suspicious_discount_reason:     result.reason,
    suspicious_discount_checked_at: checkedAt.toISOString(),
  }
}
