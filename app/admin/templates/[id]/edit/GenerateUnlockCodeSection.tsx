'use client'

import { useState } from 'react'

export function GenerateUnlockCodeSection({ templateId }: { templateId: string }) {
  const [code,    setCode]    = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied,  setCopied]  = useState(false)

  async function generate() {
    setLoading(true)
    try {
      const res  = await fetch(`/api/admin/templates/${templateId}/unlock-code`, { method: 'POST' })
      const json = await res.json() as { code?: string; error?: string }
      if (json.code) setCode(json.code)
    } finally {
      setLoading(false)
    }
  }

  function copy() {
    if (!code) return
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mt-6 rounded-3xl border border-amber-300 bg-amber-50 p-5">
      <p className="text-[11px] font-black uppercase tracking-widest text-amber-600 mb-1">Unlock Code — J13</p>
      <p className="text-sm text-neutral-600 mb-4">สร้าง code 1-time (หมดอายุ 30 วัน) แล้วส่งให้ลูกค้าทาง LINE</p>
      {code ? (
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-white border border-amber-300 px-4 py-2 font-mono text-lg font-black tracking-widest text-amber-800">
            {code}
          </span>
          <button
            onClick={copy}
            className="rounded-lg border border-amber-300 px-3 py-2 text-sm font-bold text-amber-700 hover:bg-amber-100 transition"
          >
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
          <button
            onClick={() => { setCode(null); setCopied(false) }}
            className="text-xs text-neutral-400 hover:text-neutral-600"
          >
            สร้างใหม่
          </button>
        </div>
      ) : (
        <button
          onClick={generate}
          disabled={loading}
          className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-black text-white transition hover:bg-amber-600 disabled:opacity-50"
        >
          {loading ? 'กำลังสร้าง…' : '🔑 สร้าง Unlock Code'}
        </button>
      )}
    </div>
  )
}
