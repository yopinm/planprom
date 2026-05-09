// CTR / Funnel Analysis — TASK 5.6 / 5.6a
//
// Reads from:
//   v_funnel_metrics   — CVR + RPC grouped by sub_id context prefix + platform
//   v_funnel_path      — CVR + RPC grouped by source_page + platform
//   v_funnel_by_subid  — CVR + RPC grouped by full sub_id + platform (5.6a)
//
// Feeds: admin revenue dashboard + /admin/funnel dedicated page

import { createAdminClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FunnelRow {
  source:            string
  platform:          string
  click_count:       number
  conversion_count:  number
  cvr_pct:           number   // click-to-conversion rate (%)
  total_commission:  number
  revenue_per_click: number   // RPC in THB
  last_activity_at:  string | null
}

export interface PathRow {
  path:              string   // source_page: search | landing | comparison | unknown
  platform:          string
  click_count:       number
  conversion_count:  number
  cvr_pct:           number
  total_commission:  number
  revenue_per_click: number
  last_click_at:     string | null
}

export interface SubIdRow {
  sub_id:            string
  platform:          string
  source_page:       string | null
  click_count:       number
  conversion_count:  number
  cvr_pct:           number
  total_commission:  number
  revenue_per_click: number
  last_activity_at:  string | null
}

export interface FunnelReport {
  funnel:         FunnelRow[]
  paths:          PathRow[]
  total_clicks:   number
  total_convs:    number
  overall_cvr:    number
  generated_at:   string
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getFunnelMetrics(limit = 50): Promise<FunnelRow[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('v_funnel_metrics')
    .select('*')
    .limit(limit)

  if (error) throw error
  return (data ?? []) as FunnelRow[]
}

export async function getFunnelByPlatform(platform: string): Promise<FunnelRow[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('v_funnel_metrics')
    .select('*')
    .eq('platform', platform)

  if (error) throw error
  return (data ?? []) as FunnelRow[]
}

export async function getPathMetrics(): Promise<PathRow[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('v_funnel_path')
    .select('*')

  if (error) throw error
  return (data ?? []) as PathRow[]
}

export async function getFunnelBySubId(limit = 100): Promise<SubIdRow[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('v_funnel_by_subid')
    .select('*')
    .limit(limit)

  if (error) throw error
  return (data ?? []) as SubIdRow[]
}

export async function getFunnelReport(limit = 50): Promise<FunnelReport> {
  const [funnel, paths] = await Promise.all([
    getFunnelMetrics(limit),
    getPathMetrics(),
  ])

  const totalClicks = funnel.reduce((s, r) => s + Number(r.click_count), 0)
  const totalConvs  = funnel.reduce((s, r) => s + Number(r.conversion_count), 0)

  return {
    funnel,
    paths,
    total_clicks:  totalClicks,
    total_convs:   totalConvs,
    overall_cvr:   totalClicks > 0 ? Math.round((totalConvs / totalClicks) * 10000) / 100 : 0,
    generated_at:  new Date().toISOString(),
  }
}
