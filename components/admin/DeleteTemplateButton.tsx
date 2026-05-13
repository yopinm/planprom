'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteTemplateAction } from '@/app/admin/templates/actions'

export function DeleteTemplateButton({ id }: { id: string; title?: string }) {
  const router = useRouter()
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
      } else {
        router.refresh()
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
    <div className="relative group">
      <button
        onClick={handleClick}
        className="rounded-xl px-3 py-2 text-xs font-black text-neutral-300 transition hover:bg-red-50 hover:text-red-500"
      >
        ลบถาวร
      </button>
      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-52 rounded-lg bg-neutral-800 px-2.5 py-1.5 text-[10px] text-neutral-100 leading-snug opacity-0 group-hover:opacity-100 transition-opacity z-50 text-center">
        ลบได้เฉพาะ template ที่ไม่มี order<br />ถ้ามี order → ใช้ Force ลบ
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-neutral-800" />
      </div>
    </div>
  )
}
