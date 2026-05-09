// src/lib/ugc.ts — TASK 3.11
// Server-side helpers for product tips (User-Generated Content).
// Tips are submitted anonymously and stay hidden until admin approval.

import { db } from '@/lib/db'
import type { Platform } from '@/types'

export interface ProductTip {
  id:         string
  tip_text:   string
  created_at: string
}

export interface ProductTipModerationItem extends ProductTip {
  product_id: string
  is_approved: boolean
  approved_at: string | null
  moderated_by: string | null
  product_name: string | null
  product_platform: Platform | null
}

interface ProductTipRow {
  id: string
  product_id: string
  tip_text: string
  is_approved: boolean
  approved_at: string | null
  moderated_by: string | null
  created_at: string
}

interface TipProductRow {
  id: string
  name: string
  platform: Platform
}

interface CountRow {
  count: number
}

/** Fetch approved tips for a product (up to 10, newest first). */
export async function getApprovedTips(productId: string): Promise<ProductTip[]> {
  try {
    return await db<ProductTip[]>`
      SELECT id, tip_text, created_at
      FROM product_tips
      WHERE product_id = ${productId}
        AND is_approved = true
      ORDER BY created_at DESC
      LIMIT 10
    `
  } catch {
    return []
  }
}

/** Insert a new tip (pending approval). Returns true on success. */
export async function submitTip(productId: string, tipText: string): Promise<boolean> {
  try {
    await db`
      INSERT INTO product_tips (product_id, tip_text)
      VALUES (${productId}, ${tipText})
    `

    return true
  } catch {
    return false
  }
}

/** Count pending tips waiting for admin moderation. */
export async function getPendingTipsCount(): Promise<number> {
  try {
    const rows = await db<CountRow[]>`
      SELECT COUNT(*)::int AS count
      FROM product_tips
      WHERE is_approved = false
    `

    return rows[0]?.count ?? 0
  } catch {
    return 0
  }
}

/** Fetch pending tips with lightweight product context for the admin queue. */
export async function getPendingTips(limit = 50): Promise<ProductTipModerationItem[]> {
  try {
    const tips = await db<ProductTipRow[]>`
      SELECT id, product_id, tip_text, is_approved, approved_at, moderated_by, created_at
      FROM product_tips
      WHERE is_approved = false
      ORDER BY created_at ASC
      LIMIT ${limit}
    `
    const productIds = [...new Set(tips.map(tip => tip.product_id))]
    const productsById = await getProductsById(productIds)

    return tips.map(tip => {
      const product = productsById.get(tip.product_id)
      return {
        ...tip,
        product_name:     product?.name ?? null,
        product_platform: product?.platform ?? null,
      }
    })
  } catch {
    return []
  }
}

/** Approve one pending tip so it can appear on product pages. */
export async function approveTip(tipId: string, adminId: string): Promise<boolean> {
  try {
    await db`
      UPDATE product_tips
      SET is_approved = true,
        approved_at = ${new Date().toISOString()},
        moderated_by = ${adminId}
      WHERE id = ${tipId}
        AND is_approved = false
    `

    return true
  } catch {
    return false
  }
}

/** Reject one pending tip by removing it before it can affect trust/ranking. */
export async function rejectTip(tipId: string): Promise<boolean> {
  try {
    await db`
      DELETE FROM product_tips
      WHERE id = ${tipId}
        AND is_approved = false
    `

    return true
  } catch {
    return false
  }
}

async function getProductsById(productIds: string[]): Promise<Map<string, TipProductRow>> {
  if (productIds.length === 0) return new Map()

  const data = await db<TipProductRow[]>`
    SELECT id, name, platform
    FROM products
    WHERE id = ANY(${productIds})
  `

  return new Map(
    data.map(product => [product.id, product]),
  )
}


