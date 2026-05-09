// GET /api/admin/export?range=30d
// Admin-only Markdown snapshot — 5 dimensions for Claude analysis
// range: 7d | 30d | 90d (default 30d)

import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { computeAiBaselineGateStatus } from '@/lib/ai-baseline-gate'

// ---------------------------------------------------------------------------
// Range helpers
// ---------------------------------------------------------------------------

const VALID_RANGES = ['7d', '30d', '90d'] as const
type Range = (typeof VALID_RANGES)[number]

function sinceDate(range: Range): Date {
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
}

function monthStart(): Date {
  const nowBkk = new Date(Date.now() + 7 * 60 * 60 * 1000)
  return new Date(nowBkk.toISOString().slice(0, 7) + '-01T00:00:00+07:00')
}

function nowBangkok(): string {
  return new Date().toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function thb(n: number): string {
  return '฿' + n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function pct(num: number, den: number): string {
  return den > 0 ? ((num / den) * 100).toFixed(1) + '%' : '—'
}

function mdTable(headers: string[], rows: string[][]): string {
  if (!rows.length) return `| ${headers.join(' | ')} |\n| ${headers.map(() => '---').join(' | ')} |\n| — |`
  const sep = headers.map(() => '---').join(' | ')
  const body = rows.map(r => `| ${r.join(' | ')} |`).join('\n')
  return `| ${headers.join(' | ')} |\n| ${sep} |\n${body}`
}

function toNum(v: string | number | null | undefined): number {
  if (v == null) return 0
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

// ---------------------------------------------------------------------------
// D1 — Revenue
// ---------------------------------------------------------------------------

async function fetchRevenue(since: Date, ms: Date) {
  try {
    const [clicksRes, clicksByPlatRes, topSubRes, commRes, monthCommRes] = await Promise.all([
      db<{ total: string }[]>`
        SELECT COUNT(*) AS total FROM click_logs WHERE clicked_at >= ${since}
      `,
      db<{ platform: string; cnt: string }[]>`
        SELECT platform, COUNT(*) AS cnt
        FROM click_logs WHERE clicked_at >= ${since}
        GROUP BY platform ORDER BY COUNT(*) DESC
      `,
      db<{ sub_id: string; clicks: string }[]>`
        SELECT sub_id, COUNT(*) AS clicks
        FROM click_logs
        WHERE clicked_at >= ${since} AND sub_id IS NOT NULL
        GROUP BY sub_id ORDER BY COUNT(*) DESC LIMIT 10
      `,
      db<{ platform: string; payout_status: string; total: string; cnt: string }[]>`
        SELECT platform, payout_status,
               COALESCE(SUM(commission), 0) AS total,
               COUNT(*) AS cnt
        FROM revenue_tracking
        WHERE received_at >= ${since}
        GROUP BY platform, payout_status
        ORDER BY platform, payout_status
      `,
      db<{ settled: string }[]>`
        SELECT COALESCE(SUM(commission), 0) AS settled
        FROM revenue_tracking
        WHERE payout_status = 'settled' AND received_at >= ${ms}
      `,
    ])

    const totalClicks = toNum(clicksRes[0]?.total)
    const thisMonthSettled = toNum(monthCommRes[0]?.settled)
    const breakEvenTarget = 800
    const breakEvenPct = ((thisMonthSettled / breakEvenTarget) * 100).toFixed(1)

    return { totalClicks, clicksByPlat: clicksByPlatRes, topSubs: topSubRes, commRows: commRes, thisMonthSettled, breakEvenPct, breakEvenTarget }
  } catch {
    return { totalClicks: 0, clicksByPlat: [], topSubs: [], commRows: [], thisMonthSettled: 0, breakEvenPct: '0.0', breakEvenTarget: 800 }
  }
}

// ---------------------------------------------------------------------------
// D2 — Search Behavior
// ---------------------------------------------------------------------------

async function fetchSearch(since: Date) {
  try {
    const [statsRes, topQueryRes, peakHourRes] = await Promise.all([
      db<{ total: string; unique_q: string; zero_results: string; avg_ms: string; bot_count: string }[]>`
        SELECT
          COUNT(*) AS total,
          COUNT(DISTINCT query) AS unique_q,
          COUNT(*) FILTER (WHERE results_count = 0) AS zero_results,
          ROUND(AVG(response_time_ms)) AS avg_ms,
          COUNT(*) FILTER (WHERE flagged_bot = true) AS bot_count
        FROM search_logs
        WHERE searched_at >= ${since}
      `,
      db<{ query: string; cnt: string }[]>`
        SELECT query, COUNT(*) AS cnt
        FROM search_logs
        WHERE searched_at >= ${since} AND flagged_bot = false
        GROUP BY query ORDER BY COUNT(*) DESC LIMIT 20
      `,
      db<{ hour: string; cnt: string }[]>`
        SELECT
          EXTRACT(HOUR FROM searched_at AT TIME ZONE 'Asia/Bangkok') AS hour,
          COUNT(*) AS cnt
        FROM search_logs
        WHERE searched_at >= ${since} AND flagged_bot = false
        GROUP BY EXTRACT(HOUR FROM searched_at AT TIME ZONE 'Asia/Bangkok')
        ORDER BY COUNT(*) DESC LIMIT 5
      `,
    ])

    const s = statsRes[0]
    return {
      total: toNum(s?.total),
      uniqueQ: toNum(s?.unique_q),
      zeroResults: toNum(s?.zero_results),
      avgMs: toNum(s?.avg_ms),
      botCount: toNum(s?.bot_count),
      topQueries: topQueryRes,
      peakHours: peakHourRes,
    }
  } catch {
    return { total: 0, uniqueQ: 0, zeroResults: 0, avgMs: 0, botCount: 0, topQueries: [], peakHours: [] }
  }
}

// ---------------------------------------------------------------------------
// D3 — Funnel Health
// ---------------------------------------------------------------------------

async function fetchFunnel(since: Date) {
  try {
    const rows = await db<{ event_name: string; cnt: string }[]>`
      SELECT event_name, COUNT(*) AS cnt
      FROM analytics_events
      WHERE created_at >= ${since}
      GROUP BY event_name ORDER BY COUNT(*) DESC
    `
    return rows
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// D4 — System Health
// ---------------------------------------------------------------------------

async function fetchSystemHealth(since: Date) {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
  try {
    const [pbRes, brokenRes, alertRes, tableRes] = await Promise.all([
      db<{ success: string; blocked: string }[]>`
        SELECT
          COUNT(*) FILTER (WHERE event_name != 'control_blocked') AS success,
          COUNT(*) FILTER (WHERE event_name = 'control_blocked') AS blocked
        FROM analytics_events WHERE created_at >= ${since24h}
      `,
      db<{ broken: string; total: string }[]>`
        SELECT
          COUNT(*) FILTER (WHERE ok = false) AS broken,
          COUNT(*) AS total
        FROM product_link_checks
      `,
      db<{ event: string; cnt: string; last_at: Date }[]>`
        SELECT event, COUNT(*) AS cnt, MAX(created_at) AS last_at
        FROM alert_logs WHERE created_at >= ${since}
        GROUP BY event ORDER BY COUNT(*) DESC LIMIT 8
      `,
      db<{ relname: string; n_live_tup: string }[]>`
        SELECT relname, n_live_tup
        FROM pg_stat_user_tables
        ORDER BY n_live_tup DESC LIMIT 8
      `,
    ])

    const success = toNum(pbRes[0]?.success)
    const blocked = toNum(pbRes[0]?.blocked)
    const pbTotal = success + blocked
    const pbFailRate = pbTotal > 0 ? ((blocked / pbTotal) * 100).toFixed(1) : '0.0'

    return {
      pbFailRate,
      brokenLinks: toNum(brokenRes[0]?.broken),
      totalLinks: toNum(brokenRes[0]?.total),
      alertRows: alertRes,
      tableRows: tableRes,
    }
  } catch {
    return { pbFailRate: '?', brokenLinks: 0, totalLinks: 0, alertRows: [], tableRows: [] }
  }
}

// ---------------------------------------------------------------------------
// D5 — Social / Facebook Manual
// ---------------------------------------------------------------------------

async function fetchSocialFacebook(since: Date) {
  try {
    const [manualStats, manualHooks, groupStats, groupPillars, topFbSubs] = await Promise.all([
      db<{ status: string; cnt: string }[]>`
        SELECT status, COUNT(*)::text AS cnt
        FROM fb_manual_posts WHERE created_at >= ${since}
        GROUP BY status ORDER BY COUNT(*) DESC
      `,
      db<{ hook_format: string; cnt: string; posted: string }[]>`
        SELECT hook_format,
               COUNT(*)::text AS cnt,
               COUNT(*) FILTER (WHERE status = 'posted')::text AS posted
        FROM fb_manual_posts WHERE created_at >= ${since}
        GROUP BY hook_format
        ORDER BY COUNT(*) FILTER (WHERE status = 'posted') DESC
      `,
      db<{ status: string; cnt: string }[]>`
        SELECT status, COUNT(*)::text AS cnt
        FROM fb_group_posts WHERE created_at >= ${since}
        GROUP BY status ORDER BY COUNT(*) DESC
      `,
      db<{ pillar: string; cnt: string; posted: string }[]>`
        SELECT pillar,
               COUNT(*)::text AS cnt,
               COUNT(*) FILTER (WHERE status = 'posted')::text AS posted
        FROM fb_group_posts WHERE created_at >= ${since}
        GROUP BY pillar ORDER BY COUNT(*) DESC
      `,
      db<{ sub_id: string; clicks: string }[]>`
        SELECT sub_id, COUNT(*)::text AS clicks
        FROM click_logs
        WHERE clicked_at >= ${since}
          AND sub_id IS NOT NULL
          AND (sub_id LIKE 'fb_manual_%' OR sub_id LIKE 'fb_group_vip_%')
        GROUP BY sub_id ORDER BY COUNT(*) DESC LIMIT 10
      `,
    ])
    return { manualStats, manualHooks, groupStats, groupPillars, topFbSubs }
  } catch {
    return { manualStats: [], manualHooks: [], groupStats: [], groupPillars: [], topFbSubs: [] }
  }
}

// ---------------------------------------------------------------------------
// D6 — Coupons
// ---------------------------------------------------------------------------

async function fetchCoupons(since: Date) {
  try {
    const [invRes, tierRes, topVotedRes, topReportedRes, voteStatsRes, walletRes] = await Promise.all([
      // Inventory summary
      db<{ active: string; expired: string; no_code: string; total: string }[]>`
        SELECT
          COUNT(*) FILTER (WHERE is_active = true AND (expire_at IS NULL OR expire_at > NOW())) AS active,
          COUNT(*) FILTER (WHERE expire_at IS NOT NULL AND expire_at <= NOW()) AS expired,
          COUNT(*) FILTER (WHERE code IS NULL) AS no_code,
          COUNT(*) AS total
        FROM coupons
      `,
      // By platform × tier
      db<{ platform: string; tier: string; cnt: string; avg_rate: string }[]>`
        SELECT platform, tier::text,
               COUNT(*)::text AS cnt,
               ROUND(AVG(success_rate), 1)::text AS avg_rate
        FROM coupons
        WHERE is_active = true AND (expire_at IS NULL OR expire_at > NOW())
        GROUP BY platform, tier ORDER BY tier, platform
      `,
      // Top 10 by success_rate (min 3 votes)
      db<{ code: string; title: string; success_rate: string; upvotes: string; downvotes: string }[]>`
        SELECT c.code, c.title,
               COALESCE(c.success_rate, 0)::text AS success_rate,
               COUNT(cv.id) FILTER (WHERE cv.vote = 'up')::text AS upvotes,
               COUNT(cv.id) FILTER (WHERE cv.vote = 'down')::text AS downvotes
        FROM coupons c
        LEFT JOIN coupon_votes cv ON cv.coupon_code = c.code
        WHERE c.is_active = true
        GROUP BY c.code, c.title, c.success_rate
        HAVING COUNT(cv.id) >= 3
        ORDER BY c.success_rate DESC NULLS LAST LIMIT 10
      `,
      // Top reported (most downvotes)
      db<{ code: string; title: string; downvotes: string; verified_at: string | null }[]>`
        SELECT c.code, c.title,
               COUNT(cv.id) FILTER (WHERE cv.vote = 'down')::text AS downvotes,
               c.verified_at::text AS verified_at
        FROM coupons c
        LEFT JOIN coupon_votes cv ON cv.coupon_code = c.code
        WHERE c.is_active = true
        GROUP BY c.code, c.title, c.verified_at
        HAVING COUNT(cv.id) FILTER (WHERE cv.vote = 'down') > 0
        ORDER BY downvotes DESC LIMIT 10
      `,
      // Vote activity in range
      db<{ total: string; up: string; down: string }[]>`
        SELECT
          COUNT(*)::text AS total,
          COUNT(*) FILTER (WHERE vote = 'up')::text AS up,
          COUNT(*) FILTER (WHERE vote = 'down')::text AS down
        FROM coupon_votes
        WHERE created_at >= ${since}
      `,
      // Wallet stats
      db<{ saved: string; near_expiry: string; platforms: string }[]>`
        SELECT
          COUNT(*)::text AS saved,
          COUNT(*) FILTER (WHERE expire_at IS NOT NULL AND expire_at <= NOW() + INTERVAL '48 hours')::text AS near_expiry,
          COUNT(DISTINCT platform)::text AS platforms
        FROM coupon_wallet
        WHERE is_used = false AND (expire_at IS NULL OR expire_at > NOW())
      `,
    ])

    return {
      inv: invRes[0] ?? { active: '0', expired: '0', no_code: '0', total: '0' },
      tierRows: tierRes,
      topVoted: topVotedRes,
      topReported: topReportedRes,
      voteStats: voteStatsRes[0] ?? { total: '0', up: '0', down: '0' },
      wallet: walletRes[0] ?? { saved: '0', near_expiry: '0', platforms: '0' },
    }
  } catch {
    return {
      inv: { active: '0', expired: '0', no_code: '0', total: '0' },
      tierRows: [],
      topVoted: [],
      topReported: [],
      voteStats: { total: '0', up: '0', down: '0' },
      wallet: { saved: '0', near_expiry: '0', platforms: '0' },
    }
  }
}

// ---------------------------------------------------------------------------
// Markdown assembler
// ---------------------------------------------------------------------------

function buildMarkdown(
  range: Range,
  rev: Awaited<ReturnType<typeof fetchRevenue>>,
  search: Awaited<ReturnType<typeof fetchSearch>>,
  funnel: { event_name: string; cnt: string }[],
  sys: Awaited<ReturnType<typeof fetchSystemHealth>>,
  social: Awaited<ReturnType<typeof fetchSocialFacebook>>,
  coupons: Awaited<ReturnType<typeof fetchCoupons>>,
): string {
  const gate = computeAiBaselineGateStatus()
  const totalClicks = rev.totalClicks

  const funnelMap = new Map(funnel.map(r => [r.event_name, toNum(r.cnt)]))
  const pageViews = funnelMap.get('page_view') ?? 0
  const productViews = funnelMap.get('intermediate_view') ?? 0
  const clicksThru = funnelMap.get('intermediate_continue') ?? 0

  const lines: string[] = [
    `# Couponkum — Analysis Export`,
    ``,
    `**Generated:** ${nowBangkok()} ICT | **Range:** ${range} | **Site:** couponkum.com`,
    ``,
    `---`,
    ``,
    `## 1. Revenue`,
    ``,
    `| Metric | Value |`,
    `| --- | --- |`,
    `| Affiliate clicks (${range}) | ${totalClicks.toLocaleString()} |`,
    `| This month settled | ${thb(rev.thisMonthSettled)} |`,
    `| Break-even progress | ${rev.breakEvenPct}% of ฿${rev.breakEvenTarget}/mo target |`,
    ``,
    `### Clicks by Platform (${range})`,
    ``,
    mdTable(
      ['platform', 'clicks'],
      rev.clicksByPlat.map(r => [r.platform, toNum(r.cnt).toLocaleString()]),
    ),
    ``,
    `### Revenue by Platform × Status (${range})`,
    ``,
    mdTable(
      ['platform', 'status', 'count', 'commission'],
      rev.commRows.length
        ? rev.commRows.map(r => [r.platform, r.payout_status, String(r.cnt), thb(toNum(r.total))])
        : [['—', '—', '0', thb(0)]],
    ),
    ``,
    `### Top Sub-IDs by Clicks (${range})`,
    ``,
    mdTable(
      ['sub_id', 'clicks'],
      rev.topSubs.length
        ? rev.topSubs.map(r => [r.sub_id, toNum(r.clicks).toLocaleString()])
        : [['(no sub_id data yet)', '0']],
    ),
    ``,
    `---`,
    ``,
    `## 2. Search Behavior (${range})`,
    ``,
    `| Metric | Value |`,
    `| --- | --- |`,
    `| Total searches | ${search.total.toLocaleString()} |`,
    `| Unique queries | ${search.uniqueQ.toLocaleString()} |`,
    `| Zero-result rate | ${pct(search.zeroResults, search.total)} (${search.zeroResults} queries) |`,
    `| Avg response time | ${search.avgMs}ms |`,
    `| Bot traffic | ${pct(search.botCount, search.total)} (${search.botCount} flagged) |`,
    ``,
    `### Top 20 Queries (${range}, human only)`,
    ``,
    mdTable(
      ['query', 'count'],
      search.topQueries.map(r => [r.query, toNum(r.cnt).toLocaleString()]),
    ),
    ``,
    `### Peak Search Hours BKK (${range})`,
    ``,
    mdTable(
      ['hour (ICT)', 'searches'],
      search.peakHours.map(r => [`${Math.floor(toNum(r.hour))}:00`, toNum(r.cnt).toLocaleString()]),
    ),
    ``,
    `---`,
    ``,
    `## 3. Funnel Health (${range})`,
    ``,
    `| Step | Count | Rate |`,
    `| --- | --- | --- |`,
    `| Page views | ${pageViews.toLocaleString()} | — |`,
    `| Product page views | ${productViews.toLocaleString()} | ${pct(productViews, pageViews)} of visits |`,
    `| Affiliate click-throughs | ${clicksThru.toLocaleString()} | ${pct(clicksThru, productViews)} of product views |`,
    ``,
    `### All Analytics Events (${range})`,
    ``,
    mdTable(
      ['event', 'count'],
      funnel.map(r => [r.event_name, toNum(r.cnt).toLocaleString()]),
    ),
    ``,
    `---`,
    ``,
    `## 4. System Health`,
    ``,
    `| Metric | Value |`,
    `| --- | --- |`,
    `| Postback fail rate (24h) | ${sys.pbFailRate}% |`,
    `| Broken affiliate links | ${sys.brokenLinks} / ${sys.totalLinks} |`,
    ``,
    `### Recent Alerts (${range})`,
    ``,
    mdTable(
      ['event', 'count', 'last seen'],
      sys.alertRows.length
        ? sys.alertRows.map(r => [
            r.event,
            toNum(r.cnt).toLocaleString(),
            new Date(r.last_at).toLocaleDateString('th-TH'),
          ])
        : [['(none)', '—', '—']],
    ),
    ``,
    `### Table Row Counts`,
    ``,
    mdTable(
      ['table', 'rows'],
      sys.tableRows.map(r => [r.relname, toNum(r.n_live_tup).toLocaleString()]),
    ),
    ``,
    `---`,
    ``,
    `## 5. Social / Facebook Manual (${range})`,
    ``,
    `### FB Page Manual Posts (DIST-01)`,
    ``,
    mdTable(
      ['status', 'count'],
      social.manualStats.length
        ? social.manualStats.map(r => [r.status, toNum(r.cnt).toLocaleString()])
        : [['(no posts yet)', '0']],
    ),
    ``,
    `#### By Hook Format`,
    ``,
    mdTable(
      ['hook_format', 'total', 'posted'],
      social.manualHooks.length
        ? social.manualHooks.map(r => [r.hook_format, toNum(r.cnt).toLocaleString(), toNum(r.posted).toLocaleString()])
        : [['(none)', '0', '0']],
    ),
    ``,
    `### FB VIP Group Posts (DIST-03B)`,
    ``,
    mdTable(
      ['status', 'count'],
      social.groupStats.length
        ? social.groupStats.map(r => [r.status, toNum(r.cnt).toLocaleString()])
        : [['(no posts yet)', '0']],
    ),
    ``,
    `#### Pillar Balance`,
    ``,
    mdTable(
      ['pillar', 'total', 'posted'],
      social.groupPillars.length
        ? social.groupPillars.map(r => [r.pillar, toNum(r.cnt).toLocaleString(), toNum(r.posted).toLocaleString()])
        : [['(none)', '0', '0']],
    ),
    ``,
    `### Top FB Sub-IDs by Clicks (${range})`,
    ``,
    mdTable(
      ['sub_id', 'clicks'],
      social.topFbSubs.length
        ? social.topFbSubs.map(r => [r.sub_id, toNum(r.clicks).toLocaleString()])
        : [['(no clicks yet)', '0']],
    ),
    ``,
    `---`,
    ``,
    `## 6. Coupons`,
    ``,
    `### Inventory`,
    ``,
    `| Metric | Value |`,
    `| --- | --- |`,
    `| Active (valid) | ${toNum(coupons.inv.active).toLocaleString()} |`,
    `| Expired | ${toNum(coupons.inv.expired).toLocaleString()} |`,
    `| No code (promo only) | ${toNum(coupons.inv.no_code).toLocaleString()} |`,
    `| Total | ${toNum(coupons.inv.total).toLocaleString()} |`,
    ``,
    `### By Platform × Tier`,
    ``,
    mdTable(
      ['platform', 'tier', 'count', 'avg success_rate'],
      coupons.tierRows.length
        ? coupons.tierRows.map(r => [r.platform, r.tier, r.cnt, r.avg_rate ? `${r.avg_rate}%` : '—'])
        : [['(no data)', '—', '0', '—']],
    ),
    ``,
    `### Vote Activity (${range})`,
    ``,
    `| Metric | Value |`,
    `| --- | --- |`,
    `| Total votes | ${toNum(coupons.voteStats.total).toLocaleString()} |`,
    `| 👍 Upvotes | ${toNum(coupons.voteStats.up).toLocaleString()} |`,
    `| 👎 Downvotes | ${toNum(coupons.voteStats.down).toLocaleString()} |`,
    `| Approval rate | ${pct(toNum(coupons.voteStats.up), toNum(coupons.voteStats.total))} |`,
    ``,
    `### Top Coupons by Success Rate (min 3 votes)`,
    ``,
    mdTable(
      ['code', 'title', 'success_rate', '👍', '👎'],
      coupons.topVoted.length
        ? coupons.topVoted.map(r => [r.code, r.title.slice(0, 30), `${r.success_rate}%`, r.upvotes, r.downvotes])
        : [['(not enough votes yet)', '—', '—', '0', '0']],
    ),
    ``,
    `### Reported Coupons (⚑ downvotes > 0)`,
    ``,
    mdTable(
      ['code', 'title', 'downvotes', 'verified_at'],
      coupons.topReported.length
        ? coupons.topReported.map(r => [
            r.code,
            r.title.slice(0, 30),
            r.downvotes,
            r.verified_at ? new Date(r.verified_at).toLocaleDateString('th-TH') : '⚠ ยังไม่ verify',
          ])
        : [['(none)', '—', '0', '—']],
    ),
    ``,
    `### Personal Wallet Stats (all users)`,
    ``,
    `| Metric | Value |`,
    `| --- | --- |`,
    `| Active saved coupons | ${toNum(coupons.wallet.saved).toLocaleString()} |`,
    `| Near-expiry (< 48h) | ${toNum(coupons.wallet.near_expiry).toLocaleString()} |`,
    ``,
    `---`,
    ``,
    `## 7. AI Readiness`,
    ``,
    `**Gate status:** ${gate.allSafe ? '✅ SAFE — all modules dormant' : '🚨 ALERT — module active without baseline'}`,
    ``,
    `**Affiliate click baseline:** ${totalClicks.toLocaleString()} / 1,000 needed for POSTLIVE-26.1 algo upgrade`,
    ``,
    mdTable(
      ['module', 'can_apply', 'mode'],
      gate.modules.map(m => [m.module, m.canApply ? '🚨 YES' : '✅ no', m.mode]),
    ),
    ``,
    `---`,
    ``,
    `*Paste into Claude with context: "วิเคราะห์ scaling / revenue drop / AI activation timing"*`,
  ]

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rangeParam = req.nextUrl.searchParams.get('range') ?? '30d'
  const range: Range = (VALID_RANGES as readonly string[]).includes(rangeParam)
    ? (rangeParam as Range)
    : '30d'

  const since = sinceDate(range)
  const ms    = monthStart()

  const [rev, search, funnel, sys, social, coupons] = await Promise.all([
    fetchRevenue(since, ms),
    fetchSearch(since),
    fetchFunnel(since),
    fetchSystemHealth(since),
    fetchSocialFacebook(since),
    fetchCoupons(since),
  ])

  const md = buildMarkdown(range, rev, search, funnel, sys, social, coupons)

  return new NextResponse(md, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="couponkum-export-${range}-${new Date().toISOString().slice(0, 10)}.md"`,
      'Cache-Control': 'no-store',
    },
  })
}
