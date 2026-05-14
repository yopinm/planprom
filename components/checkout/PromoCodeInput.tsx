'use client'

import { useState } from 'react'

interface Props {
  cartTotal: number
  paidItemCount: number
  onApply: (discountApplied: number, codeText: string, label: string) => void
  onRemove: () => void
  appliedCode: string | null
  appliedDiscount?: number
}

export function PromoCodeInput({ cartTotal, paidItemCount, onApply, onRemove, appliedCode, appliedDiscount = 0 }: Props) {
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handleApply() {
    const code = input.trim().toUpperCase()
    if (!code) return
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, cart_total: cartTotal, paid_item_count: paidItemCount }),
      })
      const json = await res.json() as {
        valid?: boolean; discount_applied?: number; code_text?: string; label?: string; error?: string
      }
      if (json.error || !json.valid) {
        setError(json.error ?? 'โค้ดไม่ถูกต้อง')
      } else {
        onApply(json.discount_applied!, json.code_text!, json.label!)
        setInput('')
      }
    } catch {
      setError('เกิดข้อผิดพลาด — กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  if (appliedCode) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-emerald-700 font-bold">🏷️ {appliedCode}</span>
          {appliedDiscount > 0 && (
            <span className="animate-pulse rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-black text-white">
              -฿{appliedDiscount}
            </span>
          )}
        </div>
        <button onClick={onRemove} className="text-xs text-neutral-400 hover:text-red-500 transition">ลบโค้ด</button>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => { setInput(e.target.value.toUpperCase()); setError('') }}
          onKeyDown={e => e.key === 'Enter' && handleApply()}
          placeholder="โค้ดส่วนลด"
          className="flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-mono uppercase outline-none focus:border-amber-400 focus:bg-white transition"
        />
        <button
          onClick={handleApply}
          disabled={loading || !input.trim()}
          className="rounded-xl bg-neutral-800 px-4 py-2 text-sm font-bold text-white transition hover:bg-black disabled:opacity-50"
        >
          {loading ? '…' : 'ใช้โค้ด'}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
