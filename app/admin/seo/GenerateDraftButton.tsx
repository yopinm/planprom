'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function GenerateDraftButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [msg, setMsg]       = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  async function handleClick() {
    setLoading(true)
    setMsg(null)
    try {
      const res  = await fetch('/api/admin/seo/generate-draft', { method: 'POST' })
      const json = await res.json() as { ok?: boolean; title?: string; template?: string; error?: string }
      if (!res.ok || json.error) {
        setMsg({ type: 'err', text: json.error ?? 'เกิดข้อผิดพลาด' })
      } else {
        setMsg({ type: 'ok', text: `✅ Draft "${json.title}" จาก "${json.template}" — รออนุมัติ` })
        router.refresh()
      }
    } catch {
      setMsg({ type: 'err', text: 'Network error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black text-white transition hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? '🤖 กำลังสร้าง Draft…' : '🤖 สร้าง Draft ใหม่'}
      </button>
      {msg && (
        <p className={`text-xs font-semibold ${msg.type === 'ok' ? 'text-emerald-600' : 'text-red-600'}`}>
          {msg.text}
        </p>
      )}
    </div>
  )
}
