// Revenue Data Integration — TASK 4.11
//
// Query layer over v_revenue_attribution view.
// All JOINs happen in Postgres — this module only reads aggregated rows.
//
// Feeds: TASK 4.12 (Feedback Loop), TASK 4.13 (Revenue Scoring API),
//        TASK 4.14 (Revenue Dashboard)

import { createAdminClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Timezone helpers (ADMIN-TIMEZONE-1)
// ---------------------------------------------------------------------------

const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000; // UTC+7, no DST

/**
 * Returns the UTC Date corresponding to Bangkok midnight on the 1st of the
 * current Bangkok calendar month. Exported for unit testing.
 *
 * Why: Supabase stores timestamps as UTC. Without this adjustment the month
 * boundary shifts by 7 hours — revenue posted between UTC 00:00–07:00 on
 * the 1st would be excluded even though it falls within the Bangkok month.
 */
export function bangkokMonthStart(now: Date = new Date()): Date {
  // Read year/month in Bangkok local time by temporarily shifting to UTC+7
  const bangkokView = new Date(now.getTime() + BANGKOK_OFFSET_MS);
  // Bangkok midnight of the 1st = UTC midnight of the 1st − 7 h
  return new Date(
    Date.UTC(bangkokView.getUTCFullYear(), bangkokView.getUTCMonth(), 1) -
      BANGKOK_OFFSET_MS,
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RevenueRow {
  sub_id: string;
  click_count: number;
  conversion_count: number;
  total_commission: number;
  cancelled_commission: number;
  conversion_rate_pct: number;
  last_click_at: string | null;
}

export interface RevenueSummary {
  rows: RevenueRow[];
  total_clicks: number;
  total_conversions: number;
  total_commission: number;
  generated_at: string;
}

export interface MonthlyRevenueSummary {
  month_label: string;
  settled_commission: number;
  pending_commission: number;
  target: number;
  progress_pct: number;
  is_break_even: boolean;
  generated_at: string;
}

// POSTLIVE-03
export interface SubIdConversionRow {
  sub_id: string | null;
  platform: string;
  commission: number;
  payout_status: string;
  received_at: string;
  converted_at: string | null;
  click_at: string | null;
  latency_seconds: number | null;
}

export interface RevenueBySubIdReport {
  rows: SubIdConversionRow[];
  platform_latency: { platform: string; avg_latency_seconds: number | null; sample_count: number }[];
  generated_at: string;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * All sub_ids with their click + revenue stats, ordered by commission desc.
 * Returns all-time data from the view — date filtering is left to the caller.
 */
export async function getRevenueSummary(): Promise<RevenueSummary> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("v_revenue_attribution")
    .select("*")
    .order("total_commission", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as RevenueRow[];

  return {
    rows,
    total_clicks: rows.reduce((s, r) => s + Number(r.click_count), 0),
    total_conversions: rows.reduce((s, r) => s + Number(r.conversion_count), 0),
    total_commission: rows.reduce((s, r) => s + Number(r.total_commission), 0),
    generated_at: new Date().toISOString(),
  };
}

/**
 * Settled commission for the current calendar month (Bangkok time) vs a
 * monthly break-even target. Uses bangkokMonthStart() so the UTC query
 * boundary aligns with Thai midnight, not UTC midnight.
 */
export async function getMonthlyRevenue(
  target = 800,
): Promise<MonthlyRevenueSummary> {
  const supabase = createAdminClient();

  const nowUtc = new Date();
  const monthStart = bangkokMonthStart(nowUtc);

  const { data, error } = await supabase
    .from("revenue_tracking")
    .select("commission, payout_status")
    .eq("event_type", "conversion")
    .gte("received_at", monthStart.toISOString());

  if (error) throw error;

  const rows = (data ?? []) as Array<{
    commission: number;
    payout_status: string;
  }>;
  const settled = rows
    .filter((r) => r.payout_status === "settled")
    .reduce((s, r) => s + Number(r.commission), 0);
  const pending = rows
    .filter((r) => r.payout_status === "pending")
    .reduce((s, r) => s + Number(r.commission), 0);

  const month_label = nowUtc.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    timeZone: "Asia/Bangkok",
  });

  return {
    month_label,
    settled_commission: settled,
    pending_commission: pending,
    target,
    progress_pct: Math.min(100, target > 0 ? (settled / target) * 100 : 0),
    is_break_even: settled >= target,
    generated_at: new Date().toISOString(),
  };
}

/**
 * Top N sub_ids that have generated commission (non-zero).
 * Used by TASK 4.12 Feedback Loop to boost high-revenue contexts.
 */
export async function getTopRevenueSubIds(limit = 10): Promise<RevenueRow[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("v_revenue_attribution")
    .select("*")
    .gt("total_commission", 0)
    .order("total_commission", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as RevenueRow[];
}

/**
 * Fetch a single sub_id's stats — used by scoring / feedback logic.
 */
export async function getSubIdStats(subId: string): Promise<RevenueRow | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("v_revenue_attribution")
    .select("*")
    .eq("sub_id", subId)
    .maybeSingle();

  if (error) throw error;
  return data as RevenueRow | null;
}

// ---------------------------------------------------------------------------
// AFFNET-7: Network Revenue Trace helpers
// ---------------------------------------------------------------------------

// Maps revenue_tracking.platform (or click_logs.platform) to affiliate
// network label and the tracking param that was injected into the outgoing URL.
// Lazada direct (c.lazada.*) uses sub_id1 but revenue_tracking just stores
// 'lazada', so we report sub_id as the default for Lazada postbacks.
function networkParamInfo(platform: string): { network: string; outgoing_param: string } {
  switch (platform) {
    case 'involve_asia': return { network: 'Involve Asia', outgoing_param: 'sub1' };
    case 'accesstrade':  return { network: 'AccessTrade',  outgoing_param: 'aff_sub' };
    case 'lazada':       return { network: 'Lazada',       outgoing_param: 'sub_id' };
    case 'shopee':       return { network: 'Shopee',       outgoing_param: 'sub_id' };
    default:             return { network: platform,       outgoing_param: 'sub_id' };
  }
}

export interface TraceClickEntry {
  clicked_at: string;
  platform: string;
  network: string;
  outgoing_param: string;
}

export interface TraceConversionEntry {
  received_at: string;
  event_type: string;
  commission: number;
  payout_status: string;
  order_id: string | null;
  platform: string;
  network: string;
  outgoing_param: string;
}

export interface TraceNetworkSummary {
  network: string;
  outgoing_param: string;
  click_count: number;
  conversion_count: number;
}

export interface SubIdTraceResult {
  sub_id: string;
  click_found: boolean;
  clicks: TraceClickEntry[];
  postback_found: boolean;
  conversions: TraceConversionEntry[];
  network_summary: TraceNetworkSummary[];
  status: 'SUCCESS_LOOP' | 'WAITING_POSTBACK';
}

/**
 * Trace a specific sub_id's full lifecycle (clicks and conversions).
 * AFFNET-7: enriched with network label and outgoing tracking param per entry.
 */
export async function traceSubIdLifecycle(subId: string): Promise<SubIdTraceResult> {
  const supabase = createAdminClient();

  // 1. Clicks from click_logs (platform is 'shopee' | 'lazada' — destination platform)
  const { data: rawClicks, error: clickErr } = await supabase
    .from("click_logs")
    .select("clicked_at, platform")
    .eq("sub_id", subId)
    .order("clicked_at", { ascending: true });

  // 2. Conversions from revenue_tracking (platform includes 'accesstrade', 'involve_asia')
  const { data: rawConversions, error: convErr } = await supabase
    .from("revenue_tracking")
    .select("received_at, event_type, commission, payout_status, order_id, platform")
    .eq("sub_id", subId)
    .order("received_at", { ascending: true });

  if (clickErr) throw clickErr;
  if (convErr) throw convErr;

  const clicks: TraceClickEntry[] = (rawClicks ?? []).map(c => ({
    clicked_at: c.clicked_at,
    platform: c.platform,
    ...networkParamInfo(c.platform),
  }));

  const conversions: TraceConversionEntry[] = (rawConversions ?? []).map(c => ({
    received_at: c.received_at,
    event_type: c.event_type,
    commission: Number(c.commission ?? 0),
    payout_status: c.payout_status ?? 'pending',
    order_id: c.order_id ?? null,
    platform: c.platform,
    ...networkParamInfo(c.platform),
  }));

  // Build per-network summary (conversions carry accurate network from postback platform)
  const networkMap = new Map<string, TraceNetworkSummary>();
  for (const c of clicks) {
    const key = c.network;
    if (!networkMap.has(key)) networkMap.set(key, { network: c.network, outgoing_param: c.outgoing_param, click_count: 0, conversion_count: 0 });
    networkMap.get(key)!.click_count++;
  }
  for (const c of conversions) {
    const key = c.network;
    if (!networkMap.has(key)) networkMap.set(key, { network: c.network, outgoing_param: c.outgoing_param, click_count: 0, conversion_count: 0 });
    networkMap.get(key)!.conversion_count++;
  }

  return {
    sub_id: subId,
    click_found: clicks.length > 0,
    clicks,
    postback_found: conversions.length > 0,
    conversions,
    network_summary: [...networkMap.values()],
    status: conversions.length > 0 ? 'SUCCESS_LOOP' : 'WAITING_POSTBACK',
  };
}

// ---------------------------------------------------------------------------
// POSTLIVE-03: Revenue by Sub-ID Report (time-to-conversion per platform)
// ---------------------------------------------------------------------------

/**
 * Returns all conversion events from revenue_tracking joined (in TS) with
 * the earliest click from click_logs for the same sub_id.
 * Latency is computed as seconds from click_at to converted_at (or received_at).
 * Includes per-platform average latency summary for AI Revenue Weighting context.
 */
export async function getRevenueBySubIdReport(limit = 100): Promise<RevenueBySubIdReport> {
  const supabase = createAdminClient();

  const { data: convRows, error: convErr } = await supabase
    .from("revenue_tracking")
    .select("sub_id, platform, commission, payout_status, received_at, converted_at")
    .eq("event_type", "conversion")
    .order("received_at", { ascending: false })
    .limit(limit);

  if (convErr) throw convErr;

  const rows = convRows ?? [];

  // Collect unique non-null sub_ids so we can fetch latest click before conversion
  const subIds = [...new Set(rows.map(r => r.sub_id).filter(Boolean))] as string[];

  const clickMap: Record<string, string> = {};
  if (subIds.length > 0) {
    const { data: clickRows, error: clickErr } = await supabase
      .from("click_logs")
      .select("sub_id, clicked_at")
      .in("sub_id", subIds)
      .order("clicked_at", { ascending: false });

    if (clickErr) throw clickErr;

    // Keep the latest click per sub_id (last-click attribution for accurate latency)
    for (const row of (clickRows ?? [])) {
      if (row.sub_id && !clickMap[row.sub_id]) {
        clickMap[row.sub_id] = row.clicked_at;
      }
    }
  }

  const enriched: SubIdConversionRow[] = rows.map(r => {
    const click_at = r.sub_id ? (clickMap[r.sub_id] ?? null) : null;
    const conversionTs = r.converted_at ?? r.received_at;
    const latency_seconds =
      click_at && conversionTs
        ? Math.round((new Date(conversionTs).getTime() - new Date(click_at).getTime()) / 1000)
        : null;

    return {
      sub_id: r.sub_id ?? null,
      platform: r.platform,
      commission: Number(r.commission ?? 0),
      payout_status: r.payout_status ?? 'pending',
      received_at: r.received_at,
      converted_at: r.converted_at ?? null,
      click_at,
      latency_seconds,
    };
  });

  // Per-platform average latency (only rows where latency is computable)
  const platforms = ['shopee', 'lazada'];
  const platform_latency = platforms.map(platform => {
    const sample = enriched.filter(r => r.platform === platform && r.latency_seconds !== null);
    const avg =
      sample.length > 0
        ? Math.round(sample.reduce((s, r) => s + (r.latency_seconds ?? 0), 0) / sample.length)
        : null;
    return { platform, avg_latency_seconds: avg, sample_count: sample.length };
  });

  return { rows: enriched, platform_latency, generated_at: new Date().toISOString() };
}

// ---------------------------------------------------------------------------
// AFFNET-10: Cross-Network Payout Optimizer
// ---------------------------------------------------------------------------

const PAYOUT_THRESHOLDS: Record<string, number> = {
  involve_asia: 320,
  accesstrade:  500,
};

export interface PayoutNetworkStatus {
  network: string;
  platform_key: string;
  accumulated_thb: number;
  threshold_thb: number;
  progress_pct: number;
  is_near_threshold: boolean; // >= 80% of threshold
  can_withdraw: boolean;       // >= 100% of threshold
}

export interface PayoutProgress {
  networks: PayoutNetworkStatus[];
  generated_at: string;
}

/**
 * Sums settled commissions per affiliate network (involve_asia, accesstrade)
 * and compares against minimum payout thresholds.
 * Used by AFFNET-10 Payout Optimizer widget to recommend traffic allocation.
 */
export async function getPayoutProgress(): Promise<PayoutProgress> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("revenue_tracking")
    .select("platform, commission, payout_status")
    .in("platform", ["involve_asia", "accesstrade"])
    .eq("event_type", "conversion")
    .neq("payout_status", "reversed");

  if (error) throw error;

  const rows = (data ?? []) as Array<{ platform: string; commission: number; payout_status: string }>;

  // Sum settled (confirmed) + pending (likely to settle) per platform
  const accumulated: Record<string, number> = { involve_asia: 0, accesstrade: 0 };
  for (const r of rows) {
    accumulated[r.platform] = (accumulated[r.platform] ?? 0) + Number(r.commission ?? 0);
  }

  const networks: PayoutNetworkStatus[] = Object.entries(PAYOUT_THRESHOLDS).map(([key, threshold]) => {
    const acc = accumulated[key] ?? 0;
    const progress_pct = threshold > 0 ? Math.min(100, (acc / threshold) * 100) : 0;
    return {
      network: key === 'involve_asia' ? 'Involve Asia' : 'AccessTrade',
      platform_key: key,
      accumulated_thb: acc,
      threshold_thb: threshold,
      progress_pct,
      is_near_threshold: progress_pct >= 80 && progress_pct < 100,
      can_withdraw: progress_pct >= 100,
    };
  });

  return { networks, generated_at: new Date().toISOString() };
}
