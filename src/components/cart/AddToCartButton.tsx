'use client'

import { useState } from 'react'

interface Props {
  templateId: string
  className?: string
}

export default function AddToCartButton({ templateId, className }: Props) {
  const [loading, setLoading] = useState(false)
  const [added, setAdded] = useState(false)

  async function handleAdd() {
    if (loading || added) return
    setLoading(true)
    try {
      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId }),
      })
      if (res.ok) {
        setAdded(true)
        // Update header badge immediately without full page refresh
        window.dispatchEvent(new Event('cart-updated'))
      }
    } finally {
      setLoading(false)
    }
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
