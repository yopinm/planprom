export const PRICE_TIERS = {
  TIER_1: 20, // ชิ้นที่ 1 (= Omise PromptPay minimum)
  TIER_2: 10, // ชิ้นที่ 2-5
  TIER_3: 7,  // ชิ้นที่ 6+
} as const

function tierPriceForItem(position: number): number {
  if (position === 1) return PRICE_TIERS.TIER_1
  if (position <= 5)  return PRICE_TIERS.TIER_2
  return PRICE_TIERS.TIER_3
}

export interface CartTotals {
  total: number
  nextItemPrice: number
  savedVsFullPrice: number
  paidItemCount: number
}

export function calculateCartTotal(paidItemCount: number): CartTotals {
  let total = 0
  for (let i = 1; i <= paidItemCount; i++) {
    total += tierPriceForItem(i)
  }
  const nextItemPrice = tierPriceForItem(paidItemCount + 1)
  const savedVsFullPrice = paidItemCount * PRICE_TIERS.TIER_1 - total
  return { total, nextItemPrice, savedVsFullPrice, paidItemCount }
}

export function currentTierLabel(paidItemCount: number): string {
  if (paidItemCount <= 1) return `฿${PRICE_TIERS.TIER_1}/ชิ้น`
  if (paidItemCount <= 5) return `฿${PRICE_TIERS.TIER_2}/ชิ้น`
  return `฿${PRICE_TIERS.TIER_3}/ชิ้น`
}

export function itemsUntilNextTier(paidItemCount: number): number | null {
  if (paidItemCount < 1) return 1   // need 1 to enter tier 1
  if (paidItemCount < 5) return 5 - paidItemCount  // items until tier 2 maxes → tier 3
  if (paidItemCount < 6) return 6 - paidItemCount  // 1 more to unlock tier 3
  return null  // already in tier 3
}
