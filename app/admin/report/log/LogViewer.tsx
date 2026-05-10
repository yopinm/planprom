'use client'

import { useState } from 'react'

export function LogViewer({ content, title, filename }: { content: string; title: string; filename: string }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function download() {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const lineCount = content.split('\n').length

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-black uppercase tracking-wider text-neutral-400">{title} · {lineCount} บรรทัด</p>
        <div className="flex gap-2">
          <button onClick={copy}
            className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-[10px] font-black text-neutral-600 transition hover:border-indigo-400 hover:text-indigo-600">
            {copied ? '✓ Copied!' : '📋 Copy'}
          </button>
          <button onClick={download}
            className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-[10px] font-black text-neutral-600 transition hover:border-indigo-400 hover:text-indigo-600">
            ⬇ Download
          </button>
        </div>
      </div>
      <pre className="overflow-auto rounded-2xl border border-neutral-200 bg-neutral-950 p-5 text-[11px] leading-relaxed text-green-400 max-h-[70vh] whitespace-pre-wrap break-all font-mono">
        {content || '(ว่างเปล่า)'}
      </pre>
    </div>
  )
}
