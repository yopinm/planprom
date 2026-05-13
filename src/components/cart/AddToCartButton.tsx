'use client'

import { useState } from 'react'

interface Props {
  templateId:      string
  isRequestOnly?:  boolean
  className?:      string
}

export default function AddToCartButton({ templateId, isRequestOnly, className }: Props) {
  const [loading,    setLoading]    = useState(false)
  const [added,      setAdded]      = useState(false)
  const [unlockCode, setUnlockCode] = useState('')
  const [error,      setError]      = useState('')

  async function handleAdd() {
    if (loading || added) return
    setLoading(true)
    setError('')
    try {
      const body: Record<string, string> = { templateId }
      if (isRequestOnly) body.unlockCode = unlockCode.trim().toUpperCase()

      const res  = await fetch('/api/cart/add', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      const json = await res.json() as { error?: string }
      if (!res.ok) { setError(json.error ?? 'เกิดข้อผิดพลาด'); return }
      setAdded(true)
      window.dispatchEvent(new Event('cart-updated'))
    } finally {
      setLoading(false)
    }
  }

  if (isRequestOnly) {
    if (added) return <span className="text-sm font-bold text-emerald-600">✓ ในตะกร้าแล้ว</span>
    return (
      <div className="space-y-1">
        <div className="flex gap-1">
          <input
            value={unlockCode}
            onChange={e => setUnlockCode(e.target.value)}
            placeholder="Unlock Code"
            className="w-full rounded border border-neutral-300 px-2 py-1 text-xs font-mono uppercase tracking-widest"
          />
          <button
            onClick={handleAdd}
            disabled={loading || !unlockCode.trim()}
            className="shrink-0 rounded bg-amber-500 px-3 py-1 text-xs font-bold text-white transition hover:bg-amber-600 disabled:opacity-40"
          >
            {loading ? '…' : '🔓'}
          </button>
        </div>
        {error && <p className="text-[10px] text-red-500">{error}</p>}
      </div>
    )
  }

  return (
    <button
      onClick={handleAdd}
      disabled={loading || added}
      className={className ?? 'px-4 py-2 rounded bg-indigo-600 text-white text-sm font-medium disabled:opacity-60 hover:bg-indigo-700 transition-colors'}
    >
      {loading ? 'กำลังเพิ่ม…' : added ? '✓ ในตะกร้าแล้ว' : 'หยิบใส่ตะกร้า'}
    </button>
  )
}
