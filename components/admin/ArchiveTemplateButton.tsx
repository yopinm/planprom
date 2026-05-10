'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { archiveTemplateAction, unarchiveTemplateAction } from '@/app/admin/templates/actions'

export function ArchiveTemplateButton({ id, status }: { id: string; status: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isArchived = status === 'archived'

  function handleClick() {
    if (!isArchived && !confirmed) {
      setConfirmed(true)
      return
    }
    const fd = new FormData()
    fd.set('id', id)
    startTransition(async () => {
      const result = isArchived
        ? await unarchiveTemplateAction(fd)
        : await archiveTemplateAction(fd)
      if (result?.error) {
        setError(result.error)
        setConfirmed(false)
      } else {
        router.refresh()
      }
    })
  }

  if (pending) {
    return <span className="rounded-xl px-3 py-2 text-xs font-black text-neutral-400">กำลัง{isArchived ? 'เลิกซ่อน' : 'ซ่อน'}…</span>
  }

  if (error) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-red-500 font-bold max-w-[140px]">{error}</span>
        <button onClick={() => setError(null)}
          className="rounded-xl border border-neutral-200 px-2 py-1.5 text-[10px] font-black text-neutral-500 hover:bg-neutral-100">
          ปิด
        </button>
      </div>
    )
  }

  if (confirmed) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-orange-500 font-bold">ซ่อนจากลูกค้า?</span>
        <button onClick={handleClick}
          className="rounded-xl bg-orange-500 px-2 py-1.5 text-[10px] font-black text-white hover:bg-orange-600">
          ยืนยัน
        </button>
        <button onClick={() => setConfirmed(false)}
          className="rounded-xl border border-neutral-200 px-2 py-1.5 text-[10px] font-black text-neutral-500 hover:bg-neutral-100">
          ยกเลิก
        </button>
      </div>
    )
  }

  if (isArchived) {
    return (
      <button onClick={handleClick}
        className="rounded-xl px-3 py-2 text-xs font-black text-orange-500 border border-orange-200 hover:bg-orange-50 transition">
        เลิกซ่อน
      </button>
    )
  }

  return (
    <button onClick={handleClick}
      className="rounded-xl px-3 py-2 text-xs font-black text-neutral-400 transition hover:bg-orange-50 hover:text-orange-500">
      ซ่อน
    </button>
  )
}
