// WALLET-CLEAN: ลบออกถาวร 2026-05-17
'use client'

import { useState } from 'react'

export function AddCouponForm() {
  const [open,    setOpen]    = useState(false)
  const [code,    setCode]    = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return
    setError(null)
    setLoading(true)

    const res = await fetch('/api/wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: trimmed }),
    })

    setLoading(false)

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setError((json as { error?: string }).error ?? 'เกิดข้อผิดพลาด')
      return
    }

    setCode('')
    setSuccess(true)
    setTimeout(() => { setSuccess(false); setOpen(false) }, 1200)
    window.location.reload()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-orange-300 bg-orange-50 py-4 text-sm font-bold text-orange-600 transition hover:bg-orange-100"
      >
        <span className="text-lg">+</span> เพิ่มคูปองใหม่
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
      <p className="mb-3 text-sm font-black text-neutral-800">เพิ่มคูปองใหม่</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          placeholder="โค้ดคูปอง เช่น SHOPEE50"
          required
          autoFocus
          className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 font-mono text-sm font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="shrink-0 rounded-xl bg-black px-4 py-2.5 text-sm font-black text-white transition hover:bg-orange-600 disabled:opacity-40"
        >
          {loading ? '...' : success ? '✓' : 'บันทึก'}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setCode(''); setError(null) }}
          className="shrink-0 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold text-neutral-500 transition hover:bg-neutral-50"
        >
          ยกเลิก
        </button>
      </div>
      {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
    </form>
  )
}
