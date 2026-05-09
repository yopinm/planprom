'use client'

// PriceDropBadge — POSTLIVE-29
// Client component: records view in localStorage on mount and shows a badge
// when effectiveNet has dropped since the product was first seen.

import type { ReactElement } from 'react'
import { useEffect, useState } from 'react'
import { recordView, getPriceDrop } from '@/lib/viewed-products'

interface Props {
  id: string
  currentPrice: number
  name: string
}

export function PriceDropBadge({ id, currentPrice, name }: Props): ReactElement | null {
  // Lazy initializer — reads localStorage on first client render; null on SSR
  const [prevPrice] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null
    return getPriceDrop(id, currentPrice)
  })

  useEffect(() => {
    // Record view after render — no setState, just a side-effect write
    recordView(id, currentPrice, name)
  }, [id, currentPrice, name])

  if (prevPrice === null) return null

  const drop = Math.round(prevPrice - currentPrice)
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-black text-green-700">
      ↓ ราคาลดแล้ว {drop.toLocaleString('th-TH')} บาท
    </span>
  )
}
