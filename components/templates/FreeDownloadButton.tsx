'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  templateId: string
  className?: string
  label?: string
}

export default function FreeDownloadButton({ templateId, className, label = '⬇️ รับฟรี' }: Props) {
  const router = useRouter()
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle')

  async function handleClick() {
    if (state === 'loading') return
    setState('loading')
    try {
      const res = await fetch('/api/free-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId }),
      })
      if (!res.ok) {
        setState('error')
        return
      }
      const { token } = await res.json() as { token: string }
      router.push(`/d/${token}`)
    } catch {
      setState('error')
    }
  }

  if (state === 'error') {
    return (
      <button onClick={() => setState('idle')} className={className}>
        ⚠️ ลองใหม่
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={state === 'loading'}
      className={className}
    >
      {state === 'loading' ? '⏳ กำลังสร้าง…' : label}
    </button>
  )
}
