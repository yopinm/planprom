// Sub ID Revenue Attribution — TASK 5.4
//
// Last-click attribution: each conversion in revenue_tracking is joined to
// the most recent click in click_logs with the same sub_id + platform.
//
// Provides full context per revenue event:
//   sub_id · source_page · query · product_id · commission · timestamps
//
// Feeds: TASK 5.5 (Revenue Dashboard), TASK 5.6 (CTR / Funnel Analysis)

import { createAdminClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AttributionRow {
  revenue_id:   string
  platform:     string
  sub_id:       string | null
  order_id:     string | null
  commission:   number
  received_at:  string
  // Last-click context (null if no matching click found)
  click_id:     string | null
  product_id:   string | null
  source_page:  string | null
  query:        string | null
  session_id:   string | null
  clicked_at:   string | null
}

export interface AttributionSummary {
  rows:              AttributionRow[]
  total_commission:  number
  attributed_count:  number   // rows with a matching click
  unattributed_count: number  // rows with no matching click
  generated_at:      string
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Full attribution detail — most recent conversions first.
 * @param limit max rows (default 100)
 */
export async function getAttributionDetail(limit = 100): Promise<AttributionSummary> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('v_revenue_attribution_detail')
    .select('*')
    .order('received_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  const rows = (data ?? []) as AttributionRow[]
  const attributed   = rows.filter(r => r.click_id !== null)
  const unattributed = rows.filter(r => r.click_id === null)

  return {
    rows,
    total_commission:   rows.reduce((s, r) => s + Number(r.commission), 0),
    attributed_count:   attributed.length,
    unattributed_count: unattributed.length,
    generated_at:       new Date().toISOString(),
  }
}

/**
 * Attribution rows for a single product — all conversions traceable to it.
 */
export async function getAttributionByProduct(productId: string): Promise<AttributionRow[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('v_revenue_attribution_detail')
    .select('*')
    .eq('product_id', productId)
    .order('received_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as AttributionRow[]
}

/**
 * Attribution rows for a single sub_id context.
 */
export async function getAttributionBySubId(subId: string): Promise<AttributionRow[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('v_revenue_attribution_detail')
    .select('*')
    .eq('sub_id', subId)
    .order('received_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as AttributionRow[]
}
