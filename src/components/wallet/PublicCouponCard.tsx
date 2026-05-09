'use client'

// WALLET-PUB-1: individual coupon card — masked code, tap to reveal + auto-copy
// LIVECPN-5: lastUsedAt signal + 1-click report → re-verify

import { useState } from 'react'
import type { PublicCoupon } from '@/lib/public-wallet'

function discountLabel(c: PublicCoupon): string {
  if (c.discountType === 'percent' || c.discountType === 'cashback')
    return `${c.discountType === 'cashback' ? 'คืน' : 'ลด'} ${c.discountValue}%`
  if (c.discountType === 'fixed')
    return `ลด ฿${c.discountValue.toLocaleString('th-TH')}`
  return 'ฟรีค่าส่ง'
}

function lastUsedLabel(lastUsedAt: string | null): string | null {
  if (!lastUsedAt) return null
  const diffMs = Date.now() - new Date(lastUsedAt).getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return 'ใช้เมื่อกี้'
  if (diffMin < 60) return `ใช้ล่าสุด ${diffMin} นาทีที่แล้ว`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `ใช้ล่าสุด ${diffH} ชม.ที่แล้ว`
  const diffD = Math.floor(diffH / 24)
  if (diffD <= 7) return `ใช้ล่าสุด ${diffD} วันที่แล้ว`
  return null
}

function verifiedLabel(verifiedAt: string | null): string | null {
  if (!verifiedAt) return null
  const diffMs = Date.now() - new Date(verifiedAt).getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return 'เพิ่งยืนยัน'
  if (diffMin < 60) return `ยืนยันแล้ว ${diffMin} นาทีที่แล้ว`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 48) return `ยืนยันแล้ว ${diffH} ชม.ที่แล้ว`
  return null
}

function platformLabel(p: string): string {
  if (p === 'shopee') return 'Shopee'
  if (p === 'lazada') return 'Lazada'
  return p
}

export function PublicCouponCard({ coupon, campaign }: {
  coupon: PublicCoupon
  campaign: 'urgent' | 'warm' | 'normal'
}) {
  const [revealed,  setRevealed]  = useState(false)
  const [copied,    setCopied]    = useState(false)
  const [reported,  setReported]  = useState(false)

  const maskedCode = coupon.code.length > 4
    ? coupon.code.slice(0, 3) + '•'.repeat(Math.min(coupon.code.length - 3, 5))
    : '••••'

  async function handleReveal() {
    if (!revealed) { setRevealed(true); return }
    try {
      await navigator.clipboard.writeText(coupon.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2_000)
    } catch {}
    fetch('/api/daily-coupon/reveal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coupon_id: coupon.id, date: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' }) }),
    }).catch(() => {})
  }

  const isUrgent = campaign === 'urgent'
  const isWarm   = campaign === 'warm'

  const cardBase = isUrgent
    ? 'border-red-700 bg-neutral-950 text-white'
    : isWarm
    ? 'border-orange-300 bg-orange-50'
    : 'border-neutral-200 bg-white'

  const badgeBase = isUrgent
    ? 'bg-red-600 text-white'
    : isWarm
    ? 'bg-orange-500 text-white'
    : 'bg-orange-100 text-orange-700'

  const btnBase = isUrgent
    ? 'bg-red-600 hover:bg-red-700 text-white'
    : 'bg-orange-600 hover:bg-orange-700 text-white'

  const subtitleColor = isUrgent ? 'text-neutral-400' : 'text-neutral-500'
  const titleColor    = isUrgent ? 'text-white'       : 'text-neutral-900'

  return (
    <div className={`relative rounded-2xl border p-4 transition ${cardBase}`}>
      {coupon.isFeatured && (
        <span className="absolute -top-2.5 left-4 rounded-full bg-amber-400 px-2.5 py-0.5 text-[10px] font-black text-black uppercase tracking-widest">
          ⭐ วันนี้แนะนำ
        </span>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${badgeBase}`}>
              {platformLabel(coupon.platform)}
            </span>
            <span className={`text-[11px] font-bold ${isUrgent ? 'text-red-400' : 'text-orange-600'}`}>
              {discountLabel(coupon)}
            </span>
          </div>
          <p className={`text-sm font-bold leading-snug line-clamp-2 ${titleColor}`}>
            {coupon.title}
          </p>
          {coupon.minSpend > 0 && (
            <p className={`mt-0.5 text-[11px] ${subtitleColor}`}>
              ขั้นต่ำ ฿{coupon.minSpend.toLocaleString('th-TH')}
            </p>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            {verifiedLabel(coupon.verifiedAt) && (
              <span className="text-[10px] font-semibold text-green-600">
                ✅ {verifiedLabel(coupon.verifiedAt)}
              </span>
            )}
            {coupon.successRate !== null && coupon.successRate >= 0 && (
              <span className={`text-[10px] font-semibold ${isUrgent ? 'text-neutral-300' : 'text-neutral-500'}`}>
                ใช้ได้ {coupon.successRate.toFixed(0)}%
              </span>
            )}
            {lastUsedLabel(coupon.lastUsedAt) && (
              <span className={`text-[10px] font-semibold ${isUrgent ? 'text-neutral-400' : 'text-neutral-400'}`}>
                🕐 {lastUsedLabel(coupon.lastUsedAt)}
              </span>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={handleReveal}
        className={`mt-3 flex w-full items-center justify-between rounded-xl px-4 py-2.5 transition active:scale-95 ${btnBase}`}
      >
        <span className="font-mono text-sm font-black tracking-widest">
          {revealed ? coupon.code : maskedCode}
        </span>
        <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-black">
          {!revealed ? 'เปิดโค้ด' : copied ? 'คัดลอกแล้ว ✓' : 'คัดลอก'}
        </span>
      </button>

      {revealed && (
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            disabled={reported}
            onClick={() => {
              if (reported) return
              setReported(true)
              fetch('/api/coupon-vote/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ coupon_id: coupon.id }),
              }).catch(() => {})
            }}
            className="text-[10px] text-neutral-400 hover:text-red-500 disabled:opacity-50 transition"
          >
            {reported ? 'รายงานแล้ว ✓' : '⚑ โค้ดใช้ไม่ได้?'}
          </button>
        </div>
      )}
    </div>
  )
}
