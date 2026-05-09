// POSTLIVE-27: Social Proof Aggregate Counter
// Estimates total user savings by summing (price_original - price_current) for all
// clicked products, then applying a campaign-context boost.
// Cached 1h via unstable_cache — safe to call inside force-dynamic pages.

import { unstable_cache } from 'next/cache'
import { db } from '@/lib/db'
import { getCampaignContext } from '@/lib/campaign-context'
import type { CampaignType } from '@/lib/campaign-context'

export interface SocialProofData {
  estimatedSavings: number
  clickCount: number
}

const BOOST: Record<CampaignType, number> = {
  double_date:  1.15,
  payday:       1.12,
  month_start:  1.05,
  peak_traffic: 1.08,
  normal:       1.00,
}

async function _fetch(): Promise<SocialProofData> {
  const [row] = await db<{ click_count: string; raw_savings: string }[]>`
    SELECT
      COUNT(cl.id)::text                                         AS click_count,
      COALESCE(SUM(GREATEST(
        COALESCE(p.price_original::numeric - p.price_current::numeric, 0),
        0
      )), 0)::text                                               AS raw_savings
    FROM click_logs cl
    LEFT JOIN products p ON p.id = cl.product_id AND p.is_active = true
    WHERE cl.clicked_at > NOW() - INTERVAL '90 days'
  `

  const clickCount = parseInt(row?.click_count ?? '0', 10)
  const rawSavings = parseFloat(row?.raw_savings ?? '0')

  const campaign = getCampaignContext()
  const boost    = BOOST[campaign.type] ?? 1.0

  const estimatedSavings = Math.round((rawSavings * boost) / 100) * 100

  return { estimatedSavings, clickCount }
}

export const getSocialProofData = unstable_cache(
  _fetch,
  ['social-proof'],
  { revalidate: 3600 },
)
