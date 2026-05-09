'use client'

import { useState, useCallback, useEffect } from 'react'
import { track } from '@/lib/analytics-client'

interface CouponCTAButtonProps {
  goUrl: string
  couponCode: string | null
  isBestDeal: boolean
  variantName?: string
}

type CTAState = 'idle' | 'copied' | 'going'

export function CouponCTAButton({ goUrl, couponCode, isBestDeal, variantName = 'product_cta' }: CouponCTAButtonProps) {
  const [state, setState] = useState<CTAState>('idle')

  useEffect(() => {
    track('cta_impression', { variant_name: variantName, has_coupon: Boolean(couponCode) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleClick = useCallback(async () => {
    if (state !== 'idle') return

    track('cta_click', { variant_name: variantName, has_coupon: Boolean(couponCode) })

    if (!couponCode) {
      window.location.href = goUrl
      return
    }

    try {
      await navigator.clipboard.writeText(couponCode)
    } catch {
      const el = document.createElement('textarea')
      el.value = couponCode
      el.style.cssText = 'position:absolute;left:-9999px'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }

    setState('copied')
    setTimeout(() => {
      setState('going')
      window.location.href = goUrl
    }, 1200)
  }, [state, couponCode, goUrl, variantName])

  const baseCls = `mt-4 flex w-full items-center justify-center rounded-2xl px-6 py-4 text-sm font-black text-white shadow-sm transition active:scale-[0.98]`

  if (state === 'copied') {
    return (
      <button disabled className={`${baseCls} bg-green-600 cursor-default`}>
        ✓ คัดลอกโค้ดแล้ว! อย่าลืมวางโค้ดก่อนจ่าย 🎁
      </button>
    )
  }

  if (state === 'going') {
    return (
      <button disabled className={`${baseCls} bg-orange-600 opacity-75 cursor-default`}>
        กำลังพาไป...
      </button>
    )
  }

  const idleLabel = couponCode
    ? (isBestDeal ? 'คัดลอกโค้ด + รับดีลคุ้มสุด' : 'คัดลอกโค้ด + ดูดีล')
    : (isBestDeal ? 'รับดีลคุ้มสุด' : 'ดูดีล')

  return (
    <button
      onClick={handleClick}
      className={`${baseCls} ${isBestDeal ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'}`}
    >
      {idleLabel} →
    </button>
  )
}
