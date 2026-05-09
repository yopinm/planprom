'use client'

import type { ReactElement } from 'react'
import Link from 'next/link'

interface TickerItem {
  emoji: string
  code: string | null
  platform: string
  desc: string
}

const TICKER_ITEMS: TickerItem[] = [
  { emoji: '🔥', code: 'SHOPEE10',  platform: 'Shopee',      desc: 'ลด 10% สูงสุด ฿200' },
  { emoji: '⚡', code: 'LAZADA80',  platform: 'Lazada',      desc: 'ลด ฿80 ขั้นต่ำ ฿300' },
  { emoji: '🚢', code: 'FREESHIP',  platform: 'Shopee',      desc: 'ส่งฟรีทุกออเดอร์' },
  { emoji: '💥', code: null,        platform: 'TikTok Shop', desc: 'แฟลชเซล ราคาพิเศษวันนี้' },
  { emoji: '🎁', code: null,        platform: 'Shopee',      desc: 'คูปองร้านค้า ลด ฿50 เมื่อซื้อครบ ฿500' },
  { emoji: '💳', code: null,        platform: 'Lazada',      desc: 'ผ่อน 0% นาน 3 เดือน ทุกบัตร' },
  { emoji: '🎯', code: 'SHOPEE10',  platform: 'Shopee',      desc: 'คืนเงิน Coins 10%' },
  { emoji: '🏷️', code: 'LAZADA80', platform: 'Lazada',      desc: 'โค้ดพิเศษสำหรับสมาชิก' },
]

const PLATFORM_CHIPS = [
  { label: 'Shopee',  href: '/search?q=shopee',  className: 'text-orange-700 hover:bg-orange-100' },
  { label: 'Lazada',  href: '/search?q=lazada',  className: 'text-blue-700 hover:bg-blue-50' },
  { label: 'TikTok',  href: '/search?q=tiktok',  className: 'text-neutral-800 hover:bg-neutral-100' },
]

function TickerContent(): ReactElement {
  return (
    <>
      {TICKER_ITEMS.map((item, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-2 px-8 text-xs text-neutral-600"
        >
          <span>{item.emoji}</span>
          {item.code && (
            <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[11px] font-black tracking-wide text-orange-700">
              {item.code}
            </span>
          )}
          <span className="font-semibold text-neutral-700">{item.platform}</span>
          <span className="text-neutral-400">·</span>
          <span>{item.desc}</span>
        </span>
      ))}
    </>
  )
}

export function DealTickerStrip(): ReactElement {
  return (
    <div className="border-t border-orange-100 bg-orange-50/70">
      <div className="mx-auto flex max-w-6xl items-center">

        {/* Platform chips — desktop only */}
        <div className="hidden shrink-0 items-center gap-1 border-r border-orange-200 px-3 py-1.5 sm:flex">
          {PLATFORM_CHIPS.map(({ label, href, className }) => (
            <Link
              key={label}
              href={href}
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-black transition ${className}`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Scrolling ticker */}
        <div className="flex-1 overflow-hidden py-1.5">
          <div
            className="flex whitespace-nowrap"
            style={{ animation: 'ticker 32s linear infinite' }}
          >
            <TickerContent />
            <TickerContent />
          </div>
        </div>

      </div>
    </div>
  )
}
