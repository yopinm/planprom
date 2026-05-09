import { db } from '@/lib/db'

import type { Coupon, CouponStackRule, Platform, Product } from '@/types'

async function safePublicQuery<T>(query: Promise<T[]>): Promise<T[]> {
  try {
    return await query
  } catch {
    return []
  }
}

export async function fetchActiveProducts(limit: number, platform?: Platform, category?: string): Promise<Product[]> {
  return safePublicQuery(db<Product[]>`
    SELECT *
    FROM products
    WHERE is_active = true
      AND (${platform ?? null}::text IS NULL OR platform = ${platform ?? null})
      AND (${category ?? null}::text IS NULL OR category = ${category ?? null})
    LIMIT ${limit}
  `)
}

export async function fetchActiveCoupons(): Promise<Coupon[]> {
  return safePublicQuery(db<Coupon[]>`
    SELECT *
    FROM coupons
    WHERE is_active = true
  `)
}

export async function fetchActiveStackRules(): Promise<CouponStackRule[]> {
  return safePublicQuery(db<CouponStackRule[]>`
    SELECT *
    FROM coupon_stack_rules
    WHERE is_active = true
  `)
}

export async function fetchProductsByBrand(brand: string, platform?: Platform, limit = 80): Promise<Product[]> {
  return safePublicQuery(db<Product[]>`
    SELECT *
    FROM products
    WHERE is_active = true
      AND (name ILIKE ${`%${brand}%`} OR shop_name ILIKE ${`%${brand}%`})
      AND (${platform ?? null}::text IS NULL OR platform = ${platform ?? null})
    LIMIT ${limit}
  `)
}
