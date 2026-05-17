'use client'
import { useRef, useState } from 'react'

type UploadResult = { inserted: number; updated: number; errors: string[]; total: number }

export function ExcelUploader({ existingCount }: { existingCount: number }) {
  const inputRef   = useRef<HTMLInputElement>(null)
  const [loading,  setLoading]  = useState(false)
  const [result,   setResult]   = useState<UploadResult | null>(null)
  const [errMsg,   setErrMsg]   = useState<string | null>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true); setResult(null); setErrMsg(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res  = await fetch('/api/admin/intel/upload-excel', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) { setErrMsg(json.error ?? 'เกิดข้อผิดพลาด'); return }
      setResult(json)
      setTimeout(() => window.location.reload(), 1200)
    } catch { setErrMsg('อัพโหลดไม่สำเร็จ') }
    finally   { setLoading(false); if (inputRef.current) inputRef.current.value = '' }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition
        ${loading ? 'bg-neutral-100 text-neutral-400 cursor-wait' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
        {loading ? '⏳ กำลังประมวลผล…' : '📤 อัพโหลด Excel (.xlsx)'}
        <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden"
          disabled={loading} onChange={handleFile} />
      </label>

      {existingCount > 0 && !result && (
        <span className="text-xs text-neutral-500">มีข้อมูลอยู่แล้ว {existingCount} รายการ</span>
      )}

      {result && (
        <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
          ✅ ใหม่ {result.inserted} · อัพเดต {result.updated} · รวม {result.total}
          {result.errors.length > 0 && ` · ⚠ ข้าม ${result.errors.length}`}
        </span>
      )}

      {result?.errors && result.errors.length > 0 && (
        <details className="w-full mt-1">
          <summary className="text-xs text-amber-600 cursor-pointer">ดูแถวที่มีปัญหา ({result.errors.length})</summary>
          <ul className="mt-1 text-xs text-neutral-500 space-y-0.5 pl-4 list-disc">
            {result.errors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </details>
      )}

      {errMsg && (
        <span className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-full">
          ❌ {errMsg}
        </span>
      )}
    </div>
  )
}
