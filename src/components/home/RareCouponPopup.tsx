'use client'

// POSTLIVE-28: Rare Coupon Popup
// Triggers after 8s OR on exit-intent (mouse leaves top of viewport).
// Rate-limited to once per day via localStorage — no login required.
// Shows today's daily_featured_coupon with FOMO countdown + copy code CTA.
// LINE Notify deprecated (March 2025) — LINE integration deferred.

import { useEffect, useRef, useState } from 'react'
import type { DailyFeaturedCoupon } from '@/lib/daily-featured-coupon'

const LS_KEY = 'ck_popup_seen'

function todayKey(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
}

function hasSeenToday(): boolean {
  try { return localStorage.getItem(LS_KEY) === todayKey() } catch { return false }
}

function markSeenToday() {
  try { localStorage.setItem(LS_KEY, todayKey()) } catch {}
}

function getCountdown(): string {
  const now  = new Date()
  const ict  = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }))
  const next = new Date(ict); next.setHours(24, 0, 0, 0)
  const diff = next.getTime() - ict.getTime()
  const h    = Math.floor(diff / 3_600_000)
  const m    = Math.floor((diff % 3_600_000) / 60_000)
  return `${h}ชม. ${m}น.`
}

const LINE_OA_ID = process.env.NEXT_PUBLIC_LINE_OA_ID ?? ''

export function RareCouponPopup({ coupon }: { coupon: DailyFeaturedCoupon | null }) {
  const [visible,  setVisible]  = useState(false)
  const [copied,   setCopied]   = useState(false)
  const [countdown, setCountdown] = useState('')
  const shown = useRef(false)

  function show() {
    if (shown.current || hasSeenToday()) return
    shown.current = true
    markSeenToday()
    setVisible(true)
    setCountdown(getCountdown())
  }

  useEffect(() => {
    if (!coupon) return

    const timer = setTimeout(show, 8_000)

    const handleLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) show()
    }
    document.addEventListener('mouseleave', handleLeave)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mouseleave', handleLeave)
    }
  }, [coupon])

  useEffect(() => {
    if (!visible) return
    const id = setInterval(() => setCountdown(getCountdown()), 60_000)
    return () => clearInterval(id)
  }, [visible])

  if (!coupon || !visible) return null

  const discountLabel =
    coupon.discountType === 'percent'  ? `ลด ${coupon.discountValue}%` :
    coupon.discountType === 'fixed'    ? `ลด ฿${coupon.discountValue.toLocaleString('th-TH')}` :
    coupon.discountType === 'cashback' ? `คืน ${coupon.discountValue}%` : 'ฟรีค่าส่ง'

  const platformLabel = coupon.platform === 'shopee' ? 'Shopee' : coupon.platform === 'lazada' ? 'Lazada' : coupon.platform

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(coupon.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2_000)
    } catch {}
    fetch('/api/daily-coupon/reveal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coupon_id: coupon.couponId, date: coupon.date }),
    }).catch(() => {})
  }

  return (
    <div
      role="dialog"
      aria-label="โค้ดส่วนลดพิเศษวันนี้"
      className="fixed bottom-4 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4 rounded-3xl border border-orange-200 bg-white p-5 shadow-2xl duration-300"
    >
      {/* close */}
      <button
        onClick={() => setVisible(false)}
        aria-label="ปิด"
        className="absolute right-3.5 top-3.5 flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
      >
        ✕
      </button>

      {/* scarcity badge */}
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex rounded-full bg-red-500 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-white">
          โค้ดหายาก
        </span>
        <span className="text-[11px] font-bold text-neutral-400">
          {platformLabel} · หมดแล้วหมดเลย
        </span>
      </div>

      {/* title + discount */}
      <p className="line-clamp-2 text-base font-black leading-snug text-neutral-900">
        {coupon.title}
      </p>
      <p className="mt-1 text-sm font-bold text-orange-600">{discountLabel}</p>

      {/* FOMO countdown */}
      {countdown && (
        <p className="mt-2 text-[11px] text-neutral-400">
          โค้ดรีเซ็ตใน {countdown} — คว้าก่อนหมดวัน
        </p>
      )}

      {/* copy CTA */}
      <button
        onClick={handleCopy}
        className="mt-4 flex w-full items-center justify-between rounded-2xl bg-orange-600 px-5 py-3 transition hover:bg-orange-700 active:scale-95"
      >
        <span className="font-mono text-base font-black tracking-widest text-white">
          {coupon.code}
        </span>
        <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-black text-white">
          {copied ? 'COPIED ✓' : 'COPY'}
        </span>
      </button>

      {/* LINE subscribe */}
      {LINE_OA_ID && (
        <a
          href={`https://line.me/R/ti/p/${LINE_OA_ID}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-green-500 bg-white py-2.5 text-xs font-black text-green-600 transition hover:bg-green-50 active:scale-95"
        >
          💬 รับคูปองใหม่ทาง LINE ฟรี
        </a>
      )}
    </div>
  )
}
