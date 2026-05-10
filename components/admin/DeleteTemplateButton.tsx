'use client'
import { useState, useTransition } from 'react'
import { deleteTemplateAction } from '@/app/admin/templates/actions'

export function DeleteTemplateButton({ id }: { id: string; title?: string }) {
  const [pending, startTransition] = useTransition()
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleClick() {
    if (!confirmed) {
      setConfirmed(true)
      return
    }
    const fd = new FormData()
    fd.set('id', id)
    startTransition(async () => {
      const result = await deleteTemplateAction(fd)
      if (result?.error) {
        setError(result.error)
        setConfirmed(false)
      }
    })
  }

  if (pending) {
    return (
      <span className="rounded-xl px-3 py-2 text-xs font-black text-neutral-400">
        กำลังลบ…
      </span>
    )
  }

  if (confirmed) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-red-500 font-bold max-w-[80px] truncate">ลบถาวร?</span>
        <button
          onClick={handleClick}
          className="rounded-xl bg-red-500 px-2 py-1.5 text-[10px] font-black text-white hover:bg-red-600"
        >
          ยืนยัน
        </button>
        <button
          onClick={() => setConfirmed(false)}
          className="rounded-xl border border-neutral-200 px-2 py-1.5 text-[10px] font-black text-neutral-500 hover:bg-neutral-100"
        >
          ยกเลิก
        </button>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-red-500 font-bold max-w-[140px]">{error}</span>
        <button
          onClick={() => setError(null)}
          className="rounded-xl border border-neutral-200 px-2 py-1.5 text-[10px] font-black text-neutral-500 hover:bg-neutral-100"
        >
          ปิด
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleClick}
      className="rounded-xl px-3 py-2 text-xs font-black text-neutral-300 transition hover:bg-red-50 hover:text-red-500"
    >
      ลบถาวร
    </button>
  )
}
