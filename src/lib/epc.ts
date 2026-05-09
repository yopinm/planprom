// REV-EPC-1: Earnings Per Click (EPC) by platform
// EPC = total_commission / click_count
// Platform is extracted from sub_id prefix (shopee_*, lazada_*, tiktok_*, manual_*)
// Falls back to 'other' for unrecognized prefixes.
//
// AFFNET-8: Network-aware EPC — groups revenue_tracking by platform (= affiliate network)
// and click_logs by destination platform for best available EPC estimate.

import { createAdminClient } from '@/lib/supabase/server'

export type EpcPlatform = 'shopee' | 'lazada' | 'tiktok' | 'manual' | 'other'

export interface EpcRow {
  platform:       EpcPlatform
  click_count:    number
  conversion_count: number
  total_commission: number
  epc:            number  // commission / clicks (0 if no clicks)
  conversion_rate: number // conversions / clicks * 100
}

export interface EpcSummary {
  rows:        EpcRow[]
  best:        EpcPlatform | null
  generated_at: string
}

export function extractPlatform(subId: string): EpcPlatform {
  const prefix = subId.split('_')[0].toLowerCase()
  if (prefix === 'shopee') return 'shopee'
  if (prefix === 'lazada') return 'lazada'
  if (prefix === 'tiktok') return 'tiktok'
  if (prefix === 'manual') return 'manual'
  return 'other'
}

const PLATFORM_ORDER: EpcPlatform[] = ['shopee', 'lazada', 'tiktok', 'manual', 'other']

/**
 * Aggregate EPC stats per platform from v_revenue_attribution.
 * Falls back to empty rows on any Supabase error so the admin page never crashes.
 */
export async function getEpcByPlatform(): Promise<EpcSummary> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('v_revenue_attribution')
      .select('sub_id, click_count, conversion_count, total_commission')

    if (error) throw error

    const acc: Record<EpcPlatform, EpcRow> = {} as Record<EpcPlatform, EpcRow>
    for (const platform of PLATFORM_ORDER) {
      acc[platform] = { platform, click_count: 0, conversion_count: 0, total_commission: 0, epc: 0, conversion_rate: 0 }
    }

    for (const row of (data ?? []) as Array<{ sub_id: string; click_count: number; conversion_count: number; total_commission: number }>) {
      const platform = extractPlatform(row.sub_id)
      acc[platform].click_count       += Number(row.click_count)
      acc[platform].conversion_count  += Number(row.conversion_count)
      acc[platform].total_commission  += Number(row.total_commission)
    }

    // Compute EPC and CVR
    for (const platform of PLATFORM_ORDER) {
      const r = acc[platform]
      r.epc             = r.click_count > 0 ? r.total_commission / r.click_count : 0
      r.conversion_rate = r.click_count > 0 ? (r.conversion_count / r.click_count) * 100 : 0
    }

    const rows = PLATFORM_ORDER.map(p => acc[p]).filter(r => r.click_count > 0 || r.total_commission > 0)

    const best = rows.length > 0
      ? rows.reduce((a, b) => b.epc > a.epc ? b : a).platform
      : null

    return { rows, best, generated_at: new Date().toISOString() }
  } catch {
    return { rows: [], best: null, generated_at: new Date().toISOString() }
  }
}

// ---------------------------------------------------------------------------
// AFFNET-8: Network-Aware EPC Dashboard
// ---------------------------------------------------------------------------

// Human-readable labels for revenue_tracking.platform values
const NETWORK_LABELS: Record<string, string> = {
  shopee:        'Shopee',
  lazada:        'Lazada',
  involve_asia:  'Involve Asia',
  accesstrade:   'AccessTrade',
}

export interface NetworkEpcRow {
  platform_key:     string
  network:          string
  conversion_count: number
  total_commission: number
  avg_commission:   number  // total_commission / conversion_count
  click_count:      number  // from click_logs (destination platform only for shopee/lazada)
  epc:              number  // total_commission / click_count (0 if no clicks)
  cvr:              number  // conversion_count / click_count * 100 (0 if no clicks)
}

export interface NetworkEpcReport {
  rows:          NetworkEpcRow[]
  best_by_epc:   string | null
  best_by_commission: string | null
  generated_at:  string
}

/**
 * Network-aware EPC report grouping revenue by affiliate network.
 * Revenue data is exact (revenue_tracking.platform = actual network).
 * Click data for Involve Asia / AccessTrade is an estimate based on
 * click_logs destination platform (IA wraps Shopee/Lazada — clicks log as shopee/lazada).
 * EPC is most accurate for Shopee/Lazada direct.
 */
export async function getNetworkEpcReport(): Promise<NetworkEpcReport> {
  try {
    const supabase = createAdminClient()

    // 1. Revenue per network from revenue_tracking
    const { data: revData, error: revErr } = await supabase
      .from('revenue_tracking')
      .select('platform, commission')
      .eq('event_type', 'conversion')
      .neq('payout_status', 'reversed')

    if (revErr) throw revErr

    const revAcc: Record<string, { conversion_count: number; total_commission: number }> = {}
    for (const r of (revData ?? []) as Array<{ platform: string; commission: number }>) {
      if (!revAcc[r.platform]) revAcc[r.platform] = { conversion_count: 0, total_commission: 0 }
      revAcc[r.platform].conversion_count++
      revAcc[r.platform].total_commission += Number(r.commission ?? 0)
    }

    // 2. Clicks per destination platform from click_logs
    const { data: clickData, error: clickErr } = await supabase
      .from('click_logs')
      .select('platform')

    if (clickErr) throw clickErr

    const clickAcc: Record<string, number> = {}
    for (const r of (clickData ?? []) as Array<{ platform: string }>) {
      clickAcc[r.platform] = (clickAcc[r.platform] ?? 0) + 1
    }

    // 3. Merge into rows (include all networks that have any revenue or clicks)
    const allKeys = new Set([...Object.keys(revAcc), ...Object.keys(clickAcc)])
    const rows: NetworkEpcRow[] = []

    for (const key of allKeys) {
      const rev = revAcc[key] ?? { conversion_count: 0, total_commission: 0 }
      const clicks = clickAcc[key] ?? 0
      const epc = clicks > 0 ? rev.total_commission / clicks : 0
      const cvr = clicks > 0 ? (rev.conversion_count / clicks) * 100 : 0
      rows.push({
        platform_key:     key,
        network:          NETWORK_LABELS[key] ?? key,
        conversion_count: rev.conversion_count,
        total_commission: rev.total_commission,
        avg_commission:   rev.conversion_count > 0 ? rev.total_commission / rev.conversion_count : 0,
        click_count:      clicks,
        epc,
        cvr,
      })
    }

    rows.sort((a, b) => b.total_commission - a.total_commission)

    const withClicks = rows.filter(r => r.click_count > 0)
    const best_by_epc = withClicks.length > 0
      ? withClicks.reduce((a, b) => b.epc > a.epc ? b : a).network
      : null
    const best_by_commission = rows.length > 0
      ? rows.reduce((a, b) => b.total_commission > a.total_commission ? b : a).network
      : null

    return { rows, best_by_epc, best_by_commission, generated_at: new Date().toISOString() }
  } catch {
    return { rows: [], best_by_epc: null, best_by_commission: null, generated_at: new Date().toISOString() }
  }
}
