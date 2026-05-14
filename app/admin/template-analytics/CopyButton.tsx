'use client'
import { useState } from 'react'

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        })
      }}
      className={`shrink-0 rounded-lg border px-2.5 py-1 text-[9px] font-black transition ${
        copied
          ? 'border-green-300 bg-green-50 text-green-700'
          : 'border-neutral-200 bg-neutral-50 text-neutral-500 hover:border-indigo-400 hover:text-indigo-600'
      }`}
    >
      {copied ? '✅ copied' : '📋 copy'}
    </button>
  )
}
