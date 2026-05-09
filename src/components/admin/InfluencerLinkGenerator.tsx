'use client'

// POSTLIVE-33: Client-side sub_id generator + copy-to-clipboard widget

import { useState } from 'react'
import { buildInfluencerSubId } from '@/lib/influencer-subid-utils'

export function InfluencerLinkGenerator() {
  const [handle, setHandle]     = useState('')
  const [productId, setProductId] = useState('')
  const [copied, setCopied]     = useState(false)

  const slug   = buildInfluencerSubId(handle)
  const subId  = handle.trim() ? slug : ''

  const link = subId
    ? productId.trim()
      ? `https://couponkum.com/go/${productId.trim()}?sub_id=${encodeURIComponent(subId)}&source=influencer`
      : `https://couponkum.com/search?q=%E0%B8%94%E0%B8%B5%E0%B8%A5&sub_id=${encodeURIComponent(subId)}&source=influencer`
    : ''

  async function copyLink() {
    if (!link) return
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-4">
      <p className="text-sm font-black text-neutral-700 uppercase tracking-wider">สร้างลิงก์ Influencer</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-xs font-bold text-neutral-500">ชื่อ / Handle</span>
          <input
            value={handle}
            onChange={e => setHandle(e.target.value)}
            placeholder="e.g. techreviewer"
            className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm font-mono focus:border-orange-400 focus:outline-none"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-xs font-bold text-neutral-500">Product UUID (optional)</span>
          <input
            value={productId}
            onChange={e => setProductId(e.target.value)}
            placeholder="UUID ของสินค้า (ไม่บังคับ)"
            className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm font-mono focus:border-orange-400 focus:outline-none"
          />
        </label>
      </div>

      {subId && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2">
            <span className="text-[11px] font-bold text-neutral-400 shrink-0">sub_id:</span>
            <span className="font-mono text-sm text-neutral-900 break-all">{subId}</span>
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-neutral-50 px-3 py-2">
            <span className="text-[11px] font-bold text-neutral-400 shrink-0 pt-0.5">link:</span>
            <span className="font-mono text-xs text-neutral-700 break-all flex-1">{link}</span>
          </div>

          <button
            onClick={copyLink}
            className={`w-full rounded-xl py-2.5 text-sm font-black transition active:scale-95 ${
              copied
                ? 'bg-green-500 text-white'
                : 'bg-orange-500 text-white hover:bg-orange-600'
            }`}
          >
            {copied ? '✓ คัดลอกแล้ว!' : 'คัดลอกลิงก์'}
          </button>
        </div>
      )}
    </div>
  )
}
