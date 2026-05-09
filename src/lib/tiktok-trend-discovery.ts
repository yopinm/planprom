// TASK T.5 - TikTok Trend Discovery Bot
//
// Dormant mode: no generated trend rows until a real scraper/API is wired.

import { db } from '@/lib/db'
import type { TikTokTrend } from '@/types'

export interface TikTokTrendSyncResult {
  count: number
  error: string | null
}

/**
 * Returns discovered TikTok trends.
 * Real discovery requires a future scraper or TikTok Creative Center integration.
 */
export function discoverTikTokTrends(): Partial<TikTokTrend>[] {
  return []
}

/**
 * Syncs discovered trends to the database.
 * Uses ON CONFLICT to update existing keywords.
 */
export async function syncTikTokTrends(): Promise<TikTokTrendSyncResult> {
  const trends = discoverTikTokTrends()

  const rows = trends.map(t => ({
    keyword:  t.keyword ?? '',
    score:    t.score ?? 0,
    category: t.category ?? null,
    is_active: true,
  })).filter(row => row.keyword.length > 0)

  try {
    for (const row of rows) {
      await db`
        INSERT INTO tiktok_trends (keyword, score, category, is_active)
        VALUES (${row.keyword}, ${row.score}, ${row.category}, ${row.is_active})
        ON CONFLICT (keyword)
        DO UPDATE SET
          score = EXCLUDED.score,
          category = EXCLUDED.category,
          is_active = EXCLUDED.is_active
      `
    }

    return { count: rows.length, error: null }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Database error'
    return { count: 0, error: message }
  }
}

/**
 * Fetches latest active trends from the database.
 */
export async function getLatestTrends(limitOrClient: number | unknown = 10, maybeLimit?: number): Promise<TikTokTrend[]> {
  const limit = typeof limitOrClient === 'number' ? limitOrClient : maybeLimit ?? 10

  try {
    return await db<TikTokTrend[]>`
      SELECT *
      FROM tiktok_trends
      WHERE is_active = true
      ORDER BY score DESC
      LIMIT ${limit}
    `
  } catch {
    return []
  }
}
