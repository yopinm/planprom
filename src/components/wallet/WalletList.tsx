'use client'
// WalletList — renders saved coupons with remove button
// TASK 2.7

import { useState, useTransition } from 'react'
import type { CouponWallet } from '@/types'

interface WalletListProps {
  coupons: CouponWallet[]
  nearExpiryIds: Set<string>
}

function formatExpiry(expire_at: string | null): { label: string; urgent: boolean } {
  if (!expire_at) return { label: 'ไม่มีวันหมดอายุ', urgent: false }
  const diffMs  = new Date(expire_at).getTime() - Date.now()
  const diffMin = Math.floor(diffMs / 60_000)
  const diffH   = Math.floor(diffMs / 3_600_000)
  if (diffMin <= 0)  return { label: 'หมดอายุแล้ว', urgent: true }
  if (diffMin < 60)  return { label: `ใช้ได้อีก ${diffMin} นาที`, urgent: true }
  if (diffH   < 24)  return { label: `ใช้ได้อีก ${diffH} ชม.`, urgent: diffH < 6 }
  const d = new Date(expire_at)
  return { label: `หมด: ${d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}`, urgent: false }
}

function discountLabel(c: CouponWallet): string {
  switch (c.discount_type) {
    case 'fixed':    return `ลด ฿${c.discount_value.toLocaleString('th-TH')}`
    case 'percent':  return `ลด ${c.discount_value}%`
    case 'shipping': return 'ส่งฟรี'
    case 'cashback': return `แคชแบ็ก ฿${c.discount_value.toLocaleString('th-TH')}`
  }
}

const PLATFORM_BADGE: Record<string, string> = {
  shopee: 'bg-orange-100 text-orange-700',
  lazada: 'bg-blue-100 text-blue-700',
  all:    'bg-neutral-100 text-neutral-600',
}
const PLATFORM_LABEL: Record<string, string> = {
  shopee: 'Shopee',
  lazada: 'Lazada',
  all:    'ทุก Platform',
}

export function WalletList({ coupons: initial, nearExpiryIds }: WalletListProps) {
  const [coupons, setCoupons] = useState(initial)
  const [pending, startTransition] = useTransition()
  const [removingId, setRemovingId] = useState<string | null>(null)

  async function handleRemove(id: string) {
    setRemovingId(id)
    const res = await fetch(`/api/wallet/${id}`, { method: 'DELETE' })
    if (res.ok) {
      startTransition(() => {
        setCoupons(prev => prev.filter(c => c.id !== id))
      })
    }
    setRemovingId(null)
  }

  if (coupons.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-neutral-200 py-10 text-center text-sm text-neutral-400">
        ลบคูปองทั้งหมดแล้ว — เพิ่มใหม่ได้ด้านบน
      </p>
    )
  }

  return (
    <ul className="space-y-3">
      {coupons.map(c => {
        const isNearExpiry = nearExpiryIds.has(c.id)
        return (
          <li
            key={c.id}
            className={`rounded-2xl border p-4 ${
              isNearExpiry
                ? 'border-red-200 bg-red-50'
                : 'border-neutral-200 bg-white'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                {/* Code + discount */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-black px-2.5 py-0.5 font-mono text-sm font-black tracking-wider text-white">
                    {c.code}
                  </span>
                  <span className="text-sm font-bold text-green-700">{discountLabel(c)}</span>
                  {isNearExpiry && (
                    <span className="rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold text-white">
                      หมดเร็ว!
                    </span>
                  )}
                </div>

                <p className="mt-1 text-xs text-neutral-600">{c.title}</p>

                {/* Meta row */}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${PLATFORM_BADGE[c.platform ?? 'all'] ?? PLATFORM_BADGE.all}`}
                  >
                    {PLATFORM_LABEL[c.platform ?? 'all'] ?? 'ทุก Platform'}
                  </span>
                  {c.min_spend > 0 && (
                    <span className="text-[11px] text-neutral-500">
                      ขั้นต่ำ ฿{c.min_spend.toLocaleString('th-TH')}
                    </span>
                  )}
                  {(() => {
                    const { label, urgent } = formatExpiry(c.expire_at)
                    return (
                      <span className={`text-[11px] font-bold ${urgent ? 'text-red-600' : isNearExpiry ? 'text-orange-600' : 'text-neutral-400'}`}>
                        {label}
                      </span>
                    )
                  })()}
                </div>
              </div>

              {/* Remove button only */}
              <button
                onClick={() => handleRemove(c.id)}
                disabled={removingId === c.id || pending}
                aria-label={`ลบคูปอง ${c.code}`}
                className="shrink-0 rounded-xl p-2 text-neutral-300 transition hover:bg-red-50 hover:text-red-400 disabled:opacity-40"
              >
                {removingId === c.id ? (
                  <span className="block h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-600" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
