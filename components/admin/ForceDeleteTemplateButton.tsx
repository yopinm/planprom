'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { forceDeleteTemplateAction } from '@/app/admin/templates/actions'

type Step = 'idle' | 'confirm1' | 'confirm2' | 'loading' | 'error'

export function ForceDeleteTemplateButton({ id }: { id: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [step, setStep] = useState<Step>('idle')
  const [error, setError] = useState<string | null>(null)

  function handleFirst() { setStep('confirm1') }
  function handleSecond() { setStep('confirm2') }
  function handleCancel() { setStep('idle'); setError(null) }

  function handleConfirm() {
    const fd = new FormData()
    fd.set('id', id)
    startTransition(async () => {
      const result = await forceDeleteTemplateAction(fd)
      if (result?.error) {
        setError(result.error)
        setStep('error')
      } else {
        router.refresh()
      }
    })
  }

  if (pending) {
    return <span className="rounded-xl px-3 py-2 text-xs font-black text-neutral-400">กำลังลบ…</span>
  }

  if (step === 'error') {
    return (
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-red-600 font-bold max-w-[140px]">{error}</span>
        <button onClick={handleCancel}
          className="rounded-xl border border-neutral-200 px-2 py-1.5 text-[10px] font-black text-neutral-500 hover:bg-neutral-100">
          ปิด
        </button>
      </div>
    )
  }

  if (step === 'confirm1') {
    return (
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-red-700 font-black">Force ลบ?</span>
        <button onClick={handleSecond}
          className="rounded-xl bg-red-700 px-2 py-1.5 text-[10px] font-black text-white hover:bg-red-800">
          ต่อไป
        </button>
        <button onClick={handleCancel}
          className="rounded-xl border border-neutral-200 px-2 py-1.5 text-[10px] font-black text-neutral-500 hover:bg-neutral-100">
          ยกเลิก
        </button>
      </div>
    )
  }

  if (step === 'confirm2') {
    return (
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-red-700 font-black">ลบรวม order ด้วย?</span>
        <button onClick={handleConfirm}
          className="rounded-xl bg-red-800 px-2 py-1.5 text-[10px] font-black text-white hover:bg-red-900">
          ยืนยัน
        </button>
        <button onClick={handleCancel}
          className="rounded-xl border border-neutral-200 px-2 py-1.5 text-[10px] font-black text-neutral-500 hover:bg-neutral-100">
          ยกเลิก
        </button>
      </div>
    )
  }

  return (
    <div className="relative group">
      <button onClick={handleFirst}
        className="rounded-xl px-3 py-2 text-xs font-black text-red-300 transition hover:bg-red-50 hover:text-red-700">
        Force ลบ
      </button>
      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-56 rounded-lg bg-red-900 px-2.5 py-1.5 text-[10px] text-red-100 leading-snug opacity-0 group-hover:opacity-100 transition-opacity z-50 text-center">
        ลบทุกอย่างรวม order — กู้คืนไม่ได้<br />ใช้เฉพาะ test data เท่านั้น
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-red-900" />
      </div>
    </div>
  )
}
