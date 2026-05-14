// app/admin/page.tsx — Admin Dashboard (Server Component) · V15

import Link from "next/link"
import type { Metadata } from "next"
import { execSync } from "child_process"
import { requireAdminSession } from "@/lib/admin-auth"
import { db } from "@/lib/db"

export const metadata: Metadata = {
  title: "Admin — แพลนพร้อม",
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

// ── Lightweight log helpers ──────────────────────────────────────────────────
function findLog(glob: string): string {
  try {
    return execSync(`ls -t ${glob} 2>/dev/null | head -1`, { encoding: 'utf8', timeout: 2000 }).trim()
  } catch { return '' }
}
function tailLines(path: string, n: number): string[] {
  if (!path) return []
  try {
    return execSync(`tail -n ${n} "${path}" 2>/dev/null`, { encoding: 'utf8', timeout: 3000 })
      .split('\n').filter(Boolean)
  } catch { return [] }
}

function fetchSystemHealth() {
  try {
    const ngxAcc  = tailLines('/var/log/nginx/access.log', 500)
    const pm2Out  = tailLines(findLog('/root/.pm2/logs/planprom-out*.log'), 200)
    const pm2Err  = tailLines(findLog('/root/.pm2/logs/planprom-error*.log'), 100)
    const isErr   = (l: string) => /error|warn|fail|crash|502|504|unhandled|uncaught/i.test(l)
    return {
      count5xx:   ngxAcc.filter(l => / 5\d\d /.test(l)).length,
      count4xx:   ngxAcc.filter(l => / 4\d\d /.test(l)).length,
      errorLines: [...pm2Out.filter(isErr), ...pm2Err.filter(isErr)].length,
    }
  } catch {
    return { count5xx: 0, count4xx: 0, errorLines: 0 }
  }
}

// ── DB fetchers ───────────────────────────────────────────────────────────────
async function fetchDashboardData() {
  const [tmplRows, tmplOrderRows, orderRows, pageviewRows, promoRows, blogRows] = await Promise.all([
    // Template counts
    db<{ published: string; draft: string }[]>`
      SELECT
        COUNT(*) FILTER (WHERE status = 'published') AS published,
        COUNT(*) FILTER (WHERE status = 'draft')     AS draft
      FROM templates
    `.catch(() => []),

    // Today stats from template_orders (existing flow)
    db<{ orders_today: string; revenue_today: string; pending_dl: string }[]>`
      SELECT
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)                                          AS orders_today,
        COALESCE(SUM(amount_baht) FILTER (WHERE status = 'paid' AND created_at >= CURRENT_DATE), 0) AS revenue_today,
        COUNT(*) FILTER (WHERE status = 'pending_verify')                                           AS pending_dl
      FROM template_orders
    `.catch(() => []),

    // 30-day revenue + pending from orders table
    db<{ revenue_30d: string; pending_payment: string }[]>`
      SELECT
        COALESCE(SUM(total_baht) FILTER (WHERE status = 'paid' AND created_at >= NOW() - INTERVAL '30 days'), 0) AS revenue_30d,
        COUNT(*) FILTER (WHERE status = 'pending_payment') AS pending_payment
      FROM orders
    `.catch(() => []),

    // Pageviews today
    db<{ views_today: string }[]>`
      SELECT COUNT(*) AS views_today
      FROM analytics_events
      WHERE event_name = 'page_view' AND created_at >= CURRENT_DATE
    `.catch(() => []),

    // Active promo codes
    db<{ active_promos: string }[]>`
      SELECT COUNT(*) AS active_promos
      FROM promo_codes
      WHERE is_active = true AND (expires_at IS NULL OR expires_at > NOW())
    `.catch(() => []),

    // Blog drafts
    db<{ draft_posts: string; published_posts: string }[]>`
      SELECT
        COUNT(*) FILTER (WHERE status = 'draft')     AS draft_posts,
        COUNT(*) FILTER (WHERE status = 'published') AS published_posts
      FROM blog_posts
    `.catch(() => []),
  ])

  return {
    published:       Number(tmplRows[0]?.published      ?? 0),
    draft:           Number(tmplRows[0]?.draft          ?? 0),
    ordersToday:     Number(tmplOrderRows[0]?.orders_today  ?? 0),
    revenueToday:    Number(tmplOrderRows[0]?.revenue_today ?? 0),
    pendingDownloads:Number(tmplOrderRows[0]?.pending_dl    ?? 0),
    revenue30d:      Number(orderRows[0]?.revenue_30d     ?? 0),
    pendingPayment:  Number(orderRows[0]?.pending_payment  ?? 0),
    viewsToday:      Number(pageviewRows[0]?.views_today   ?? 0),
    activePromos:    Number(promoRows[0]?.active_promos    ?? 0),
    draftPosts:      Number(blogRows[0]?.draft_posts       ?? 0),
    publishedPosts:  Number(blogRows[0]?.published_posts   ?? 0),
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function AdminPage() {
  await requireAdminSession("/admin")

  const [data, health] = await Promise.all([
    fetchDashboardData(),
    Promise.resolve(fetchSystemHealth()),
  ])

  const healthStatus = health.count5xx > 0 ? 'error'
    : health.errorLines > 0                ? 'warning'
    : 'ok'

  return (
    <main className="min-h-screen bg-neutral-50 pb-20">
      <div className="mx-auto max-w-4xl px-4 py-8">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-black tracking-tight">Admin Dashboard</h1>
            <p className="mt-1 text-sm font-bold text-neutral-400 uppercase tracking-widest">
              แพลนพร้อม · V15
            </p>
          </div>
          <Link href="/"
            className="rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-xs font-black text-neutral-600 shadow-sm hover:border-black">
            ← หน้าแรก
          </Link>
        </div>

        {/* ═══════════════════════════════════════════════════════
            SECTION 1 — Template Store
        ═══════════════════════════════════════════════════════ */}
        <section className="mt-8 rounded-4xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-white to-amber-50 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                📋 Template Store
              </div>
              <h2 className="mt-2 text-xl font-black text-black">Template Management</h2>
            </div>
            <Link href="/admin/templates/new"
              className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-amber-600 px-4 text-sm font-black text-white transition hover:bg-amber-700">
              + เพิ่ม Template
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-amber-200 bg-white px-4 py-4 text-center shadow-sm">
              <p className="text-2xl font-black text-amber-700">{data.published}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">เผยแพร่</p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-4 text-center shadow-sm">
              <p className="text-2xl font-black text-neutral-400">{data.draft}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">ฉบับร่าง</p>
            </div>
            <div className={`rounded-2xl border bg-white px-4 py-4 text-center shadow-sm ${data.ordersToday > 0 ? 'border-green-300' : 'border-neutral-200'}`}>
              <p className={`text-2xl font-black ${data.ordersToday > 0 ? 'text-green-600' : 'text-neutral-300'}`}>
                {data.ordersToday}
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">ออเดอร์ วันนี้</p>
            </div>
            <div className={`rounded-2xl border bg-white px-4 py-4 text-center shadow-sm ${data.revenueToday > 0 ? 'border-green-300' : 'border-neutral-200'}`}>
              <p className={`text-2xl font-black ${data.revenueToday > 0 ? 'text-green-600' : 'text-neutral-300'}`}>
                ฿{data.revenueToday.toLocaleString()}
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">รายได้ วันนี้</p>
            </div>
          </div>

          {data.pendingDownloads > 0 && (
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-orange-300 bg-orange-50 px-4 py-3">
              <span>⚠️</span>
              <p className="text-sm font-black text-orange-800">
                {data.pendingDownloads} orders รอสร้าง download link — ตรวจสอบด่วน
              </p>
              <Link href="/admin/orders?filter=pending" className="ml-auto text-xs font-black text-orange-700 underline">
                ดู →
              </Link>
            </div>
          )}

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Link href="/admin/templates"
              className="flex items-start gap-3 rounded-3xl border border-amber-200 bg-white px-5 py-4 transition hover:border-amber-500 hover:shadow-md">
              <span className="text-2xl">📋</span>
              <div>
                <p className="font-black text-black">จัดการ Template</p>
                <p className="mt-0.5 text-xs text-neutral-500">เพิ่ม · แก้ไข · Publish · จัดลำดับ</p>
              </div>
            </Link>
            <Link href="/admin/orders"
              className="flex items-start gap-3 rounded-3xl border border-amber-200 bg-white px-5 py-4 transition hover:border-amber-500 hover:shadow-md">
              <span className="text-2xl">🧾</span>
              <div>
                <p className="font-black text-black">จัดการออเดอร์</p>
                <p className="mt-0.5 text-xs text-neutral-500">คำสั่งซื้อ · สถานะ PromptPay · Download link</p>
              </div>
            </Link>
            <Link href="/admin/template-analytics"
              className="flex items-start gap-3 rounded-3xl border border-amber-200 bg-white px-5 py-4 transition hover:border-amber-500 hover:shadow-md">
              <span className="text-2xl">📊</span>
              <div>
                <p className="font-black text-black">วิเคราะห์ยอดขาย</p>
                <p className="mt-0.5 text-xs text-neutral-500">ยอดขาย · Template ยอดนิยม · Conversion</p>
              </div>
            </Link>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            SECTION 2 — Report Snapshot
        ═══════════════════════════════════════════════════════ */}
        <section className="mt-5 rounded-4xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-indigo-50 p-6 shadow-sm">
          <div className="mb-4">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
              📈 Report
            </div>
            <h2 className="mt-2 text-xl font-black text-black">ภาพรวม</h2>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className={`rounded-2xl border bg-white px-4 py-4 text-center shadow-sm ${data.revenue30d > 0 ? 'border-indigo-200' : 'border-neutral-200'}`}>
              <p className={`text-2xl font-black ${data.revenue30d > 0 ? 'text-indigo-700' : 'text-neutral-300'}`}>
                ฿{data.revenue30d.toLocaleString()}
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">รายได้ 30 วัน</p>
            </div>
            <div className={`rounded-2xl border bg-white px-4 py-4 text-center shadow-sm ${data.pendingPayment > 0 ? 'border-amber-300' : 'border-neutral-200'}`}>
              <p className={`text-2xl font-black ${data.pendingPayment > 0 ? 'text-amber-600' : 'text-neutral-300'}`}>
                {data.pendingPayment}
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">รอชำระ</p>
            </div>
            <div className={`rounded-2xl border bg-white px-4 py-4 text-center shadow-sm ${data.viewsToday > 0 ? 'border-indigo-200' : 'border-neutral-200'}`}>
              <p className={`text-2xl font-black ${data.viewsToday > 0 ? 'text-indigo-500' : 'text-neutral-300'}`}>
                {data.viewsToday.toLocaleString()}
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">ผู้เข้าชม วันนี้</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/admin/report/sales"
              className="rounded-2xl border border-indigo-200 bg-white px-4 py-2 text-xs font-black text-indigo-700 hover:bg-indigo-50 transition">
              📊 ดู ยอดขาย →
            </Link>
            <Link href="/admin/report/payments"
              className="rounded-2xl border border-indigo-200 bg-white px-4 py-2 text-xs font-black text-indigo-700 hover:bg-indigo-50 transition">
              💳 ดู การชำระเงิน →
            </Link>
            <Link href="/admin/report/pageviews"
              className="rounded-2xl border border-indigo-200 bg-white px-4 py-2 text-xs font-black text-indigo-700 hover:bg-indigo-50 transition">
              👁 ดู ผู้เข้าชม →
            </Link>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            SECTION 3 — System Health
        ═══════════════════════════════════════════════════════ */}
        <section className={`mt-5 rounded-4xl border-2 p-6 shadow-sm transition ${
          healthStatus === 'error'   ? 'border-red-300 bg-gradient-to-br from-red-50 via-white to-red-50'
          : healthStatus === 'warning' ? 'border-amber-300 bg-gradient-to-br from-amber-50 via-white to-amber-50'
          : 'border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-50'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white ${
                healthStatus === 'error' ? 'bg-red-600' : healthStatus === 'warning' ? 'bg-amber-600' : 'bg-emerald-600'
              }`}>
                {healthStatus === 'error' ? '🔴' : healthStatus === 'warning' ? '⚠️' : '✅'} System Health
              </div>
              <h2 className="mt-2 text-xl font-black text-black">สุขภาพระบบ</h2>
            </div>
            <Link href="/admin/report/log"
              className="rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-xs font-black text-neutral-600 hover:border-black transition">
              ดู System Log →
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className={`rounded-2xl border bg-white px-4 py-4 text-center shadow-sm ${health.count5xx > 0 ? 'border-red-300' : 'border-neutral-200'}`}>
              <p className={`text-2xl font-black ${health.count5xx > 0 ? 'text-red-600' : 'text-emerald-500'}`}>
                {health.count5xx}
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">Nginx 5xx</p>
            </div>
            <div className={`rounded-2xl border bg-white px-4 py-4 text-center shadow-sm ${health.errorLines > 0 ? 'border-amber-300' : 'border-neutral-200'}`}>
              <p className={`text-2xl font-black ${health.errorLines > 0 ? 'text-amber-600' : 'text-emerald-500'}`}>
                {health.errorLines}
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">ข้อผิดพลาด (PM2)</p>
            </div>
            <div className={`rounded-2xl border bg-white px-4 py-4 text-center shadow-sm ${health.count4xx > 10 ? 'border-amber-200' : 'border-neutral-200'}`}>
              <p className={`text-2xl font-black ${health.count4xx > 10 ? 'text-amber-500' : 'text-neutral-400'}`}>
                {health.count4xx}
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">Nginx 4xx</p>
            </div>
          </div>

          <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
            healthStatus === 'error'   ? 'border-red-200 bg-red-50'
            : healthStatus === 'warning' ? 'border-amber-200 bg-amber-50'
            : 'border-emerald-200 bg-emerald-50'
          }`}>
            <span className="text-base">
              {healthStatus === 'error' ? '🔴' : healthStatus === 'warning' ? '⚠️' : '✅'}
            </span>
            <p className={`text-sm font-black ${
              healthStatus === 'error' ? 'text-red-800' : healthStatus === 'warning' ? 'text-amber-800' : 'text-emerald-800'
            }`}>
              {healthStatus === 'error'
                ? `พบ ${health.count5xx} Nginx 5xx error — ตรวจสอบ System Log ด่วน`
                : healthStatus === 'warning'
                ? `พบ ${health.errorLines} error lines ใน PM2 log — ควรตรวจสอบ`
                : 'ระบบทำงานปกติ — ไม่พบ 5xx, PM2 log ไม่มี error'}
            </p>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            SECTION 4 — Promo & Content
        ═══════════════════════════════════════════════════════ */}
        <section className="mt-5 rounded-4xl border-2 border-rose-200 bg-gradient-to-br from-rose-50 via-white to-rose-50 p-6 shadow-sm">
          <div className="mb-4">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
              🏷 Promo & Content
            </div>
            <h2 className="mt-2 text-xl font-black text-black">โปรโมชัน · บทความ</h2>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className={`rounded-2xl border bg-white px-4 py-4 text-center shadow-sm ${data.activePromos > 0 ? 'border-rose-300' : 'border-neutral-200'}`}>
              <p className={`text-2xl font-black ${data.activePromos > 0 ? 'text-rose-600' : 'text-neutral-300'}`}>
                {data.activePromos}
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">โปรโมชัน ใช้งาน</p>
            </div>
            <div className={`rounded-2xl border bg-white px-4 py-4 text-center shadow-sm ${data.draftPosts > 0 ? 'border-amber-300' : 'border-neutral-200'}`}>
              <p className={`text-2xl font-black ${data.draftPosts > 0 ? 'text-amber-600' : 'text-neutral-300'}`}>
                {data.draftPosts}
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">บทความ ร่าง</p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-4 text-center shadow-sm">
              <p className="text-2xl font-black text-neutral-600">{data.publishedPosts}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">บทความ เผยแพร่</p>
            </div>
          </div>

          {data.draftPosts > 0 && (
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3">
              <span>📝</span>
              <p className="text-sm font-black text-amber-800">
                มี {data.draftPosts} บทความที่ยังเป็น draft — Publish เพื่อเพิ่ม SEO
              </p>
              <Link href="/admin/seo" className="ml-auto text-xs font-black text-amber-700 underline">
                จัดการ →
              </Link>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/admin/promo-codes"
              className="rounded-2xl border border-rose-200 bg-white px-4 py-2 text-xs font-black text-rose-700 hover:bg-rose-50 transition">
              🏷 Promo Codes →
            </Link>
            <Link href="/admin/seo"
              className="rounded-2xl border border-rose-200 bg-white px-4 py-2 text-xs font-black text-rose-700 hover:bg-rose-50 transition">
              📝 Blog SEO →
            </Link>
            <Link href="/admin/form-builder"
              className="rounded-2xl border border-rose-200 bg-white px-4 py-2 text-xs font-black text-rose-700 hover:bg-rose-50 transition">
              🧩 Form Builder →
            </Link>
          </div>
        </section>

      </div>
    </main>
  )
}
