// app/admin/page.tsx — Admin Dashboard (Server Component) · V15
// Section 1 (top): Template Store management
// Section 2: Coupon Affiliate + existing ops/revenue/social tools

import Link from "next/link";
import type { Metadata } from "next";
import { requireAdminSession } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { getLatestTrends } from "@/lib/tiktok-trend-discovery";
import { getPendingTipsCount } from "@/lib/ugc";
import type { Coupon, TikTokTrend } from "@/types";
import {
  addCoupon,
  toggleCouponActiveAction,
  deleteCouponAction,
  syncTikTokTrendsAction,
} from "./actions";
import { fetchPostbackFailRate } from "@/lib/postback-fail-rate";

export const metadata: Metadata = {
  title: "Admin — คูปองคุ้ม",
  robots: { index: false, follow: false },
};

// ── V15 Template Store fetchers ───────────────────────────────────────────────
async function fetchTemplateStats(): Promise<{
  published: number
  draft: number
  ordersToday: number
  revenueToday: number
  pendingDownloads: number
}> {
  try {
    const [pub, ord] = await Promise.all([
      db<{ published: string; draft: string }[]>`
        SELECT
          COUNT(*) FILTER (WHERE status = 'published') AS published,
          COUNT(*) FILTER (WHERE status = 'draft') AS draft
        FROM templates
      `,
      db<{ orders_today: string; revenue_today: string; pending_dl: string }[]>`
        SELECT
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) AS orders_today,
          COALESCE(SUM(amount_baht) FILTER (WHERE status = 'paid' AND created_at >= CURRENT_DATE), 0) AS revenue_today,
          COUNT(*) FILTER (WHERE status = 'pending_verify') AS pending_dl
        FROM template_orders
      `,
    ])
    return {
      published:       Number(pub[0]?.published ?? 0),
      draft:           Number(pub[0]?.draft ?? 0),
      ordersToday:     Number(ord[0]?.orders_today ?? 0),
      revenueToday:    Number(ord[0]?.revenue_today ?? 0),
      pendingDownloads:Number(ord[0]?.pending_dl ?? 0),
    }
  } catch {
    return { published: 0, draft: 0, ordersToday: 0, revenueToday: 0, pendingDownloads: 0 }
  }
}

// ── V14 Coupon + site fetchers ────────────────────────────────────────────────
async function fetchCoupons(): Promise<Coupon[]> {
  try {
    return await db<Coupon[]>`SELECT * FROM coupons ORDER BY created_at DESC`
  } catch { return [] }
}

async function fetchPendingPostsCount(): Promise<number> {
  try {
    const [row] = await db<{ count: string }[]>`
      SELECT COUNT(*) AS count FROM facebook_posts WHERE status IN ('draft', 'scored')
    `
    return Number(row?.count ?? 0)
  } catch { return 0 }
}

async function fetchBrokenLinksCount(): Promise<number> {
  try {
    const [row] = await db<{ count: string }[]>`
      SELECT COUNT(*) AS count FROM product_link_checks WHERE ok = false
    `
    return Number(row?.count ?? 0)
  } catch { return 0 }
}

async function fetchFlaggedBotCount(): Promise<number> {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const [row] = await db<{ count: string }[]>`
      SELECT COUNT(*) AS count FROM search_logs
      WHERE flagged_bot = true AND searched_at >= ${since}
    `
    return Number(row?.count ?? 0)
  } catch { return 0 }
}

function todayBkkCutoff(): Date {
  const nowBkk = new Date(Date.now() + 7 * 60 * 60 * 1000)
  return new Date(nowBkk.toISOString().slice(0, 10) + 'T00:00:00+07:00')
}

async function fetchRevenueToday(): Promise<number> {
  try {
    const since = todayBkkCutoff()
    const [row] = await db<{ total: string }[]>`
      SELECT COALESCE(SUM(commission), 0) AS total FROM revenue_tracking
      WHERE event_type = 'conversion' AND received_at >= ${since}
    `
    return Number(row?.total ?? 0)
  } catch { return 0 }
}

async function fetchOutboundClicksToday(): Promise<number> {
  try {
    const since = todayBkkCutoff()
    const [row] = await db<{ count: string }[]>`
      SELECT COUNT(*) AS count FROM click_logs WHERE clicked_at >= ${since}
    `
    return Number(row?.count ?? 0)
  } catch { return 0 }
}

async function fetchConversionsToday(): Promise<number> {
  try {
    const since = todayBkkCutoff()
    const [row] = await db<{ count: string }[]>`
      SELECT COUNT(*) AS count FROM revenue_tracking
      WHERE event_type = 'conversion' AND received_at >= ${since}
    `
    return Number(row?.count ?? 0)
  } catch { return 0 }
}

async function fetchTopSubIdToday(): Promise<{ sub_id: string; count: number } | null> {
  try {
    const since = todayBkkCutoff()
    const [row] = await db<{ sub_id: string; count: string }[]>`
      SELECT sub_id, COUNT(*) AS count FROM click_logs
      WHERE clicked_at >= ${since} AND sub_id IS NOT NULL
      GROUP BY sub_id ORDER BY count DESC LIMIT 1
    `
    return row ? { sub_id: row.sub_id, count: Number(row.count) } : null
  } catch { return null }
}

async function fetchTopDealToday(): Promise<{ name: string; count: number } | null> {
  try {
    const since = todayBkkCutoff()
    const [row] = await db<{ name: string; count: string }[]>`
      SELECT p.name, COUNT(*) AS count
      FROM click_logs cl JOIN products p ON p.id = cl.product_id
      WHERE cl.clicked_at >= ${since} AND cl.product_id IS NOT NULL
      GROUP BY p.name ORDER BY count DESC LIMIT 1
    `
    return row ? { name: row.name, count: Number(row.count) } : null
  } catch { return null }
}

async function fetchPageViews(): Promise<{ rolling24h: number; today: number }> {
  try {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const sinceToday = todayBkkCutoff()
    const [row] = await db<{ rolling24h: string; today: string }[]>`
      SELECT
        COUNT(*) FILTER (WHERE created_at >= ${since24h}) AS rolling24h,
        COUNT(*) FILTER (WHERE created_at >= ${sinceToday}) AS today
      FROM analytics_events
      WHERE event_name = 'page_view'
        AND created_at >= LEAST(${since24h}, ${sinceToday})
    `
    return { rolling24h: Number(row?.rolling24h ?? 0), today: Number(row?.today ?? 0) }
  } catch { return { rolling24h: 0, today: 0 } }
}

async function fetchTikTokTrends(): Promise<TikTokTrend[]> {
  return getLatestTrends(5)
}

// ── Label maps ────────────────────────────────────────────────────────────────
const TIER_LABEL: Record<number, string> = {
  1: "T1 Platform", 2: "T2 Shop", 3: "T3 Shipping", 4: "T4 Cashback",
}
const TYPE_COLOR: Record<string, string> = {
  fixed: "bg-blue-100 text-blue-700",
  percent: "bg-green-100 text-green-700",
  shipping: "bg-sky-100 text-sky-700",
  cashback: "bg-purple-100 text-purple-700",
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function AdminPage() {
  await requireAdminSession("/admin");

  const [
    templateStats,
    coupons,
    pendingPosts,
    brokenLinks,
    flaggedBots,
    pendingTips,
    tiktokTrends,
    postbackFailRate,
    pageViews,
    revenueToday,
    clicksToday,
    conversionsToday,
    topSubId,
    topDeal,
  ] = await Promise.all([
    fetchTemplateStats(),
    fetchCoupons(),
    fetchPendingPostsCount(),
    fetchBrokenLinksCount(),
    fetchFlaggedBotCount(),
    getPendingTipsCount().catch(() => 0),
    fetchTikTokTrends(),
    fetchPostbackFailRate(),
    fetchPageViews(),
    fetchRevenueToday(),
    fetchOutboundClicksToday(),
    fetchConversionsToday(),
    fetchTopSubIdToday(),
    fetchTopDealToday(),
  ]);

  const conversionRate = clicksToday > 0 ? (conversionsToday / clicksToday) * 100 : 0;
  const activeCoupons = coupons.filter((c) => c.is_active).length;

  return (
    <main className="min-h-screen bg-neutral-50 pb-20">
      <div className="mx-auto max-w-4xl px-4 py-8">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-black tracking-tight">Admin Dashboard</h1>
            <p className="mt-1 text-sm font-bold text-neutral-400 uppercase tracking-widest">
              คูปองคุ้ม · V15
            </p>
          </div>
          <Link
            href="/"
            className="rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-xs font-black text-neutral-600 shadow-sm hover:border-black"
          >
            ← หน้าแรก
          </Link>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 1 — Template Store Admin (amber, top priority)
        ═══════════════════════════════════════════════════════════════ */}
        <section className="mt-8 rounded-4xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-white to-amber-50 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                📋 Template Store
              </div>
              <h2 className="mt-2 text-xl font-black text-black">Template Management</h2>
            </div>
            <Link
              href="/admin/templates/new"
              className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-amber-600 px-4 text-sm font-black text-white transition hover:bg-amber-700"
            >
              + เพิ่ม Template
            </Link>
          </div>

          {/* Template KPI */}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-amber-200 bg-white px-4 py-4 text-center shadow-sm">
              <p className="text-2xl font-black text-amber-700">{templateStats.published}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">Published</p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-4 text-center shadow-sm">
              <p className="text-2xl font-black text-neutral-400">{templateStats.draft}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">Draft</p>
            </div>
            <div className={`rounded-2xl border bg-white px-4 py-4 text-center shadow-sm ${templateStats.ordersToday > 0 ? 'border-green-300' : 'border-neutral-200'}`}>
              <p className={`text-2xl font-black ${templateStats.ordersToday > 0 ? 'text-green-600' : 'text-neutral-300'}`}>
                {templateStats.ordersToday}
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">Orders วันนี้</p>
            </div>
            <div className={`rounded-2xl border bg-white px-4 py-4 text-center shadow-sm ${templateStats.revenueToday > 0 ? 'border-green-300' : 'border-neutral-200'}`}>
              <p className={`text-2xl font-black ${templateStats.revenueToday > 0 ? 'text-green-600' : 'text-neutral-300'}`}>
                ฿{templateStats.revenueToday}
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">Revenue วันนี้</p>
            </div>
          </div>

          {/* Pending downloads alert */}
          {templateStats.pendingDownloads > 0 && (
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-orange-300 bg-orange-50 px-4 py-3">
              <span>⚠️</span>
              <p className="text-sm font-black text-orange-800">
                {templateStats.pendingDownloads} orders รอสร้าง download link — ตรวจสอบด่วน
              </p>
              <Link href="/admin/orders?filter=pending" className="ml-auto text-xs font-black text-orange-700 underline">
                ดู →
              </Link>
            </div>
          )}

          {/* Template quick nav */}
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Link
              href="/admin/templates"
              className="flex items-start gap-3 rounded-3xl border border-amber-200 bg-white px-5 py-4 transition hover:border-amber-500 hover:shadow-md"
            >
              <span className="text-2xl">📋</span>
              <div>
                <p className="font-black text-black">Template Manager</p>
                <p className="mt-0.5 text-xs text-neutral-500">เพิ่ม · แก้ไข · Publish · จัดลำดับ</p>
              </div>
            </Link>
            <Link
              href="/admin/orders"
              className="flex items-start gap-3 rounded-3xl border border-amber-200 bg-white px-5 py-4 transition hover:border-amber-500 hover:shadow-md"
            >
              <span className="text-2xl">🧾</span>
              <div>
                <p className="font-black text-black">Order Manager</p>
                <p className="mt-0.5 text-xs text-neutral-500">คำสั่งซื้อ · สถานะ PromptPay · Download link</p>
              </div>
            </Link>
            <Link
              href="/admin/template-analytics"
              className="flex items-start gap-3 rounded-3xl border border-amber-200 bg-white px-5 py-4 transition hover:border-amber-500 hover:shadow-md"
            >
              <span className="text-2xl">📊</span>
              <div>
                <p className="font-black text-black">Template Analytics</p>
                <p className="mt-0.5 text-xs text-neutral-500">ยอดขาย · Template ยอดนิยม · Conversion</p>
              </div>
            </Link>
          </div>
        </section>

        {/* ── Section Divider ── */}
        <div className="my-8 flex items-center gap-4">
          <div className="flex-1 border-t border-neutral-200" />
          <span className="text-[11px] font-black uppercase tracking-widest text-neutral-400">
            🎟️ Section 2 — Coupon Affiliate
          </span>
          <div className="flex-1 border-t border-neutral-200" />
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 2 — Coupon / Site Ops (existing)
        ═══════════════════════════════════════════════════════════════ */}

        {/* Critical Alert Banner */}
        {(brokenLinks > 10 || postbackFailRate > 5) && (
          <div className="rounded-2xl border border-red-300 bg-red-50 px-5 py-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-xl">🚨</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black uppercase tracking-widest text-red-700">Critical Alert</p>
                <ul className="mt-1.5 space-y-1 text-sm font-bold text-red-600">
                  {brokenLinks > 10 && (
                    <li>
                      ลิงก์เสีย <span className="font-black">{brokenLinks}</span> รายการ (เกิน 10){" "}
                      <Link href="/admin/link-health" className="underline hover:no-underline">ตรวจสอบ →</Link>
                    </li>
                  )}
                  {postbackFailRate > 5 && (
                    <li>
                      Postback fail rate <span className="font-black">{postbackFailRate.toFixed(1)}%</span> (เกิน 5%){" "}
                      <Link href="/admin/postbacks" className="underline hover:no-underline">ตรวจสอบ →</Link>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <section className="mt-6">
          <p className="mb-3 text-[11px] font-black uppercase tracking-wider text-neutral-400">KPI ประจำวัน — Affiliate</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border bg-white px-4 py-5 text-center shadow-sm border-neutral-200">
              <p className={`text-2xl font-black ${revenueToday > 0 ? 'text-green-600' : 'text-neutral-300'}`}>
                ฿{revenueToday.toFixed(2)}
              </p>
              <p className="mt-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Affiliate Revenue</p>
            </div>
            <div className="rounded-2xl border bg-white px-4 py-5 text-center shadow-sm border-neutral-200">
              <p className="text-2xl font-black text-blue-600">{clicksToday.toLocaleString('th-TH')}</p>
              <p className="mt-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">คลิกออก วันนี้</p>
            </div>
            <div className="rounded-2xl border bg-white px-4 py-5 text-center shadow-sm border-neutral-200">
              <p className={`text-2xl font-black ${conversionRate > 0 ? 'text-green-600' : 'text-neutral-300'}`}>
                {conversionRate.toFixed(2)}%
              </p>
              <p className="mt-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Conversion Rate</p>
              <p className="mt-1 text-[11px] font-bold text-neutral-400">{conversionsToday} orders</p>
            </div>
            <div className={`rounded-2xl border bg-white px-4 py-5 text-center shadow-sm ${postbackFailRate > 5 ? 'border-red-300' : postbackFailRate > 1 ? 'border-yellow-300' : 'border-neutral-200'}`}>
              <p className={`text-2xl font-black ${postbackFailRate > 5 ? 'text-red-600' : postbackFailRate > 1 ? 'text-yellow-600' : 'text-green-600'}`}>
                {postbackFailRate.toFixed(1)}%
              </p>
              <p className="mt-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Postback Fail</p>
            </div>
            <div className={`rounded-2xl border bg-white px-4 py-5 text-center shadow-sm ${brokenLinks > 0 ? 'border-red-300' : 'border-neutral-200'}`}>
              <p className={`text-2xl font-black ${brokenLinks > 0 ? 'text-red-600' : 'text-green-600'}`}>{brokenLinks}</p>
              <p className="mt-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">ลิงก์เสีย</p>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-white px-4 py-5 text-center shadow-sm">
              <p className="text-2xl font-black text-blue-600">{pageViews.today.toLocaleString('th-TH')}</p>
              <p className="mt-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Pageviews วันนี้</p>
              <p className="mt-1 text-[11px] font-bold text-neutral-400">24ชม. {pageViews.rolling24h.toLocaleString('th-TH')}</p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-5 text-center shadow-sm">
              <p className="truncate text-base font-black text-purple-600">{topSubId ? topSubId.sub_id : '—'}</p>
              <p className="mt-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Top Sub-ID</p>
              {topSubId && <p className="mt-1 text-[11px] font-bold text-neutral-400">{topSubId.count} คลิก</p>}
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-5 text-center shadow-sm">
              <p className="line-clamp-2 text-xs font-black text-orange-600 leading-snug">{topDeal ? topDeal.name : '—'}</p>
              <p className="mt-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Top Deal</p>
              {topDeal && <p className="mt-1 text-[11px] font-bold text-neutral-400">{topDeal.count} คลิก</p>}
            </div>
          </div>
        </section>

        {/* Stats strip */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "คูปองทั้งหมด", value: coupons.length, color: "text-black" },
            { label: "ใช้งานอยู่", value: activeCoupons, color: "text-green-600" },
            { label: "รอ Approve FB", value: pendingPosts, color: pendingPosts > 0 ? "text-orange-600" : "text-neutral-400" },
            { label: "UGC รอตรวจ", value: pendingTips, color: pendingTips > 0 ? "text-orange-600" : "text-neutral-400" },
            { label: "Bot 24ชม.", value: flaggedBots, color: flaggedBots > 0 ? "text-red-600" : "text-green-600" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-neutral-200 bg-white px-4 py-5 text-center shadow-sm">
              <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
              <p className="mt-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Quick nav groups */}
        <div className="mt-8 space-y-6">

          <section>
            <p className="mb-3 text-[11px] font-black uppercase tracking-wider text-neutral-400">Ops</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { href: "/admin/postbacks", icon: "PB", iconColor: "text-green-600", title: "Postback Monitor", desc: "Callback จาก partner · error rate" },
                { href: "/admin/alerts", icon: "ALT", iconColor: "text-red-600", title: "Alert Rules", desc: "Threshold แจ้งเตือน postback / ลิงก์เสีย" },
                { href: "/admin/deal-quality", icon: "QA", iconColor: "text-orange-500", title: "Deal Quality Report", desc: "ราคาเก่า · คูปองหมดอายุ · ลิงก์เสีย" },
                { href: "/admin/link-health", icon: "🔗", iconColor: "", title: "Link Health", desc: "ตรวจหา affiliate link เสีย" },
                { href: "/admin/uptime", icon: "UP", iconColor: "text-emerald-600", title: "Uptime Monitor", desc: "UptimeRobot health alert history" },
              ].map((item) => (
                <Link key={item.href} href={item.href} className="flex items-start gap-4 rounded-3xl border border-neutral-200 bg-white px-6 py-5 transition hover:border-black hover:shadow-md">
                  <span className={`text-2xl font-black ${item.iconColor}`}>{item.icon}</span>
                  <div>
                    <p className="font-black text-black">{item.title}</p>
                    <p className="mt-1 text-xs text-neutral-500">{item.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <p className="mb-3 text-[11px] font-black uppercase tracking-wider text-neutral-400">Revenue</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { href: "/admin/revenue", icon: "💰", title: "Revenue Dashboard", desc: "ยอดรวม · sub_id · funnel · conversions" },
                { href: "/admin/epc", icon: "EPC", title: "EPC Dashboard", desc: "Earnings per click จากทุกแพลตฟอร์ม" },
                { href: "/admin/funnel", icon: "📉", title: "Funnel Metrics", desc: "Drop-off · sub_id breakdown · affiliate flow" },
                { href: "/admin/influencer", icon: "🤝", title: "Influencer Sub-IDs", desc: "B2B link generator + performance per partner" },
                { href: "/admin/commission", icon: "%", title: "Commission Rate Map", desc: "อัตราคอมมิชชั่นแต่ละหมวด" },
              ].map((item) => (
                <Link key={item.href} href={item.href} className="flex items-start gap-4 rounded-3xl border border-neutral-200 bg-white px-6 py-5 transition hover:border-black hover:shadow-md">
                  <span className="text-2xl font-black">{item.icon}</span>
                  <div>
                    <p className="font-black text-black">{item.title}</p>
                    <p className="mt-1 text-xs text-neutral-500">{item.desc}</p>
                  </div>
                </Link>
              ))}
              <div className="flex items-start gap-4 rounded-3xl border border-neutral-200 bg-white px-6 py-5">
                <span className="text-2xl">📊</span>
                <div className="min-w-0 flex-1">
                  <p className="font-black text-black">Export Analysis</p>
                  <p className="mt-1 text-xs text-neutral-500">Markdown snapshot สำหรับวิเคราะห์กับ Claude</p>
                  <div className="mt-3 flex gap-2">
                    {(['7d', '30d', '90d'] as const).map((r) => (
                      <a key={r} href={`/api/admin/export?range=${r}`} download
                        className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-[11px] font-black text-neutral-600 transition hover:border-black hover:bg-white">
                        {r}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <p className="mb-3 text-[11px] font-black uppercase tracking-wider text-neutral-400">Products</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { href: "/admin/shopee-import", icon: "📥", title: "Shopee Import", desc: "นำเข้าสินค้า manual form หรือ CSV" },
                { href: "/admin/deal-queue", icon: "📋", title: "Deal Queue", desc: "เปิด/ปิดใช้งานสินค้า · platform/source/age" },
                { href: "/admin/bookmarklet", icon: "BM", title: "Shopee Bookmarklet", desc: "นำเข้าสินค้า Shopee ผ่าน browser" },
                { href: "/admin#coupons", icon: "🏷️", title: "จัดการคูปอง", desc: `เพิ่ม / แก้ไข / ปิดใช้งาน · ${coupons.length} รายการ` },
              ].map((item) => (
                <Link key={item.href} href={item.href} className="flex items-start gap-4 rounded-3xl border border-neutral-200 bg-white px-6 py-5 transition hover:border-black hover:shadow-md">
                  <span className="text-2xl font-black">{item.icon}</span>
                  <div>
                    <p className="font-black text-black">{item.title}</p>
                    <p className="mt-1 text-xs text-neutral-500">{item.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <p className="mb-3 text-[11px] font-black uppercase tracking-wider text-neutral-400">Social / Facebook</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link href="/admin/social/templates" className="flex items-start gap-4 rounded-3xl border border-neutral-200 bg-white px-6 py-5 transition hover:border-black hover:shadow-md">
                <span className="text-2xl">📣</span>
                <div><p className="font-black text-black">FB Manual Post</p><p className="mt-1 text-xs text-neutral-500">สร้าง Caption 5 hook · 3 slots · copy+sub_id</p></div>
              </Link>
              <Link href="/admin/fb-vip-group" className="flex items-start gap-4 rounded-3xl border border-neutral-200 bg-white px-6 py-5 transition hover:border-black hover:shadow-md">
                <span className="text-2xl">🔒</span>
                <div><p className="font-black text-black">FB VIP Group</p><p className="mt-1 text-xs text-neutral-500">Private group · 7 pillars · pillar balance</p></div>
              </Link>
              <Link href="/admin/social/performance" className="flex items-start gap-4 rounded-3xl border border-neutral-200 bg-white px-6 py-5 transition hover:border-black hover:shadow-md">
                <span className="text-2xl">📈</span>
                <div><p className="font-black text-black">FB Post Performance</p><p className="mt-1 text-xs text-neutral-500">clicks + revenue per fb_manual_* sub_id 30 วัน</p></div>
              </Link>
              <Link href="/admin/facebook/queue" className="flex items-start gap-4 rounded-3xl border border-neutral-200 bg-white px-6 py-5 transition hover:border-black hover:shadow-md">
                <span className="text-2xl">📱</span>
                <div>
                  <p className="font-black text-black">Facebook Queue</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    โพสต์รอ Approve
                    {pendingPosts > 0 && (
                      <span className="ml-2 rounded-full bg-orange-600 px-2 py-0.5 text-[10px] font-black text-white">{pendingPosts}</span>
                    )}
                  </p>
                </div>
              </Link>
              <Link href="/admin/facebook/analytics" className="flex items-start gap-4 rounded-3xl border border-neutral-200 bg-white px-6 py-5 transition hover:border-black hover:shadow-md">
                <span className="text-2xl font-black text-blue-600">AB</span>
                <div><p className="font-black text-black">FB A/B Analytics</p><p className="mt-1 text-xs text-neutral-500">วิเคราะห์ผล A/B test ของ Facebook posts</p></div>
              </Link>
              <Link href="/admin/facebook/log" className="flex items-start gap-4 rounded-3xl border border-neutral-200 bg-white px-6 py-5 transition hover:border-black hover:shadow-md">
                <span className="text-2xl">📜</span>
                <div><p className="font-black text-black">FB Post Log</p><p className="mt-1 text-xs text-neutral-500">ประวัติสถานะโพสต์ทั้งหมด</p></div>
              </Link>
              <Link href="/admin/facebook/config" className="flex items-start gap-4 rounded-3xl border border-neutral-200 bg-white px-6 py-5 transition hover:border-black hover:shadow-md">
                <span className="text-2xl">⚙️</span>
                <div><p className="font-black text-black">FB Config</p><p className="mt-1 text-xs text-neutral-500">Kill-switch · Graph API · TOS review · calendar</p></div>
              </Link>
              <Link href="/admin/tiktok-hooks" className="flex items-start gap-4 rounded-3xl border border-neutral-200 bg-white px-6 py-5 transition hover:border-black hover:shadow-md">
                <span className="text-2xl">🎣</span>
                <div><p className="font-black text-black">TikTok Hook Library</p><p className="mt-1 text-xs text-neutral-500">เทมเพลตคอนเทนต์สำหรับทีม</p></div>
              </Link>
            </div>
          </section>

          <section>
            <p className="mb-3 text-[11px] font-black uppercase tracking-wider text-neutral-400">Content</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link href="/admin/ugc" className="flex items-start gap-4 rounded-3xl border border-neutral-200 bg-white px-6 py-5 transition hover:border-black hover:shadow-md">
                <span className="text-2xl">💬</span>
                <div>
                  <p className="font-black text-black">UGC Moderation</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    ตรวจสอบ content จากผู้ใช้
                    {pendingTips > 0 && (
                      <span className="ml-2 rounded-full bg-orange-600 px-2 py-0.5 text-[10px] font-black text-white">{pendingTips}</span>
                    )}
                  </p>
                </div>
              </Link>
              <Link href="/admin/experiments" className="flex items-start gap-4 rounded-3xl border border-neutral-200 bg-white px-6 py-5 transition hover:border-black hover:shadow-md">
                <span className="text-2xl font-black text-blue-600">AB</span>
                <div><p className="font-black text-black">Experiment Review</p><p className="mt-1 text-xs text-neutral-500">ทดสอบ CTA และ layout</p></div>
              </Link>
            </div>
          </section>

          <section>
            <p className="mb-3 text-[11px] font-black uppercase tracking-wider text-neutral-400">System</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { href: "/admin/control", icon: "CTRL", title: "Control Center", desc: "Feature flags · เปิด-ปิดระบบ · audit log" },
                { href: "/admin/security", icon: "SEC", iconColor: "text-red-500", title: "Security Insights", desc: "สัญญาณ Bot และการโจมตี" },
                { href: "/admin/db-monitor", icon: "DB", iconColor: "text-indigo-600", title: "DB Growth Monitor", desc: "ขนาด table · retention risk · thresholds" },
                { href: "/admin/preflight", icon: "🔍", title: "DB Preflight", desc: "ตรวจสอบ schema ก่อน migrate DB" },
              ].map((item) => (
                <Link key={item.href} href={item.href} className="flex items-start gap-4 rounded-3xl border border-neutral-200 bg-white px-6 py-5 transition hover:border-black hover:shadow-md">
                  <span className={`text-2xl font-black ${'iconColor' in item ? item.iconColor : ''}`}>{item.icon}</span>
                  <div>
                    <p className="font-black text-black">{item.title}</p>
                    <p className="mt-1 text-xs text-neutral-500">{item.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* TikTok Trends */}
        <section className="mt-10 rounded-4xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-black text-black">
              <span className="text-xl">🎬</span> TikTok Trending
            </h2>
            <form action={syncTikTokTrendsAction}>
              <button type="submit" className="rounded-full bg-neutral-100 p-1.5 text-neutral-400 hover:bg-neutral-200 hover:text-black transition" title="Refresh">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" />
                </svg>
              </button>
            </form>
          </div>
          <div className="mt-6 grid gap-3">
            {tiktokTrends.length > 0 ? tiktokTrends.map((trend) => (
              <div key={trend.id} className="flex items-center justify-between rounded-2xl border border-neutral-100 bg-neutral-50 px-5 py-4 transition hover:bg-white hover:shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-xs font-black text-white">{trend.score}</div>
                  <div>
                    <p className="text-sm font-black text-black">{trend.keyword}</p>
                    <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                      {trend.category} · {new Date(trend.updated_at).toLocaleTimeString("th-TH")}
                    </p>
                  </div>
                </div>
                <Link href={`/search?q=${encodeURIComponent(trend.keyword)}`}
                  className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-[11px] font-black text-neutral-600 hover:border-black transition">
                  หาดีลเลย
                </Link>
              </div>
            )) : (
              <p className="py-8 text-center text-sm text-neutral-400 italic">ยังไม่มีข้อมูลเทรนด์วันนี้</p>
            )}
          </div>
        </section>

        {/* Coupon Management */}
        <section id="coupons" className="mt-10 rounded-4xl border border-neutral-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-black text-black">จัดการคูปอง</h2>
          <p className="mt-1 text-sm text-neutral-500">เพิ่มคูปองใหม่เข้าสู่ระบบ เพื่อให้คำนวณโค้ดซ้อนได้</p>

          <form action={addCoupon} className="mt-8 grid grid-cols-2 gap-5">
            <div className="col-span-2">
              <label className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-neutral-400">ชื่อคูปอง *</label>
              <input name="title" required placeholder="เช่น Shopee ลด 10% ขั้นต่ำ 500"
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 text-sm outline-none transition focus:border-orange-500 focus:bg-white" />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-neutral-400">โค้ดส่วนลด</label>
              <input name="code" placeholder="เช่น SHOPEE10"
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 font-mono text-sm outline-none transition focus:border-orange-500 focus:bg-white" />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-neutral-400">Platform *</label>
              <select name="platform" required className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 text-sm outline-none transition focus:border-orange-500 focus:bg-white">
                <option value="all">ทุก Platform</option>
                <option value="shopee">Shopee</option>
                <option value="lazada">Lazada</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-neutral-400">Discount Tier *</label>
              <select name="tier" required className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 text-sm outline-none transition focus:border-orange-500 focus:bg-white">
                <option value="1">Tier 1 — Platform (คูปองแอป)</option>
                <option value="2">Tier 2 — Shop (คูปองร้าน)</option>
                <option value="3">Tier 3 — Shipping (ส่งฟรี)</option>
                <option value="4">Tier 4 — Cashback (รับเงินคืน)</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-neutral-400">ประเภทส่วนลด *</label>
              <select name="type" required className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 text-sm outline-none transition focus:border-orange-500 focus:bg-white">
                <option value="percent">Percent (%)</option>
                <option value="fixed">Fixed Amount (฿)</option>
                <option value="shipping">Shipping (ส่งฟรี)</option>
                <option value="cashback">Cashback (Coin)</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-neutral-400">มูลค่าส่วนลด *</label>
              <input name="discount_value" type="number" required min="0" step="0.01" placeholder="10"
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 text-sm font-bold text-orange-600 outline-none transition focus:border-orange-500 focus:bg-white" />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-neutral-400">ลดสูงสุด (฿)</label>
              <input name="max_discount" type="number" min="0" placeholder="เช่น 200"
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 text-sm font-bold outline-none transition focus:border-orange-500 focus:bg-white" />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-neutral-400">Min spend</label>
              <input name="min_spend" type="number" min="0" defaultValue="0" placeholder="500"
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 text-sm font-bold outline-none transition focus:border-orange-500 focus:bg-white" />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-neutral-400">Expire at</label>
              <input name="expire_at" type="datetime-local"
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 text-sm outline-none transition focus:border-orange-500 focus:bg-white" />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-neutral-400">User Segment</label>
              <select name="user_segment" defaultValue="all" className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 text-sm outline-none transition focus:border-orange-500 focus:bg-white">
                <option value="all">All users</option>
                <option value="new_user">New users</option>
                <option value="member">Members</option>
                <option value="premium">Premium</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex min-h-12.5 w-full items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-bold text-neutral-700">
                <input name="can_stack" type="checkbox" value="true" defaultChecked />
                <span>Can stack with other coupons</span>
              </label>
            </div>
            <div className="col-span-2 pt-4">
              <button type="submit" className="w-full rounded-2xl bg-black px-8 py-4 text-base font-black text-white shadow-lg transition hover:bg-orange-600 active:scale-95">
                บันทึกคูปองใหม่
              </button>
            </div>
          </form>
        </section>

        {/* Coupon List */}
        <section className="mt-10">
          <h2 className="px-2 text-xl font-black text-black">คูปองในระบบ ({coupons.length})</h2>
          <div className="mt-6 space-y-3">
            {coupons.map((coupon) => (
              <div key={coupon.id} className={`flex items-center justify-between gap-4 rounded-3xl border bg-white px-6 py-5 shadow-sm transition hover:shadow-md ${coupon.is_active ? "border-neutral-100" : "border-neutral-50 bg-neutral-50 opacity-60"}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-black text-black">{coupon.title}</span>
                    {coupon.code && (
                      <span className="rounded-lg border border-dashed border-orange-400 bg-orange-50 px-2.5 py-1 text-xs font-black uppercase tracking-tighter text-orange-600">
                        {coupon.code}
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold uppercase tracking-wider">
                    <span className={`rounded-full px-2 py-0.5 ${TYPE_COLOR[coupon.type] ?? "bg-neutral-100 text-neutral-600"}`}>{coupon.type}</span>
                    <span className="text-neutral-400">{TIER_LABEL[coupon.tier] ?? `Tier ${coupon.tier}`}</span>
                    <span className="text-neutral-400">{coupon.platform}</span>
                    {coupon.expire_at && (
                      <span className="text-red-400">EXP: {new Date(coupon.expire_at).toLocaleDateString("th-TH")}</span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <form action={toggleCouponActiveAction}>
                    <input type="hidden" name="coupon_id" value={coupon.id} />
                    <input type="hidden" name="is_active" value={String(!coupon.is_active)} />
                    <button type="submit" className={`rounded-xl px-4 py-2 text-xs font-black transition ${coupon.is_active ? "bg-green-50 text-green-700 hover:bg-orange-50 hover:text-orange-600" : "bg-neutral-100 text-neutral-400 hover:bg-green-50 hover:text-green-700"}`}>
                      {coupon.is_active ? "Active" : "Offline"}
                    </button>
                  </form>
                  <form action={deleteCouponAction}>
                    <input type="hidden" name="coupon_id" value={coupon.id} />
                    <button type="submit" className="rounded-xl px-3 py-2 text-xs font-black text-neutral-300 transition hover:bg-red-50 hover:text-red-600">ลบ</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}
