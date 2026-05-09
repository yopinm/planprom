// Commission Rate Map — POSTLIVE-07
//
// Static reference table for Shopee/Lazada affiliate commission rates by category.
// Source: Claude strategic analysis + roadmap (Roadmap_Couponkum_AfterGoLive.md §1)
// Rates are approximate; update when official program docs change.

export type CommissionTier = 'high' | 'medium' | 'low'

export interface CommissionRate {
  category:     string
  category_th:  string
  shopee_min:   number
  shopee_max:   number
  lazada_min:   number
  lazada_max:   number
  shopee_mid:   number  // (min+max)/2 — used for sorting/display
  lazada_mid:   number
  best_mid:     number  // max of both mids
  tier:         CommissionTier
  boost:        boolean  // true = recommended to push content toward this category
  note:         string
}

export const COMMISSION_RATES: CommissionRate[] = [
  {
    category:    'Beauty',
    category_th: 'ความงาม',
    shopee_min:  4, shopee_max:  6, shopee_mid: 5,
    lazada_min:  5, lazada_max:  7, lazada_mid: 6,
    best_mid:    6,
    tier:        'high',
    boost:       true,
    note:        'สูงสุด — Lazada ให้ rate ดีกว่า Shopee',
  },
  {
    category:    'Fashion',
    category_th: 'แฟชั่น',
    shopee_min:  4, shopee_max:  6, shopee_mid: 5,
    lazada_min:  5, lazada_max:  7, lazada_mid: 6,
    best_mid:    6,
    tier:        'high',
    boost:       true,
    note:        'สูง — ปริมาณ search มากด้วย',
  },
  {
    category:    'Sports',
    category_th: 'กีฬา',
    shopee_min:  3, shopee_max:  5, shopee_mid: 4,
    lazada_min:  3, lazada_max:  5, lazada_mid: 4,
    best_mid:    4,
    tier:        'medium',
    boost:       false,
    note:        'ปานกลาง — seasonal (ต้นปี/ช่วง sale)',
  },
  {
    category:    'Home',
    category_th: 'บ้านและสวน',
    shopee_min:  3, shopee_max:  5, shopee_mid: 4,
    lazada_min:  3, lazada_max:  5, lazada_mid: 4,
    best_mid:    4,
    tier:        'medium',
    boost:       false,
    note:        'ปานกลาง — order value สูงชดเชย rate ต่ำ',
  },
  {
    category:    'Electronics',
    category_th: 'อิเล็กทรอนิกส์',
    shopee_min:  2, shopee_max:  3, shopee_mid: 2.5,
    lazada_min:  2, lazada_max:  3, lazada_mid: 2.5,
    best_mid:    2.5,
    tier:        'low',
    boost:       false,
    note:        'ต่ำ — แต่ AOV สูง search volume เยอะ',
  },
  {
    category:    'Mobile',
    category_th: 'มือถือ',
    shopee_min:  1, shopee_max:  2, shopee_mid: 1.5,
    lazada_min:  1, lazada_max:  2, lazada_mid: 1.5,
    best_mid:    1.5,
    tier:        'low',
    boost:       false,
    note:        'ต่ำสุด — volume สูง แต่ commission น้อย',
  },
  {
    category:    'Books',
    category_th: 'หนังสือ',
    shopee_min:  1, shopee_max:  2, shopee_mid: 1.5,
    lazada_min:  1, lazada_max:  2, lazada_mid: 1.5,
    best_mid:    1.5,
    tier:        'low',
    boost:       false,
    note:        'ต่ำ — AOV ต่ำด้วย',
  },
]

// Sorted by best_mid desc — used by admin display
export const COMMISSION_RATES_SORTED = [...COMMISSION_RATES].sort(
  (a, b) => b.best_mid - a.best_mid,
)

export function getTierLabel(tier: CommissionTier): string {
  return tier === 'high' ? 'สูง' : tier === 'medium' ? 'กลาง' : 'ต่ำ'
}

export function getTierColor(tier: CommissionTier): string {
  return tier === 'high'
    ? 'bg-green-100 text-green-800'
    : tier === 'medium'
    ? 'bg-yellow-100 text-yellow-700'
    : 'bg-neutral-100 text-neutral-500'
}
