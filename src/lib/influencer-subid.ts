// POSTLIVE-33: B2B Sub-ID utilities for influencer/partner tracking (server-only)
// Pure client-safe utilities are in influencer-subid-utils.ts

import { db } from '@/lib/db'
export { sanitizeHandle, buildInfluencerSubId } from '@/lib/influencer-subid-utils'

export interface InfluencerSubIdRow {
  sub_id: string
  clicks: number
  conversions: number
  total_commission: number
  epc: number
  last_click_at: string | null
}

/** Fetch click + revenue stats for all sub_ids matching the inf_* pattern */
export async function getInfluencerSubIdStats(): Promise<InfluencerSubIdRow[]> {
  try {
    const clickRows = await db<{ sub_id: string; clicks: string; last_click_at: string | null }[]>`
      SELECT sub_id,
             COUNT(*) AS clicks,
             MAX(clicked_at)::text AS last_click_at
      FROM click_logs
      WHERE sub_id LIKE 'inf_%'
      GROUP BY sub_id
      ORDER BY clicks DESC
      LIMIT 100
    `

    if (clickRows.length === 0) return []

    const subIds = clickRows.map(r => r.sub_id)

    const revRows = await db<{ sub_id: string; conversions: string; total_commission: string }[]>`
      SELECT sub_id,
             COUNT(*) AS conversions,
             COALESCE(SUM(commission), 0)::text AS total_commission
      FROM revenue_tracking
      WHERE sub_id = ANY(${subIds})
        AND event_type = 'conversion'
        AND payout_status != 'reversed'
      GROUP BY sub_id
    `

    const revMap = new Map(revRows.map(r => [r.sub_id, r]))

    return clickRows.map(r => {
      const rev = revMap.get(r.sub_id)
      const clicks = Number(r.clicks)
      const conversions = Number(rev?.conversions ?? 0)
      const total_commission = Number(rev?.total_commission ?? 0)
      return {
        sub_id: r.sub_id,
        clicks,
        conversions,
        total_commission,
        epc: clicks > 0 ? total_commission / clicks : 0,
        last_click_at: r.last_click_at,
      }
    })
  } catch {
    return []
  }
}

