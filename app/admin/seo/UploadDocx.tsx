'use client'
import { useRef, useState, useTransition } from 'react'
import { uploadDocxAction } from './actions'

export function UploadDocx() {
  const [open, setOpen] = useState(false)
  const [err, setErr] = useState('')
  const [pending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErr('')
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await uploadDocxAction(fd)
      if (res.error) { setErr(res.error); return }
      setOpen(false)
      if (inputRef.current) inputRef.current.value = ''
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-black text-white hover:bg-amber-700 transition"
      >
        + อัพโหลด .docx บทความใหม่
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 p-5">
      <p className="mb-1 text-sm font-black text-amber-900">อัพโหลดบทความ (.docx)</p>
      <p className="mb-4 text-xs text-amber-700">
        บรรทัดแรก = ชื่อบทความ · เนื้อหาที่เหลือ = เนื้อหา · ระบบ auto-สร้าง slug + description
      </p>
      <input
        ref={inputRef}
        name="docx"
        type="file"
        accept=".docx"
        required
        className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-amber-600 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white file:hover:bg-amber-700"
      />
      {err && <p className="mt-2 text-xs font-bold text-red-600">{err}</p>}
      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-amber-700 px-4 py-2 text-sm font-black text-white hover:bg-amber-800 disabled:opacity-50"
        >
          {pending ? 'กำลังอัพโหลด…' : 'อัพโหลด'}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setErr('') }}
          className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-100"
        >
          ยกเลิก
        </button>
      </div>
    </form>
  )
}
