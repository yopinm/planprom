// app/admin/page.tsx — Admin Dashboard (Server Component) · V15

import Link from "next/link";
import type { Metadata } from "next";
import { requireAdminSession } from "@/lib/admin-auth";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Admin — แพลนพร้อม",
  robots: { index: false, follow: false },
};

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
      published:        Number(pub[0]?.published ?? 0),
      draft:            Number(pub[0]?.draft ?? 0),
      ordersToday:      Number(ord[0]?.orders_today ?? 0),
      revenueToday:     Number(ord[0]?.revenue_today ?? 0),
      pendingDownloads: Number(ord[0]?.pending_dl ?? 0),
    }
  } catch {
    return { published: 0, draft: 0, ordersToday: 0, revenueToday: 0, pendingDownloads: 0 }
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function AdminPage() {
  await requireAdminSession("/admin");

  const templateStats = await fetchTemplateStats();

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
          <Link
            href="/"
            className="rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-xs font-black text-neutral-600 shadow-sm hover:border-black"
          >
            ← หน้าแรก
          </Link>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 1 — Template Store Admin
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

      </div>
    </main>
  );
}
