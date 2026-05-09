'use client'

import { useState, useEffect } from 'react'
import type { DailyFeaturedCoupon } from '@/lib/daily-featured-coupon'

const COOKIE_PREFIX = 'dcr_'

function getCookieRevealTime(date: string): string | null {
  if (typeof document === 'undefined') return null
  const key = `${COOKIE_PREFIX}${date}=`
  const found = document.cookie.split('; ').find(c => c.startsWith(key))
  return found ? decodeURIComponent(found.slice(key.length)) : null
}

function setRevealCookie(date: string, timeStr: string) {
  const expires = new Date(Date.now() + 25 * 60 * 60 * 1000)
  document.cookie = `${COOKIE_PREFIX}${date}=${encodeURIComponent(timeStr)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
}

function getIctCountdown(): string {
  const now = new Date()
  const ict = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }))
  const midnight = new Date(ict)
  midnight.setHours(24, 0, 0, 0)
  const diff = midnight.getTime() - ict.getTime()
  const h = Math.floor(diff / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  const s = Math.floor((diff % 60_000) / 1_000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function DailyFeaturedCard({ coupon }: { coupon: DailyFeaturedCoupon }) {
  const [revealed, setRevealed] = useState(false)
  const [revealedAt, setRevealedAt] = useState<string | null>(null)
  const [countdown, setCountdown] = useState('')
  const [copied, setCopied] = useState(false)

  // Hydrate reveal state from cookie — defer setState to avoid synchronous setState in effect body
  useEffect(() => {
    const saved = getCookieRevealTime(coupon.date)
    if (!saved) return
    const t = setTimeout(() => {
      setRevealed(true)
      setRevealedAt(saved)
    }, 0)
    return () => clearTimeout(t)
  }, [coupon.date])

  // Countdown timer — setState only inside interval callback
  useEffect(() => {
    const id = setInterval(() => setCountdown(getIctCountdown()), 1_000)
    return () => clearInterval(id)
  }, [])

  const discountLabel =
    coupon.discountType === 'percent'
      ? `ลด ${coupon.discountValue}%`
      : coupon.discountType === 'fixed'
        ? `ลด ฿${coupon.discountValue.toLocaleString('th-TH')}`
        : coupon.discountType === 'shipping'
          ? 'ฟรีค่าส่ง'
          : `คืน ${coupon.discountValue}%`

  const platformLabel =
    coupon.platform === 'shopee' ? 'Shopee' : coupon.platform === 'lazada' ? 'Lazada' : coupon.platform

  const expireLabel = coupon.expireAt
    ? `หมด ${new Date(coupon.expireAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}`
    : null

  const shareText = encodeURIComponent(
    `โค้ดคูปองวันนี้: ${coupon.code} — ${coupon.title} (${discountLabel}) จาก couponkum.com`,
  )

  const handleReveal = async () => {
    try {
      await navigator.clipboard.writeText(coupon.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2_000)
    } catch {
      /* clipboard unavailable — code is still visible */
    }

    const timeStr = new Date().toLocaleTimeString('th-TH', {
      timeZone: 'Asia/Bangkok',
      hour: '2-digit',
      minute: '2-digit',
    })
    setRevealCookie(coupon.date, timeStr)
    setRevealed(true)
    setRevealedAt(timeStr)

    fetch('/api/daily-coupon/reveal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coupon_id: coupon.couponId, date: coupon.date }),
    }).catch(() => {})
  }

  return (
    <section className="mt-5">
      <div className="overflow-hidden rounded-3xl border border-orange-200 bg-linear-to-br from-orange-50 to-amber-50 p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex rounded-full bg-orange-500 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
              โค้ดแนะนำวันนี้
            </span>
            {countdown && (
              <span className="font-mono text-[11px] font-bold text-neutral-400">
                รีเซ็ตใน {countdown}
              </span>
            )}
          </div>
          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-700">
            {discountLabel}
          </span>
        </div>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="line-clamp-2 text-lg font-black leading-snug text-neutral-900 sm:text-xl">
              {coupon.title}
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              {platformLabel}
              {expireLabel && ` · ${expireLabel}`}
            </p>
          </div>

          {!revealed ? (
            <button
              onClick={handleReveal}
              className="inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-2xl bg-orange-600 px-6 text-sm font-black text-white shadow-sm transition hover:bg-orange-700 active:scale-95 sm:w-auto"
            >
              กดดูโค้ดเลย
            </button>
          ) : (
            <div className="flex flex-col items-start gap-1.5 sm:items-end">
              <button
                onClick={handleReveal}
                title="คลิกเพื่อ copy อีกครั้ง"
                className="flex items-center gap-2.5 rounded-2xl bg-white px-4 py-2.5 shadow ring-1 ring-orange-200 transition hover:ring-orange-400"
              >
                <span className="select-all font-mono text-base font-black tracking-widest text-neutral-950 sm:text-lg">
                  {coupon.code}
                </span>
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-black text-green-700">
                  {copied ? 'COPIED ✓' : 'COPY'}
                </span>
              </button>
              {revealedAt && (
                <p className="text-[11px] text-neutral-400">
                  ดูแล้วเมื่อ {revealedAt} น. · ลุ้นโค้ดใหม่พรุ่งนี้ 00:00
                </p>
              )}
            </div>
          )}
        </div>

        {revealed && (
          <div className="mt-4 border-t border-orange-100 pt-4">
            <a
              href={`https://line.me/R/share?text=${shareText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-[#06C755] px-4 py-2 text-xs font-black text-white transition hover:opacity-90"
            >
              แชร์ให้เพื่อนใน LINE
            </a>
          </div>
        )}
      </div>
    </section>
  )
}
