'use client'

import { useState, useEffect } from 'react'
import { PRICE_TIERS } from '@/lib/pricing'

export interface PromoData {
  code: string
  label: string
  expires_at: string
  starts_at: string
  comeback_text?: string | null
  discount_type?: string | null
  discount_value?: number | null
  max_uses?: number | null
  used_count?: number | null
}

function getCountdown(expiresAt: string): { value: number; unit: 'hours' | 'days' } {
  const diffMs = new Date(expiresAt).getTime() - Date.now()
  if (diffMs <= 0) return { value: 0, unit: 'hours' }
  const diffHours = diffMs / (1000 * 60 * 60)
  if (diffHours < 24) return { value: Math.max(1, Math.ceil(diffHours)), unit: 'hours' }
  return { value: Math.ceil(diffHours / 24), unit: 'days' }
}

function getProgress(startsAt: string, expiresAt: string): number {
  const start = new Date(startsAt).getTime()
  const end   = new Date(expiresAt).getTime()
  const now   = Date.now()
  if (now <= start) return 0
  if (now >= end)   return 100
  return Math.round(((now - start) / (end - start)) * 100)
}

function getSavingsHint(type?: string | null, value?: number | null): string {
  if (!type || !value || value <= 0) return ''
  const t1 = PRICE_TIERS.TIER_1
  if (type === 'fixed') {
    const after = t1 - value
    if (after <= 0) return `ฟรี! เมื่อซื้อ 1 ชิ้น (มูลค่า ฿${t1})`
    const pct = Math.round((value / t1) * 100)
    return `ซื้อ 1 ชิ้น ฿${t1} → ฿${after} (ประหยัด ${pct}%)`
  }
  if (type === 'percent') {
    const after = Math.ceil(t1 * (1 - value / 100))
    return `ซื้อ 1 ชิ้น ฿${t1} → ฿${after} (ลด ${value}%)`
  }
  return ''
}

export function PromoCodeBanner({ promo }: { promo: PromoData }) {
  const [copied, setCopied] = useState(false)
  const [countdown, setCountdown] = useState(() => getCountdown(promo.expires_at))
  const [progress,  setProgress]  = useState(() => getProgress(promo.starts_at, promo.expires_at))

  const isExpired = countdown.value === 0
  const isUrgent  = countdown.unit === 'hours'

  const slotsLeft = (promo.max_uses != null && promo.used_count != null)
    ? promo.max_uses - promo.used_count
    : null

  const savingsHint = getSavingsHint(promo.discount_type, promo.discount_value)

  useEffect(() => {
    const t = setInterval(() => {
      setCountdown(getCountdown(promo.expires_at))
      setProgress(getProgress(promo.starts_at, promo.expires_at))
    }, 30_000)
    return () => clearInterval(t)
  }, [promo.expires_at, promo.starts_at])

  function handleCopy() {
    navigator.clipboard.writeText(promo.code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (isExpired && promo.comeback_text) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-5 py-4 shadow-sm">
        <p className="text-xs font-black text-neutral-400 mb-2">🏷️ โค้ดส่วนลด</p>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-black text-neutral-300 line-through">{promo.code}</span>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
            🔜 กลับมาใหม่ {promo.comeback_text}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-xl border shadow-sm px-5 py-4 transition-colors ${
      isUrgent ? 'border-rose-300 bg-rose-50' : 'border-rose-200 bg-white'
    }`}>

      {/* Header */}
      <p className="text-xs font-black text-rose-400 mb-3">🏷️ โค้ดส่วนลด</p>

      {/* Label — big, centered, blinking */}
      <div className="flex justify-center mb-3">
        <div className="promo-blink rounded-xl bg-rose-500 px-5 py-2.5 shadow-md text-center">
          <p className="text-base font-black text-white tracking-wide leading-tight">
            🔥 {promo.label} 🔥
          </p>
        </div>
      </div>

      {/* Savings hint */}
      {savingsHint && (
        <p className="text-center text-xs font-semibold text-rose-600 mb-2">{savingsHint}</p>
      )}

      {/* Progress bar */}
      <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          className={`h-full rounded-full transition-all ${isUrgent ? 'bg-rose-400' : 'bg-rose-300'}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Countdown + slots */}
      <div className="flex items-center justify-between mb-3">
        <p className={`text-xs font-bold ${isUrgent ? 'text-rose-600' : 'text-neutral-400'}`}>
          {isUrgent ? '⏰' : '🗓️'} หมดใน {countdown.value} {countdown.unit === 'hours' ? 'ชั่วโมง' : 'วัน'}
          {isUrgent && <span className="ml-1 animate-pulse">⚠️</span>}
        </p>
        {slotsLeft !== null && slotsLeft > 0 && (
          <p className="text-[11px] font-semibold text-neutral-400">เหลือ {slotsLeft} สิทธิ์</p>
        )}
      </div>

      {/* Code centered + copy */}
      <div className="flex items-center justify-center gap-2">
        <span className="font-mono text-sm font-black text-neutral-900 tracking-widest">
          {promo.code}
        </span>
        <button
          onClick={handleCopy}
          className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-black transition ${
            copied
              ? 'bg-emerald-100 text-emerald-700'
              : 'border border-neutral-200 bg-white text-neutral-600 hover:border-rose-300 hover:text-rose-600'
          }`}
        >
          {copied ? '✓ คัดลอกแล้ว' : 'คัดลอก'}
        </button>
      </div>

    </div>
  )
}

export function PromoCodeBannerPlaceholder() {
  return (
    <div className="rounded-xl border border-amber-200 bg-white px-5 py-4 shadow-sm flex items-center justify-center">
      <p className="text-sm font-black text-neutral-300 text-center">
        🏷️ โค้ดส่วนลด<br />
        <span className="text-xs font-medium">เร็วๆ นี้</span>
      </p>
    </div>
  )
}
