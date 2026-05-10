// WALLET-CLEAN: ลบออกถาวร 2026-05-17
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PublicCouponCard } from '@/components/wallet/PublicCouponCard'
import type { PublicCoupon } from '@/lib/public-wallet'

type PlatformFilter = 'all' | 'shopee' | 'lazada'

export function TierSection({
  emoji,
  title,
  subtitle,
  coupons,
  showPlatformFilter = false,
}: {
  emoji:               string
  title:               string
  subtitle:            string
  coupons:             PublicCoupon[]
  showPlatformFilter?: boolean
}) {
  const [filter, setFilter] = useState<PlatformFilter>('all')

  const filtered =
    filter === 'all' ? coupons : coupons.filter(c => c.platform === filter)

  return (
    <section>
      <div className="mb-3">
        <h2 className="text-base font-black text-neutral-900">
          {emoji} {title}
          {coupons.length > 0 && (
            <span className="ml-2 text-sm font-semibold text-neutral-400">
              ({coupons.length})
            </span>
          )}
        </h2>
        <p className="text-[12px] text-neutral-500">{subtitle}</p>
      </div>

      {showPlatformFilter && coupons.length > 0 && (
        <div className="mb-3 flex gap-2">
          {(['all', 'shopee', 'lazada'] as PlatformFilter[]).map(p => (
            <button
              key={p}
              onClick={() => setFilter(p)}
              className={`rounded-full px-3 py-1 text-[11px] font-black transition ${
                filter === p
                  ? 'bg-orange-600 text-white'
                  : 'border border-neutral-200 bg-white text-neutral-600 hover:border-orange-300'
              }`}
            >
              {p === 'all' ? 'ทั้งหมด' : p === 'shopee' ? 'Shopee' : 'Lazada'}
            </button>
          ))}
        </div>
      )}

      {coupons.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 py-8 text-center">
          <p className="text-sm text-neutral-400">
            กำลังรวบรวม{title}เพิ่มทุกวัน
          </p>
          <Link
            href="/wallet"
            className="mt-2 inline-block text-xs font-bold text-orange-600 hover:underline"
          >
            ติดตาม LINE OA รับแจ้งเมื่อมีโค้ดใหม่ →
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map(c => (
            <PublicCouponCard key={c.id} coupon={c} campaign="normal" />
          ))}
        </div>
      )}
    </section>
  )
}
