'use client'

import { useState } from 'react'
import Link from 'next/link'

export function LogExportClient({ json, exportedAt }: { json: string; exportedAt: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(json)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownload() {
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `planprom-snapshot-${exportedAt.slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const sizeKb = Math.round(json.length / 1024 * 10) / 10

  return (
    <main className="min-h-screen bg-neutral-50 pb-20">
      <div className="mx-auto max-w-5xl px-4 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-neutral-400">Admin · Templates</p>
            <h1 className="text-2xl font-black text-black">📋 System Log Export</h1>
            <p className="text-sm text-neutral-500 mt-1">Snapshot สำหรับส่งให้ Claude Code วิเคราะห์ระบบ</p>
            <p className="text-xs text-neutral-400 mt-0.5 font-mono">
              exported: {exportedAt} · {sizeKb} KB
            </p>
          </div>
          <Link
            href="/admin/templates"
            className="rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-xs font-black text-neutral-600 shadow-sm hover:border-black"
          >
            ← Templates
          </Link>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={handleCopy}
            className={`rounded-2xl px-5 py-2.5 text-sm font-black transition ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-black text-white hover:bg-neutral-800'
            }`}
          >
            {copied ? '✅ คัดลอกแล้ว!' : '📋 Copy JSON'}
          </button>
          <button
            onClick={handleDownload}
            className="rounded-2xl border border-neutral-200 bg-white px-5 py-2.5 text-sm font-black text-neutral-700 shadow-sm hover:border-black transition"
          >
            ⬇️ Download .json
          </button>
        </div>

        {/* Usage hint */}
        <div className="mb-6 rounded-2xl bg-amber-50 border border-amber-200 px-5 py-4 text-sm text-amber-800">
          <p className="font-bold mb-1">วิธีใช้งาน</p>
          <p className="text-xs leading-relaxed">
            กด &ldquo;Copy JSON&rdquo; → วาง (paste) ใน Claude Code session พร้อมบอกปัญหาที่พบ → Claude จะวิเคราะห์ข้อมูลระบบได้ทันที
          </p>
        </div>

        {/* JSON preview */}
        <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 bg-neutral-50 border-b border-neutral-200">
            <span className="font-mono text-xs text-neutral-500">planprom-snapshot.json</span>
            <span className="text-xs text-neutral-400">{sizeKb} KB</span>
          </div>
          <pre className="overflow-auto max-h-[60vh] p-4 text-xs font-mono text-neutral-700 leading-relaxed whitespace-pre-wrap">
            {json}
          </pre>
        </div>

      </div>
    </main>
  )
}
