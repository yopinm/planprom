'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { CartData } from '@/lib/cart'
import { itemsUntilNextTier, calculateCartTotal } from '@/lib/pricing'

export default function CartPage() {
  const [cart, setCart] = useState<CartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/cart')
      .then(r => r.ok ? r.json() as Promise<CartData> : null)
      .then(data => {
        if (cancelled) return
        setCart(data)
        setLoading(false)
      })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  async function removeItem(templateId: string) {
    setRemoving(templateId)
    const res = await fetch('/api/cart/remove', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateId }),
    })
    if (res.ok) setCart(await res.json())
    setRemoving(null)
  }

  if (loading) return <div className="p-8 text-center text-gray-400">กำลังโหลด…</div>
  if (!cart || cart.items.length === 0) return (
    <div className="p-8 text-center">
      <p className="text-gray-500 mb-4">ตะกร้าว่างเปล่า</p>
      <Link href="/templates" className="text-indigo-600 underline">เลือกเทมเพลต</Link>
    </div>
  )

  const { items, totals } = cart
  const hasRequest   = items.some(i => i.isRequestOnly)
  const normalPaid   = items.filter(i => !i.isRequestOnly && i.tier !== 'free')
  const freeItems    = items.filter(i => i.tier === 'free')
  const until = hasRequest ? null : itemsUntilNextTier(totals.paidItemCount)

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">ตะกร้าสินค้า</h1>

      {/* Tier progress bar — ซ่อนเมื่อมี request-only item */}
      {!hasRequest && until !== null && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-sm text-indigo-700">
          เพิ่มอีก <strong>{until} ชิ้น</strong> ลดเหลือ <strong>฿{totals.nextItemPrice}/ชิ้น</strong>
        </div>
      )}
      {!hasRequest && until === null && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
          คุ้มสุด! ราคา <strong>฿7/ชิ้น</strong> สำหรับทุกชิ้นถัดไป
        </div>
      )}

      {/* Item list */}
      <ul className="divide-y divide-gray-100">
        {items.map(item => {
          const normalIdx = normalPaid.indexOf(item)
          const unitPrice = item.tier === 'free' ? 0
            : item.isRequestOnly ? item.priceBaht
            : calculateCartTotal(normalIdx + 1).total - calculateCartTotal(normalIdx).total
          return (
          <li key={item.cartItemId} className="flex items-center gap-3 py-3">
            {item.thumbnailPath ? (
              <Image src={item.thumbnailPath} alt={item.title} width={56} height={56} className="rounded object-cover" />
            ) : (
              <div className="w-14 h-14 rounded bg-gray-100 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{item.title}</p>
              <p className="text-xs text-gray-400">
                {item.tier === 'free' ? 'เทมเพลตฟรี'
                  : item.isRequestOnly ? '🔒 Request พิเศษ'
                  : 'เทมเพลตมาตรฐาน'}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              {item.tier === 'free' ? (
                <span className="text-green-600 text-sm font-semibold">ฟรี</span>
              ) : (
                <span className="text-gray-700 text-sm font-semibold">฿{unitPrice}</span>
              )}
            </div>
            <button
              onClick={() => removeItem(item.templateId)}
              disabled={removing === item.templateId}
              className="text-gray-300 hover:text-red-400 text-lg leading-none disabled:opacity-40 ml-1"
              aria-label="ลบ"
            >
              ×
            </button>
          </li>
          )
        })}
      </ul>

      {/* Totals */}
      <div className="border-t pt-4 space-y-1 text-sm">
        {freeItems.length > 0 && (
          <div className="flex justify-between text-green-600">
            <span>เทมเพลตฟรี ({freeItems.length} ชิ้น)</span>
            <span>฿0</span>
          </div>
        )}
        {totals.savedVsFullPrice > 0 && (
          <div className="flex justify-between text-indigo-600">
            <span>ประหยัดกว่าซื้อแยก</span>
            <span>-฿{totals.savedVsFullPrice}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-base pt-1">
          <span>รวม</span>
          <span>฿{totals.total}</span>
        </div>
      </div>

      {/* Checkout CTA */}
      <Link
        href="/checkout"
        className="block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-colors"
      >
        ดำเนินการชำระเงิน ฿{totals.total}
      </Link>
    </main>
  )
}
