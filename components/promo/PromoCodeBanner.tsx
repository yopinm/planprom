'use client'

import { useState, useEffect } from 'react'

export interface PromoData {
  code: string
  label: string
  expires_at: string
  comeback_text?: string | null
}

function getCountdown(expiresAt: string): { value: number; unit: 'hours' | 'days' } {
  const diffMs = new Date(expiresAt).getTime() - Date.now()
  if (diffMs <= 0) return { value: 0, unit: 'hours' }
  const diffHours = diffMs / (1000 * 60 * 60)
  if (diffHours < 24) return { value: Math.max(1, Math.ceil(diffHours)), unit: 'hours' }
  return { value: Math.ceil(diffHours / 24), unit: 'days' }
}

export function PromoCodeBanner({ promo }: { promo: PromoData }) {
  const [copied, setCopied] = useState(false)
  const [countdown, setCountdown] = useState(() => getCountdown(promo.expires_at))

  const isExpired  = countdown.value === 0
  const isUrgent   = countdown.unit === 'hours'

  useEffect(() => {
    const t = setInterval(() => setCountdown(getCountdown(promo.expires_at)), 30_000)
    return () => clearInterval(t)
  }, [promo.expires_at])

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
      <div className="flex justify-center mb-4">
        <div className="promo-blink rounded-xl bg-rose-500 px-5 py-2.5 shadow-md text-center">
          <p className="text-base font-black text-white tracking-wide leading-tight">
            🔥 {promo.label} 🔥
          </p>
        </div>
      </div>

      {/* Countdown — อยู่ใต้ label */}
      <p className={`text-center text-xs font-bold mb-3 ${isUrgent ? 'text-rose-600' : 'text-neutral-400'}`}>
        {isUrgent ? '⏰' : '🗓️'} หมดใน {countdown.value} {countdown.unit === 'hours' ? 'ชั่วโมง' : 'วัน'}
        {isUrgent && <span className="ml-1 animate-pulse">⚠️</span>}
      </p>

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
