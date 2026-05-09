'use client'

/**
 * src/components/rare/RareItemCard.tsx
 * TASK 2.9 — Rare Item Card
 * TASK 4.3 — Image Optimization (SafeImage migration)
 *
 * Timestamp display:
 *   Mobile (<sm):  relative time — "5 นาทีที่แล้ว"
 *   Desktop (sm+): absolute time — "14:32"
 */

import { useEffect, useState } from 'react'
import type { RareItemBadge } from '@/types'
import { SafeImage } from '@/components/product/SafeImage'

// ---------------------------------------------------------------------------
// Badge config
// ---------------------------------------------------------------------------

const BADGE_CONFIG: Record<
  RareItemBadge,
  { label: string; bg: string; text: string }
> = {
  rare: {
    label: 'หายาก',
    bg:    'bg-red-500',
    text:  'text-white',
  },
  ready_to_ship: {
    label: 'พร้อมส่ง',
    bg:    'bg-green-500',
    text:  'text-white',
  },
  low_stock: {
    label: 'เหลือน้อย',
    bg:    'bg-amber-400',
    text:  'text-black',
  },
}

// ---------------------------------------------------------------------------
// Relative time helper (Thai)
// ---------------------------------------------------------------------------

function toRelativeTimeTh(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const sec  = Math.floor(diff / 1000)
  const min  = Math.floor(sec / 60)
  const hr   = Math.floor(min / 60)
  const day  = Math.floor(hr / 24)

  if (day  >= 1) return `${day} วันที่แล้ว`
  if (hr   >= 1) return `${hr} ชั่วโมงที่แล้ว`
  if (min  >= 1) return `${min} นาทีที่แล้ว`
  return 'เมื่อกี้'
}

function toAbsoluteTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('th-TH', {
    hour:   '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

// ---------------------------------------------------------------------------
// Timestamp sub-component
// ---------------------------------------------------------------------------

function RareTimestamp({ dateStr }: { dateStr: string }) {
  const [mounted, setMounted] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true) }, [])

  // Before hydration — render nothing to avoid mismatch
  if (!mounted) return null

  return (
    <span className="text-xs text-neutral-400">
      {/* Mobile: relative */}
      <span className="sm:hidden">{toRelativeTimeTh(dateStr)}</span>
      {/* Desktop: absolute HH:mm */}
      <span className="hidden sm:inline">{toAbsoluteTime(dateStr)}</span>
    </span>
  )
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface RareItemCardProps {
  productId:        string
  name:             string
  priceCurrent:     number
  priceOriginal?:   number | null
  imageUrl?:        string | null
  platform:         'shopee' | 'lazada'
  badge:            RareItemBadge
  finalScore:       number
  lastCalculatedAt: string
  /** e.g. /go/[id] or direct affiliate link */
  href:             string
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

const PLATFORM_COLOR: Record<string, string> = {
  shopee: 'text-orange-600',
  lazada: 'text-blue-600',
}

export function RareItemCard({
  name,
  priceCurrent,
  priceOriginal,
  imageUrl,
  platform,
  badge,
  finalScore,
  lastCalculatedAt,
  href,
}: RareItemCardProps) {
  const badgeCfg  = BADGE_CONFIG[badge]
  const discountPct =
    priceOriginal && priceOriginal > priceCurrent
      ? Math.round((1 - priceCurrent / priceOriginal) * 100)
      : null

  return (
    <a
      href={href}
      className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-white p-3 shadow-sm transition hover:border-orange-300 hover:shadow-md"
    >
      {/* Thumbnail */}
      <div className="relative shrink-0">
        <SafeImage
          src={imageUrl}
          alt={name}
          width={64}
          height={64}
          className="h-16 w-16 rounded-xl object-cover"
        />
        {/* Badge overlay */}
        <span
          className={`absolute -top-1.5 -right-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${badgeCfg.bg} ${badgeCfg.text}`}
        >
          {badgeCfg.label}
        </span>
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-xs font-semibold leading-snug text-black">
          {name}
        </p>

        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-base font-black text-black">
            ฿{priceCurrent.toLocaleString()}
          </span>
          {priceOriginal && priceOriginal > priceCurrent && (
            <span className="text-xs text-neutral-400 line-through">
              ฿{priceOriginal.toLocaleString()}
            </span>
          )}
          {discountPct !== null && (
            <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
              -{discountPct}%
            </span>
          )}
        </div>

        <div className="mt-1 flex items-center justify-between">
          <span className={`text-xs font-semibold ${PLATFORM_COLOR[platform]}`}>
            {platform === 'shopee' ? 'Shopee' : 'Lazada'}
          </span>
          <div className="flex items-center gap-1.5">
            {/* Score dot */}
            <span className="text-[10px] font-bold text-neutral-400">
              Score {finalScore}
            </span>
            <RareTimestamp dateStr={lastCalculatedAt} />
          </div>
        </div>
      </div>
    </a>
  )
}
