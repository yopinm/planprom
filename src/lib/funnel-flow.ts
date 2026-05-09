// Affiliate Flow Optimization — TASK 5.6b
//
// Reads from v_funnel_flow:
//   traffic_channel (FB/SEO/LINE/…) × source_page × platform
//   → clicks, conversions, CVR, commission, RPC
//
// Feeds: /admin/funnel page flow section + /api/admin/revenue/flow endpoint

import { createAdminClient } from '@/lib/supabase/server'

export interface FlowRow {
  traffic_channel:   string   // Facebook | Instagram | LINE | SEO | On-site Search | …
  source_page:       string   // search | landing | comparison | unknown
  platform:          string   // shopee | lazada
  click_count:       number
  conversion_count:  number
  cvr_pct:           number
  total_commission:  number
  revenue_per_click: number
  last_activity_at:  string | null
}

export interface FlowReport {
  flows:          FlowRow[]
  top_channel:    string | null   // highest total_commission channel
  top_platform:   string | null
  total_clicks:   number
  total_convs:    number
  overall_cvr:    number
  generated_at:   string
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getFlowMetrics(limit = 100): Promise<FlowRow[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('v_funnel_flow')
    .select('*')
    .limit(limit)

  if (error) throw error
  return (data ?? []) as FlowRow[]
}

export async function getFlowByChannel(channel: string): Promise<FlowRow[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('v_funnel_flow')
    .select('*')
    .eq('traffic_channel', channel)

  if (error) throw error
  return (data ?? []) as FlowRow[]
}

export async function getFlowReport(limit = 100): Promise<FlowReport> {
  const flows = await getFlowMetrics(limit)

  const totalClicks = flows.reduce((s, r) => s + Number(r.click_count), 0)
  const totalConvs  = flows.reduce((s, r) => s + Number(r.conversion_count), 0)

  // Aggregate by channel for top_channel
  const channelComm = new Map<string, number>()
  const platformComm = new Map<string, number>()
  for (const r of flows) {
    channelComm.set(r.traffic_channel, (channelComm.get(r.traffic_channel) ?? 0) + Number(r.total_commission))
    platformComm.set(r.platform, (platformComm.get(r.platform) ?? 0) + Number(r.total_commission))
  }

  const topChannel  = [...channelComm.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
  const topPlatform = [...platformComm.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  return {
    flows,
    top_channel:   topChannel,
    top_platform:  topPlatform,
    total_clicks:  totalClicks,
    total_convs:   totalConvs,
    overall_cvr:   totalClicks > 0 ? Math.round((totalConvs / totalClicks) * 10000) / 100 : 0,
    generated_at:  new Date().toISOString(),
  }
}
