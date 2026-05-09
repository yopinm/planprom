'use client'

// POSTLIVE-32: Savings Calculator Export Widget — Share-to-Unlock
// Shows a shareable savings card on the product page.
// Clicking a share button (LINE/FB) reveals a "linked" confirmation
// and sub_id share_widget_YYYYMMDD is embedded in the shared affiliate link
// for last-click attribution when the friend buys.

import { useState } from 'react'

interface Props {
  productId: string
  productName: string
  platform: string
  priceCurrent: number
  priceOriginal: number | null | undefined
  shareSubId: string  // e.g. "share_widget_20260504"
}

const PLATFORM_TIP: Record<string, string> = {
  shopee: 'ใช้ฟิลเตอร์ "ส่งฟรี" + เพิ่มในตะกร้าตอนนี้ กดซื้อตอน Flash Sale ราคาดีขึ้นอีก',
  lazada: 'กด Wishlist ไว้ก่อน แล้วรอ Lazada Flash Sale ราคาจะลดลงได้ถึง 30%',
}

export function SavingsShareWidget({
  productId,
  productName,
  platform,
  priceCurrent,
  priceOriginal,
  shareSubId,
}: Props) {
  const [shared, setShared] = useState(false)

  const saving = priceOriginal && priceOriginal > priceCurrent
    ? priceOriginal - priceCurrent
    : 0

  const shareUrl = `https://couponkum.com/go/${productId}?sub_id=${encodeURIComponent(shareSubId)}&source=share_widget`
  const shareText = `เจอดีล ${productName} ราคา ฿${priceCurrent.toLocaleString()} บน คูปองคุ้ม${saving > 0 ? ` ประหยัดได้ ฿${saving.toLocaleString()}` : ''} →`

  const lineShareUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText + ' ')}`
  const fbShareUrl   = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`

  function handleShare(channel: 'line' | 'fb') {
    const url = channel === 'line' ? lineShareUrl : fbShareUrl
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=500')
    setShared(true)
  }

  const tip = PLATFORM_TIP[platform] ?? PLATFORM_TIP['shopee']

  return (
    <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
      <p className="text-[11px] font-black uppercase tracking-widest text-orange-600">
        แชร์ดีลนี้
      </p>

      {/* Savings summary */}
      <div className="mt-2 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-neutral-900 line-clamp-1">{productName}</p>
          <p className="text-base font-black text-orange-600">
            ฿{priceCurrent.toLocaleString()}
            {saving > 0 && (
              <span className="ml-2 text-sm font-bold text-green-600">
                ประหยัด ฿{saving.toLocaleString()}
              </span>
            )}
          </p>
        </div>
      </div>

      {!shared ? (
        <>
          {/* Lock hint */}
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-dashed border-orange-300 bg-white px-3 py-2">
            <span className="text-base">🔒</span>
            <p className="text-xs font-bold text-neutral-600">
              แชร์ให้เพื่อน 1 คน — ปลดล็อกเคล็ดลับประหยัดเพิ่ม
            </p>
          </div>

          {/* Share buttons */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => handleShare('line')}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-[#06C755] px-3 py-2.5 text-xs font-black text-white transition hover:bg-[#05b04c] active:scale-95"
            >
              💬 แชร์ทาง LINE
            </button>
            <button
              onClick={() => handleShare('fb')}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-[#1877F2] px-3 py-2.5 text-xs font-black text-white transition hover:bg-[#1464d0] active:scale-95"
            >
              📘 แชร์ทาง Facebook
            </button>
          </div>
        </>
      ) : (
        /* Unlocked tip */
        <div className="mt-3 rounded-xl border border-green-200 bg-green-50 px-3 py-3">
          <p className="text-xs font-black text-green-700">✓ แชร์แล้ว! เคล็ดลับพิเศษ</p>
          <p className="mt-1 text-xs leading-5 text-green-800">{tip}</p>
          <p className="mt-2 text-[10px] text-green-600 font-medium">
            เพื่อนที่คลิกลิงก์ของคุณจะได้รับดีลเดียวกัน — ขอบคุณที่แชร์!
          </p>
        </div>
      )}
    </div>
  )
}
