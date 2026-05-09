// bank-promotions.ts — Query helper for bank_promotions table
// TASK 1.6.1
//
// Used by:
//   TASK 1.6.2 — Combination Solver Tier 3 (bank saving)
//   TASK 1.19  — Credit Card Guide UI
//   TASK 2.5.3 — Post Score Engine (Seasonal)
//
// UX Rule: ไม่ให้ลูกค้ากรอกข้อมูลบัตร
//           ระบบรู้จาก public bank promotions เท่านั้น

import type { BankPromotion, Platform } from '@/types'
import { db } from '@/lib/db'

// ---------------------------------------------------------------------------
// Filter helper
// ---------------------------------------------------------------------------

/**
 * Filter bank promotions by platform + optional category + optional day of week.
 *
 * Matching rules:
 *   platform  — promo.platform === platform OR promo.platform === 'all'
 *   category  — promo.category === null (all cats) OR promo.category === category
 *   dayOfWeek — promo.day_of_week === null (all days) OR promo.day_of_week === dayOfWeek
 *   validity  — within valid_from … valid_until (when provided); always valid when null
 */
export function filterBankPromotions(
  promotions: BankPromotion[],
  platform: Platform,
  category?: string,
  dayOfWeek?: number,
  now: Date = new Date(),
): BankPromotion[] {
  const todayStr = now.toISOString().slice(0, 10)

  return promotions.filter(p => {
    if (!p.is_active) return false

    // Date validity
    if (p.valid_from && p.valid_from > todayStr) return false
    if (p.valid_until && p.valid_until < todayStr) return false

    // Platform match
    if (p.platform !== 'all' && p.platform !== platform) return false

    // Category match
    if (p.category !== null && p.category !== category) return false

    // Day of week match
    if (p.day_of_week !== null && p.day_of_week !== dayOfWeek) return false

    return true
  })
}

// ---------------------------------------------------------------------------
// Main query helper — mock vs Supabase
// ---------------------------------------------------------------------------

/**
 * Fetch bank promotions applicable to the given context.
 *
 * @param platform   - Target platform (shopee | lazada)
 * @param category   - Product category (optional)
 * @param dayOfWeek  - Day of week 0-6 (optional; defaults to today's day)
 * @param now        - Override for deterministic testing
 */
export async function getBankPromotions(
  platform: Platform,
  category?: string,
  dayOfWeek?: number,
  now: Date = new Date(),
): Promise<BankPromotion[]> {
  const dow = dayOfWeek ?? now.getDay()

  // Cache raw rows for 1 hr (TASK 2.11)
  const { getOrSet, CACHE_TTL, CACHE_PREFIX } = await import('@/lib/cache')
  const today = now.toISOString().slice(0, 10)
  const rawKey = `${CACHE_PREFIX.BANK_PROMOS}${platform}:${today}`

  // Cache raw rows for 1 hr — post-filter after cache hit
  const raw = await getOrSet<BankPromotion[]>(rawKey, CACHE_TTL.BANK_PROMOS, async () => {
    return db<BankPromotion[]>`
      SELECT
        id,
        bank_name,
        platform,
        category,
        day_of_week::int,
        discount_type,
        discount_value::float8,
        max_discount::float8,
        min_spend::float8,
        description,
        valid_from::text,
        valid_until::text,
        is_active,
        created_at
      FROM bank_promotions
      WHERE is_active = true
        AND (platform = ${platform} OR platform = 'all')
        AND (valid_from IS NULL OR valid_from <= ${today}::date)
        AND (valid_until IS NULL OR valid_until >= ${today}::date)
    `
  })

  // Post-filter category + day_of_week (Supabase OR logic is complex for nulls)
  return filterBankPromotions(
    raw,
    platform,
    category,
    dow,
    now,
  )
}
