'use client'

import { useState, useEffect } from 'react'

export function GenerateUnlockCodeSection({ templateId }: { templateId: string }) {
  const [code,       setCode]       = useState<string | null>(null)
  const [expiresAt,  setExpiresAt]  = useState<string | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [generating, setGenerating] = useState(false)
  const [copied,     setCopied]     = useState(false)

  useEffect(() => {
    fetch(`/api/admin/templates/${templateId}/unlock-code`)
      .then(r => r.json() as Promise<{ code?: string | null; expiresAt?: string }>)
      .then(json => {
        setCode(json.code ?? null)
        setExpiresAt(json.expiresAt ?? null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [templateId])

  async function generate() {
    setGenerating(true)
    try {
      const res  = await fetch(`/api/admin/templates/${templateId}/unlock-code`, { method: 'POST' })
      const json = await res.json() as { code?: string; expiresAt?: string; error?: string }
      if (json.code) { setCode(json.code); setExpiresAt(json.expiresAt ?? null) }
    } finally {
      setGenerating(false)
    }
  }

  function copy() {
    if (!code) return
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function daysLeft(iso: string | null): string {
    if (!iso) return ''
    const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)
    return diff > 0 ? `หมดใน ${diff} วัน` : 'หมดอายุแล้ว'
  }

  return (
    <div className="mt-6 rounded-3xl border border-amber-300 bg-amber-50 p-5">
      <p className="text-[11px] font-black uppercase tracking-widest text-amber-600 mb-1">Unlock Code — J13</p>
      <p className="text-sm text-neutral-600 mb-4">
        code 1-time (30 วัน) · สร้างใหม่จะยกเลิก code เดิมอัตโนมัติ · ส่งให้ลูกค้าทาง LINE
      </p>
      {loading ? (
        <p className="text-sm text-neutral-400">กำลังโหลด…</p>
      ) : code ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-white border border-amber-300 px-4 py-2 font-mono text-lg font-black tracking-widest text-amber-800">
            {code}
          </span>
          <button
            onClick={copy}
            className="rounded-lg border border-amber-300 px-3 py-2 text-sm font-bold text-amber-700 hover:bg-amber-100 transition"
          >
            {copied ? '✓ Copied!' : 'คัดลอก'}
          </button>
          {expiresAt && (
            <span className="text-xs text-neutral-400">{daysLeft(expiresAt)}</span>
          )}
          <button
            onClick={generate}
            disabled={generating}
            className="ml-auto text-xs text-neutral-400 hover:text-neutral-600 disabled:opacity-50"
          >
            {generating ? 'กำลังสร้าง…' : '🔄 สร้าง code ใหม่'}
          </button>
        </div>
      ) : (
        <button
          onClick={generate}
          disabled={generating}
          className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-black text-white transition hover:bg-amber-600 disabled:opacity-50"
        >
          {generating ? 'กำลังสร้าง…' : '🔑 สร้าง Unlock Code'}
        </button>
      )}
    </div>
  )
}
