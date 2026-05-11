'use client'

import { useState, useEffect } from 'react'

export interface PromoData {
  code: string
  label: string
  expires_at: string
}

function getDaysLeft(expiresAt: string): number {
  const diff = new Date(expiresAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function PromoCodeBanner({ promo }: { promo: PromoData }) {
  const [copied, setCopied] = useState(false)
  const [daysLeft, setDaysLeft] = useState(() => getDaysLeft(promo.expires_at))

  useEffect(() => {
    const t = setInterval(() => setDaysLeft(getDaysLeft(promo.expires_at)), 60_000)
    return () => clearInterval(t)
  }, [promo.expires_at])

  function handleCopy() {
    navigator.clipboard.writeText(promo.code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="rounded-xl border border-rose-200 bg-white px-5 py-4 shadow-sm">
      <p className="text-sm font-black text-rose-500 mb-3">
        🏷️ โค้ดส่วนลด
        <span className="ml-2 text-xs font-medium text-rose-300">· {promo.label}</span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-sm font-black text-neutral-900 flex-1 min-w-0 truncate">
          {promo.code}
        </span>
        <button
          onClick={handleCopy}
          className={`shrink-0 rounded-lg px-3 py-1 text-xs font-black transition ${
            copied
              ? 'bg-emerald-100 text-emerald-700'
              : 'border border-neutral-200 text-neutral-600 hover:border-neutral-400'
          }`}
        >
          {copied ? '✓ คัดลอกแล้ว' : 'คัดลอก'}
        </button>
        <span className="shrink-0 text-xs text-neutral-400">
          หมดใน {daysLeft} วัน
        </span>
      </div>
    </div>
  )
}

export function PromoCodeBannerPlaceholder() {
  return (
    <div className="rounded-xl border border-amber-200 bg-white px-5 py-4 shadow-sm flex items-center justify-center">
      <p className="text-sm font-black text-neutral-300">
        🏷️ โค้ดส่วนลด<br />
        <span className="text-xs font-medium">เร็วๆ นี้</span>
      </p>
    </div>
  )
}
