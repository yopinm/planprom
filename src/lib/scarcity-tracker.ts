// src/lib/scarcity-tracker.ts — TASK 3.12
// Tracks product page views and converts them into a scarcity signal
// fed into the Rare Item Engine's trend_score.

import { db } from '@/lib/db'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ScarcityLevel = 'hot' | 'warm' | null

export interface ScarcitySignal {
  view_count_1h:  number
  view_count_24h: number
  level:          ScarcityLevel
}

interface CountRow {
  count: number
}

// ---------------------------------------------------------------------------
// Thresholds
// ---------------------------------------------------------------------------

const THRESHOLDS = {
  HOT_1H:  20,   // 20+ views in 1 hour → 'hot'
  WARM_1H:  8,   // 8+ views in 1 hour → 'warm'
} as const

// ---------------------------------------------------------------------------
// Write — called from API route (anon INSERT via RLS)
// ---------------------------------------------------------------------------

/** Record a product view event. Silently ignores errors. */
export async function trackProductView(productId: string): Promise<void> {
  try {
    await db`
      INSERT INTO product_views (product_id)
      VALUES (${productId})
    `
  } catch {
    // Non-critical — silently ignore
  }
}

// ---------------------------------------------------------------------------
// Read — called from Server Components (service role to bypass RLS)
// ---------------------------------------------------------------------------

/** Get scarcity signal for a product based on recent view counts. */
export async function getScarcitySignal(productId: string): Promise<ScarcitySignal> {
  try {
    const now = new Date()
    const t1h  = new Date(now.getTime() - 60 * 60 * 1000).toISOString()
    const t24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()

    const [r1hRows, r24hRows] = await Promise.all([
      db<CountRow[]>`
        SELECT count(*)::int AS count
        FROM product_views
        WHERE product_id = ${productId}
          AND viewed_at >= ${t1h}
      `,
      db<CountRow[]>`
        SELECT count(*)::int AS count
        FROM product_views
        WHERE product_id = ${productId}
          AND viewed_at >= ${t24h}
      `,
    ])

    const count1h  = r1hRows[0]?.count  ?? 0
    const count24h = r24hRows[0]?.count ?? 0

    const level: ScarcityLevel =
      count1h >= THRESHOLDS.HOT_1H  ? 'hot'  :
      count1h >= THRESHOLDS.WARM_1H ? 'warm' :
      null

    return { view_count_1h: count1h, view_count_24h: count24h, level }
  } catch {
    return { view_count_1h: 0, view_count_24h: 0, level: null }
  }
}

/** Convert view count to a trend score boost (0–25) for the Rare Item Engine. */
export function viewCountToTrendBoost(viewCount1h: number): number {
  // 0 views → 0 boost, 50+ views → 25 boost (linear, capped)
  return Math.min(25, Math.round(viewCount1h / 50 * 25))
}
