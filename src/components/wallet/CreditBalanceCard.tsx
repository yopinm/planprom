// WALLET-CLEAN: ลบออกถาวร 2026-05-17
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Props {
  credits: number
  expiresAt: string | null   // ISO string of earliest active expiry, or null
}

export function CreditBalanceCard({ credits, expiresAt }: Props) {
  const [reminded, setReminded] = useState<boolean | null>(null)   // null = loading
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    fetch('/api/pack-credits/remind')
      .then(r => r.ok ? (r.json() as Promise<{ set: boolean }>) : null)
      .then(data => setReminded(data?.set ?? false))
      .catch(() => setReminded(false))
  }, [])

  async function handleRemind() {
    setLoading(true)
    try {
      const res = await fetch('/api/pack-credits/remind', { method: 'POST' })
      if (res.ok) setReminded(true)
    } finally {
      setLoading(false)
    }
  }

  const expiryLabel = expiresAt
    ? new Date(expiresAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 space-y-3">
      {/* Balance row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide">เครดิตเลือกเทมเพลตคงเหลือ</p>
          <p className="mt-0.5 text-3xl font-black text-emerald-900 leading-none">
            {credits}
            <span className="ml-1.5 text-base font-semibold text-emerald-700">ชิ้น</span>
          </p>
          {expiryLabel && (
            <p className="mt-1 text-xs text-emerald-600">หมดอายุ {expiryLabel}</p>
          )}
        </div>
        <span className="text-4xl select-none">🎫</span>
      </div>

      {/* Use credits CTA */}
      <Link
        href="/templates"
        className="flex items-center justify-center gap-2 w-full rounded-xl bg-amber-500 hover:bg-amber-600 py-2.5 text-sm font-black text-white transition"
      >
        🎫 ใช้เครดิต · เลือกเทมเพลต
      </Link>

      {/* Reminder button */}
      {reminded === null ? null : reminded ? (
        <div className="flex items-center gap-2 rounded-xl bg-white border border-emerald-200 px-3 py-2 text-xs text-emerald-700 font-medium">
          <span>✅</span>
          <span>ตั้งเตือนแล้ว — LINE จะแจ้งคุณพรุ่งนี้ 09:00</span>
        </div>
      ) : (
        <button
          onClick={handleRemind}
          disabled={loading}
          className="w-full rounded-xl bg-emerald-500 py-2 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:opacity-60"
        >
          {loading ? 'กำลังตั้งเตือน…' : '🔔 แจ้งเตือนผ่าน LINE พรุ่งนี้ 09:00'}
        </button>
      )}
    </div>
  )
}
