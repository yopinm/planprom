// app/page.tsx — V15 Homepage (Section 1: Template Store only)
// Section 2 Coupon Affiliate → /affiliate

import Link from 'next/link'
import type { Metadata } from 'next'
import type { ReactElement } from 'react'
import {
  Wallet, ListChecks, HeartHandshake, FileText,
  Coffee, BookOpen, Calendar, Lightbulb,
} from 'lucide-react'
import { buildWebSiteJsonLd, toJsonLdString } from '@/lib/json-ld'
import { PRICE_TIERS } from '@/lib/pricing'
import { db } from '@/lib/db'
import { RecoveryHashRedirect } from '@/components/auth/RecoveryHashRedirect'
import FeaturedTemplateCard, { type FeaturedTemplate } from '@/components/home/FeaturedTemplateCard'
import { PromoCodeBanner, PromoCodeBannerPlaceholder, type PromoData } from '@/components/promo/PromoCodeBanner'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'แพลนพร้อม — Template PDF เช็คลิสต์ · แพลนเนอร์',
  description:
    'ชีวิตง่ายขึ้นด้วยเช็คลิสต์และแพลนเนอร์ · ชิ้นแรก ฿20 · ชิ้นถัดไป ฿10 · ตั้งแต่ชิ้นที่ 6 ฿7/ชิ้น · ดาวน์โหลดทันที · ใช้ซ้ำตลอดกาล',
  keywords: ['template pdf', 'planner', 'checklist', 'เช็คลิสต์', 'แพลนเนอร์', 'คูปอง'],
  openGraph: {
    title: 'แพลนพร้อม — เช็คลิสต์ + แพลนเนอร์ PDF พร้อมใช้',
    description: 'ชีวิตง่ายขึ้นด้วยเช็คลิสต์และแพลนเนอร์ · ชิ้นแรก ฿20 · ยิ่งซื้อยิ่งคุ้ม',
    url: 'https://planprom.com',
    siteName: 'แพลนพร้อม',
    locale: 'th_TH',
    type: 'website',
  },
}

// ── Data fetchers ─────────────────────────────────────────────────────────────

type CatalogGroup = {
  key: string; emoji: string; label: string; totalCount: number
}

async function fetchActivePromo(): Promise<PromoData | null> {
  const [row] = await db<PromoData[]>`
    SELECT code, label, expires_at, comeback_text
    FROM promo_codes
    WHERE is_active = true
      AND is_secret = false
      AND (
        NOW() BETWEEN starts_at AND expires_at
        OR (expires_at < NOW() AND comeback_text IS NOT NULL)
      )
    ORDER BY
      CASE WHEN NOW() BETWEEN starts_at AND expires_at THEN 0 ELSE 1 END,
      expires_at DESC
    LIMIT 1
  `.catch(() => [])
  return row ?? null
}

async function fetchFeaturedTemplate(): Promise<FeaturedTemplate | null> {
  try {
    const [row] = await db<FeaturedTemplate[]>`
      SELECT t.id, t.slug, t.title, t.tier, t.preview_path,
             c.name AS category_name, c.emoji AS category_emoji
      FROM templates t
      LEFT JOIN template_category_links l ON l.template_id = t.id
      LEFT JOIN template_categories c ON c.id = l.category_id
      WHERE t.status = 'published'
        AND (t.is_featured_weekly = true
             OR t.id = (
               SELECT id FROM templates
               WHERE status = 'published'
               ORDER BY sale_count DESC, created_at DESC
               LIMIT 1
             ))
      ORDER BY t.is_featured_weekly DESC
      LIMIT 1
    `
    return row ?? null
  } catch {
    return null
  }
}

async function fetchCatalogGroups(): Promise<CatalogGroup[]> {
  try {
    return await db<CatalogGroup[]>`
      SELECT c.slug AS key, c.emoji, c.name AS label, COUNT(t.id)::int AS "totalCount"
      FROM template_categories c
      JOIN template_category_links l ON l.category_id = c.id
      JOIN templates t ON t.id = l.template_id AND t.status = 'published'
      GROUP BY c.id, c.slug, c.emoji, c.name
      ORDER BY COUNT(t.id) DESC, c.name
    `
  } catch {
    return []
  }
}

// ── Static data ───────────────────────────────────────────────────────────────

const MOCK_TEMPLATE_CARDS = [
  { Icon: Wallet,         bg: 'from-amber-50 to-orange-100',  iconCls: 'text-amber-600',   title: 'แพลนเนอร์งบประมาณ',    price: '฿20', badge: '#1',      badgeCls: 'bg-red-600' },
  { Icon: ListChecks,     bg: 'from-blue-50 to-indigo-100',   iconCls: 'text-blue-600',    title: 'ติดตามนิสัย',           price: '฿20', badge: '#2',      badgeCls: 'bg-red-600' },
  { Icon: HeartHandshake, bg: 'from-pink-50 to-rose-100',     iconCls: 'text-pink-600',    title: 'แพลนเนอร์งานแต่ง',     price: '฿20', badge: 'ใหม่',    badgeCls: 'bg-cyan-600' },
  { Icon: FileText,       bg: 'from-emerald-50 to-teal-100',  iconCls: 'text-emerald-600', title: 'เรซูเม่ภาษาไทย',       price: '฿20', badge: 'ใหม่',    badgeCls: 'bg-cyan-600' },
  { Icon: Coffee,         bg: 'from-orange-50 to-amber-100',  iconCls: 'text-orange-600',  title: 'เปิดร้านกาแฟ',         price: '฿20', badge: 'ขายดี',   badgeCls: 'bg-red-600' },
  { Icon: BookOpen,       bg: 'from-indigo-50 to-violet-100', iconCls: 'text-indigo-600',  title: 'บันทึกการอ่าน',        price: '฿20', badge: 'ร้อนแรง', badgeCls: 'bg-red-600' },
  { Icon: Calendar,       bg: 'from-teal-50 to-cyan-100',     iconCls: 'text-teal-600',    title: 'แพลนเนอร์รายสัปดาห์', price: '฿20', badge: 'ใหม่',    badgeCls: 'bg-cyan-600' },
  { Icon: Lightbulb,      bg: 'from-yellow-50 to-amber-100',  iconCls: 'text-yellow-600',  title: 'บอร์ดไอเดีย',         price: '฿20', badge: 'ร้อนแรง', badgeCls: 'bg-red-600' },
]

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function HomePage(): Promise<ReactElement> {
  const [catalogGroups, featuredTemplate, activePromo] = await Promise.all([
    fetchCatalogGroups(),
    fetchFeaturedTemplate(),
    fetchActivePromo(),
  ])

  const websiteSchema = buildWebSiteJsonLd()
  const showMock = catalogGroups.length === 0

  return (
    <>
      <RecoveryHashRedirect />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdString(websiteSchema) }}
      />
      <main className="min-h-screen bg-white text-neutral-900">

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-emerald-50 via-white to-orange-50 px-4 py-10 text-center">
          <div className="mx-auto max-w-md">

            {/* Headline */}
            <h1 className="text-3xl font-black leading-tight text-neutral-900 sm:text-4xl">
              ยิ่งวางแผนเยอะ ยิ่งจ่ายน้อย
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-neutral-500">
              ฿20 ชิ้นแรก · ฿10 ชิ้นต่อไป · ฿7 ตั้งแต่ชิ้นที่ 6
            </p>

            {/* 4-step flow */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm font-semibold text-neutral-700">
              <span>🛒 เลือก</span>
              <span className="text-neutral-300">→</span>
              <span>🧺 ตะกร้า</span>
              <span className="text-neutral-300">→</span>
              <span>💳 จ่าย</span>
              <span className="text-neutral-300">→</span>
              <span>⬇️ โหลดได้เลย</span>
            </div>

            {/* Tier pricing card */}
            <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
              <div className="grid grid-cols-3 divide-x divide-neutral-100">
                <div className="flex flex-col items-center px-3 py-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">ชิ้นแรก</p>
                  <p className="mt-1 text-2xl font-black text-neutral-900">฿{PRICE_TIERS.TIER_1}</p>
                  <p className="text-[11px] text-neutral-400">/ชิ้น</p>
                </div>
                <div className="relative flex flex-col items-center bg-emerald-50 px-3 py-4">
                  <span className="absolute left-1.5 top-1.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-black text-emerald-700">2–5 ชิ้น</span>
                  <span className="absolute right-1.5 top-1.5 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-black text-white">-50%</span>
                  <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600">ครึ่งราคา</p>
                  <p className="mt-1 text-2xl font-black text-emerald-700">฿{PRICE_TIERS.TIER_2}</p>
                  <p className="text-[11px] text-emerald-500">/ชิ้น</p>
                </div>
                <div className="relative flex flex-col items-center px-3 py-4">
                  <span className="absolute right-1.5 top-1.5 rounded-full bg-neutral-200 px-1.5 py-0.5 text-[9px] font-black text-neutral-600">6 ชิ้น+</span>
                  <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">คุ้มสุด</p>
                  <p className="mt-1 text-2xl font-black text-neutral-900">฿{PRICE_TIERS.TIER_3}</p>
                  <p className="text-[11px] text-neutral-400">/ชิ้น</p>
                </div>
              </div>
              <div className="border-t border-neutral-100 py-2 text-center text-xs text-neutral-400">
                ยิ่งเพิ่มในตะกร้า ยิ่งถูกลงอัตโนมัติ
              </div>
            </div>

            {/* CTAs */}
            <div className="mt-5 flex flex-col gap-2">
              <Link
                href="/templates"
                className="flex h-12 w-full items-center justify-center rounded-2xl bg-amber-500 text-base font-black text-white shadow-md transition hover:bg-amber-600"
              >
                เริ่มต้นที่ ฿20 → ดูเทมเพลตทั้งหมด
              </Link>
            </div>

            {/* Trust strip (UI-C) */}
            <div className="mt-4 space-y-1 text-center text-xs text-neutral-400">
              <p>เทมเพลตคัดสรร · เพิ่มใหม่ทุกสัปดาห์</p>
              <p>✓ จ่ายเดียว ดาวน์โหลดทันที &nbsp;·&nbsp; ✓ ไม่ต้องสมัครสมาชิก &nbsp;·&nbsp; ✓ ไฟล์ไม่หมดอายุ</p>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 1 — Template Store (green)
        ══════════════════════════════════════════════════════════════ */}
        <div id="template-store" className="border-b-4 border-emerald-300 bg-gradient-to-b from-emerald-100 via-white to-emerald-50 px-6 py-10 sm:px-8 lg:px-12 lg:py-14">
          <div className="mx-auto max-w-7xl">

            {/* Section header */}
            <div className="mb-5">

              {/* Featured + Promo row */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {featuredTemplate ? (
                  <FeaturedTemplateCard template={featuredTemplate} />
                ) : (
                  <div className="rounded-xl border border-amber-200 bg-white px-4 py-4 shadow-sm" />
                )}
                {/* PROMO-2 */}
                {activePromo
                  ? <PromoCodeBanner promo={activePromo} />
                  : <PromoCodeBannerPlaceholder />
                }
              </div>

              {/* UI-E: 4 type cards */}
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                <Link
                  href="/templates?type=checklist"
                  className="group rounded-xl border border-emerald-200 bg-white px-4 py-4 shadow-sm transition hover:border-emerald-400 hover:shadow-md"
                >
                  <p className="text-xl font-black text-neutral-900">✅ เช็คลิสต์</p>
                  <p className="mt-1 text-xs text-neutral-500">ทำตามขั้น ไม่พลาด</p>
                  <p className="mt-3 text-xs font-semibold text-emerald-600 group-hover:underline">ดูเช็คลิสต์ →</p>
                </Link>
                <Link
                  href="/templates?type=planner"
                  className="group rounded-xl border border-purple-200 bg-white px-4 py-4 shadow-sm transition hover:border-purple-400 hover:shadow-md"
                >
                  <p className="text-xl font-black text-neutral-900">📅 แพลนเนอร์</p>
                  <p className="mt-1 text-xs text-neutral-500">วางแผน บรรลุเป้า</p>
                  <p className="mt-3 text-xs font-semibold text-purple-600 group-hover:underline">ดูแพลนเนอร์ →</p>
                </Link>
                <Link
                  href="/templates?type=form"
                  className="group rounded-xl border border-amber-200 bg-white px-4 py-4 shadow-sm transition hover:border-amber-400 hover:shadow-md"
                >
                  <p className="text-xl font-black text-neutral-900">📋 ฟอร์ม</p>
                  <p className="mt-1 text-xs text-neutral-500">กรอกข้อมูล พิมพ์ได้เลย</p>
                  <p className="mt-3 text-xs font-semibold text-amber-600 group-hover:underline">ดูฟอร์ม →</p>
                </Link>
                <Link
                  href="/templates?type=report"
                  className="group rounded-xl border border-blue-200 bg-white px-4 py-4 shadow-sm transition hover:border-blue-400 hover:shadow-md"
                >
                  <p className="text-xl font-black text-neutral-900">📊 รายงาน</p>
                  <p className="mt-1 text-xs text-neutral-500">สรุปผล นำเสนอได้ทันที</p>
                  <p className="mt-3 text-xs font-semibold text-blue-600 group-hover:underline">ดูรายงาน →</p>
                </Link>
              </div>
            </div>


            {/* Category chips */}
            <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
              {catalogGroups.map(cat => (
                <Link
                  key={cat.key}
                  href={`/templates?category=${cat.key}`}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-300 bg-white px-4 py-2 text-sm font-medium text-emerald-800 transition hover:bg-emerald-50"
                >
                  {cat.emoji} {cat.label}
                </Link>
              ))}
            </div>

            {/* Templates grid */}
            {showMock ? (
              <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-4">
                {MOCK_TEMPLATE_CARDS.map(t => (
                  <div
                    key={t.title}
                    className="flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm"
                  >
                    <div className={`relative flex h-28 items-center justify-center bg-gradient-to-br lg:h-32 ${t.bg}`}>
                      <t.Icon size={36} strokeWidth={1.5} className={t.iconCls} />
                      <span className={`absolute right-1.5 top-1.5 rounded px-1.5 py-0.5 text-[9px] font-medium text-white ${t.badgeCls}`}>
                        {t.badge}
                      </span>
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium leading-snug text-neutral-800">{t.title}</p>
                      <div className="mt-1.5">
                        <span className="inline-block rounded-md bg-emerald-100 px-2.5 py-0.5 text-base font-semibold text-emerald-800">{t.price}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {catalogGroups.map(cat => (
                  <Link
                    key={cat.key}
                    href={`/catalog/${cat.key}`}
                    className="group flex items-center gap-3 rounded-xl border-2 border-emerald-200 bg-[#ECFDF5] px-4 py-3 transition-all hover:scale-[1.01] hover:border-emerald-400 hover:shadow-md"
                  >
                    <span className="text-2xl leading-none">{cat.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-emerald-900 group-hover:text-emerald-700">
                        {cat.label}
                      </p>
                      <p className="text-xs text-emerald-600">{cat.totalCount} เทมเพลต →</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* LINE Request CTA — text only, no button */}
            <div className="mx-auto max-w-lg rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-center text-sm text-neutral-700">
              <span className="font-bold text-neutral-800">หาฟอร์มไม่เจอ?</span>
              {' '}➕ LINE → 💬 บอกฟอร์ม → ✅ ใน 24ชม.
              <span className="font-bold text-neutral-800"> · 50฿</span>
            </div>

          </div>
        </div>

      </main>
    </>
  )
}
