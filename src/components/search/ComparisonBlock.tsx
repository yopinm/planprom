// ComparisonBlock — TASK 1.13: Basic Comparison Block
// Shows best result per platform side-by-side: Shopee | Lazada
// TikTok: layout reserved, not shown yet (ยังไม่โชว์)
//
// No 'use client' — pure display, runs on server

import Link from 'next/link'
import type { SearchResultItem } from '@/features/engine/search-pipeline'
import type { Platform } from '@/types'
import { buildSubId } from '@/lib/sub-id'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Badge = 'คุ้มสุด' | 'ส่งฟรี' | 'official store'

interface PlatformEntry {
  platform: Platform
  item: SearchResultItem
  badges: Badge[]
}

// ---------------------------------------------------------------------------
// Badge detection helpers
// ---------------------------------------------------------------------------

function hasFreeShipping(item: SearchResultItem): boolean {
  return item.usedCombination.some(c => c.type === 'shipping')
}

function isOfficialStore(item: SearchResultItem): boolean {
  return item.shop_type === 'official' || item.shop_type === 'mall'
}

function buildEntries(results: SearchResultItem[]): PlatformEntry[] {
  const platforms: Platform[] = ['shopee', 'lazada']

  // Best per platform = lowest effectiveNet (results already sorted by deal score,
  // so first match per platform is also the top-ranked one)
  const best: Partial<Record<Platform, SearchResultItem>> = {}
  for (const r of results) {
    if (!best[r.platform]) best[r.platform] = r
  }

  const entries: PlatformEntry[] = platforms
    .filter((p): p is Platform => best[p] !== undefined)
    .map(p => ({ platform: p, item: best[p]!, badges: [] }))

  if (entries.length === 0) return []

  // "คุ้มสุด" → lowest effectiveNet
  const cheapest = entries.reduce((a, b) =>
    a.item.effectiveNet <= b.item.effectiveNet ? a : b,
  )
  cheapest.badges.push('คุ้มสุด')

  // "ส่งฟรี" + "official store" per entry
  for (const entry of entries) {
    if (hasFreeShipping(entry.item)) entry.badges.push('ส่งฟรี')
    if (isOfficialStore(entry.item)) entry.badges.push('official store')
  }

  return entries
}

// ---------------------------------------------------------------------------
// Badge pill
// ---------------------------------------------------------------------------

const BADGE_CLS: Record<Badge, string> = {
  'คุ้มสุด':       'bg-green-500 text-white',
  'ส่งฟรี':        'bg-blue-500 text-white',
  'official store': 'bg-neutral-800 text-white',
}

function BadgePill({ badge }: { badge: Badge }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${BADGE_CLS[badge]}`}
    >
      {badge}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Platform column
// ---------------------------------------------------------------------------

const PLATFORM_HEADER: Record<Platform, { label: string; bg: string; text: string }> = {
  shopee: { label: 'Shopee',  bg: 'bg-orange-500', text: 'text-white' },
  lazada: { label: 'Lazada',  bg: 'bg-blue-600',   text: 'text-white' },
  tiktok: { label: 'TikTok',  bg: 'bg-black',      text: 'text-white' },
}

function fmt(n: number) {
  return n.toLocaleString('th-TH')
}

function PlatformColumn({
  entry,
  query,
  rank,
}: {
  entry: PlatformEntry
  query: string
  rank: number
}) {
  const { platform, item, badges } = entry
  const header = PLATFORM_HEADER[platform]
  const hasCashback = item.effectiveNet < item.payNow
  const primaryCoupon = item.usedCombination.find(c => c.code !== null)

  const goParams = new URLSearchParams({
    source:   'comparison',
    sub_id:   buildSubId('compare', { rank, platform }),
    platform,
  })
  if (primaryCoupon?.code) goParams.set('coupon', primaryCoupon.code)
  if (query) goParams.set('q', query)
  const goUrl = `/go/${item.id}?${goParams.toString()}`

  return (
    <div className="flex flex-1 flex-col rounded-3xl border border-orange-200 bg-white overflow-hidden min-w-0">
      {/* Platform header */}
      <div className={`${header.bg} px-4 py-2.5`}>
        <p className={`text-sm font-black ${header.text}`}>{header.label}</p>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Badges */}
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {badges.map(b => <BadgePill key={b} badge={b} />)}
          </div>
        )}

        {/* Product name */}
        <p className="line-clamp-2 text-xs font-extrabold leading-snug text-black">
          {item.name}
        </p>

        {/* Trust signals */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          {item.rating !== null && (
            <span className="text-[11px] font-semibold text-amber-500">
              ★ {item.rating.toFixed(1)}
            </span>
          )}
          {item.sold_count > 0 && (
            <span className="text-[11px] text-neutral-400">
              {fmt(item.sold_count)} ชิ้น
            </span>
          )}
        </div>

        {/* Price block */}
        <div className="rounded-xl bg-orange-50 px-3 py-2.5">
          {item.originalPrice > item.payNow && (
            <p className="text-[11px] text-neutral-400 line-through">
              {fmt(item.originalPrice)} บาท
            </p>
          )}
          <p className="text-xl font-black text-black">
            {fmt(item.payNow)}
            <span className="ml-0.5 text-xs font-bold text-neutral-500"> ฿</span>
          </p>
          <p className="text-[11px] text-neutral-500">Pay Now</p>

          {hasCashback && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <p className="text-sm font-extrabold text-green-600">
                {fmt(item.effectiveNet)} ฿
              </p>
              <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-bold text-green-700">
                หลังแคชแบ็ก
              </span>
            </div>
          )}
        </div>

        {/* Key coupon */}
        {primaryCoupon?.code && (
          <div className="flex items-center gap-1.5">
            <span className="rounded-full border border-dashed border-orange-300 bg-orange-50 px-2.5 py-0.5 text-[11px] font-black text-orange-600">
              {primaryCoupon.code}
            </span>
          </div>
        )}

        {/* CTA — pushed to bottom */}
        <div className="mt-auto pt-1">
          <Link
            href={goUrl}
            className="flex w-full items-center justify-center rounded-xl bg-orange-600 px-3 py-2.5 text-xs font-extrabold text-white transition hover:bg-orange-700 active:scale-[0.98]"
          >
            ดูดีล →
          </Link>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface ComparisonBlockProps {
  results: SearchResultItem[]
  query: string
}

export function ComparisonBlock({ results, query }: ComparisonBlockProps) {
  const entries = buildEntries(results)

  // Need at least 2 platforms to show a comparison
  if (entries.length < 2) return null

  return (
    <div className="rounded-3xl border border-orange-200 bg-white p-5 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
        เปรียบราคาดีสุดต่อแพลตฟอร์ม
      </p>

      {/* Columns: Shopee | Lazada  (TikTok: reserved — hidden) */}
      <div className="mt-3 flex gap-3">
        {entries.map((entry, i) => (
          <PlatformColumn key={entry.platform} entry={entry} query={query} rank={i + 1} />
        ))}

        {/* TikTok placeholder — layout reserved, not shown yet */}
        {/* Uncomment in Phase 3 when TikTok Affiliate is integrated */}
        {/* <TikTokPlaceholder /> */}
      </div>
    </div>
  )
}
