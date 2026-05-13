'use client'
import { useState, useEffect, useCallback } from 'react'
import AddToCartButton from '@/components/cart/AddToCartButton'
import FreeDownloadButton from '@/components/templates/FreeDownloadButton'
import { TocPreview, type TocItem } from '@/components/templates/TocPreview'

export type PreviewTemplate = {
  id: string
  slug: string
  title: string
  tier: string
  document_type: string
  sale_count: number
  toc_sections: TocItem[] | null
  preview_path: string | null
  is_request_only?: boolean
}

const TYPE_LABEL: Record<string, string> = {
  checklist: '✅ เช็คลิสต์',
  planner:   '📅 แพลนเนอร์',
  form:      '📝 ฟอร์ม',
  report:    '📊 รายงาน',
}
const TYPE_COLOR: Record<string, string> = {
  checklist: 'bg-blue-100 text-blue-700',
  planner:   'bg-purple-100 text-purple-700',
  form:      'bg-teal-100 text-teal-700',
  report:    'bg-orange-100 text-orange-700',
}
const TIER_LABEL: Record<string, string> = {
  free: 'ฟรี', standard: '฿20', premium: '฿20', ultra: '฿20',
}
const TIER_COLOR: Record<string, string> = {
  free:     'bg-emerald-100 text-emerald-700',
  standard: 'bg-amber-100 text-amber-700',
  premium:  'bg-amber-100 text-amber-700',
  ultra:    'bg-amber-100 text-amber-700',
}

export function TemplateListWithPreview({ templates }: { templates: PreviewTemplate[] }) {
  const [preview, setPreview] = useState<PreviewTemplate | null>(null)

  const close = useCallback(() => setPreview(null), [])

  useEffect(() => {
    if (!preview) return
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [preview, close])

  return (
    <>
      {/* Preview modal */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={close}
        >
          <div
            className="relative flex w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            style={{ maxHeight: '90vh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex shrink-0 items-start justify-between border-b border-neutral-100 px-5 py-4">
              <div className="min-w-0 pr-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">ตัวอย่างเอกสาร PDF</p>
                <p className="mt-0.5 line-clamp-2 text-sm font-black leading-snug text-neutral-900">{preview.title}</p>
              </div>
              <button
                onClick={close}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-base font-black text-neutral-600 transition hover:bg-neutral-200"
                aria-label="ปิด"
              >
                ✕
              </button>
            </div>

            {/* Preview — scrollable */}
            <div className="flex-1 overflow-y-auto bg-neutral-100">
              {preview.preview_path ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview.preview_path}
                  alt={`ตัวอย่าง ${preview.title}`}
                  className="w-full h-auto"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-center px-6">
                  <p className="text-5xl">{TYPE_LABEL[preview.document_type]?.split(' ')[0] ?? '📄'}</p>
                  <p className="font-bold text-neutral-800">{preview.title}</p>
                  <p className="text-sm text-neutral-500">
                    {TYPE_LABEL[preview.document_type] ?? 'เทมเพลต PDF'}
                    {' · PDF พร้อมดาวน์โหลดทันทีหลังชำระเงิน'}
                  </p>
                </div>
              )}
            </div>

            {/* Form info banner */}
            {preview.document_type === 'form' && (
              <div className="shrink-0 bg-amber-50 border-t border-amber-100 px-5 py-2.5 text-xs text-amber-800">
                📄 รับทั้ง 2 ไฟล์: <span className="font-bold">ฟอร์มตัวอย่าง</span> (กรอกข้อมูลแล้ว) + <span className="font-bold">ฟอร์มเปล่า</span> (พร้อมกรอกเอง)
              </div>
            )}

            {/* Footer */}
            <div className="flex shrink-0 items-center justify-between border-t border-neutral-100 bg-neutral-50 px-5 py-4">
              <button
                onClick={close}
                className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100"
              >
                ปิด
              </button>
              {preview.tier !== 'free' ? (
                <AddToCartButton
                  templateId={preview.id}
                  isRequestOnly={preview.is_request_only}
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-black text-white transition hover:bg-indigo-700 disabled:opacity-60"
                />
              ) : (
                <FreeDownloadButton
                  templateId={preview.id}
                  label="⬇️ รับฟรี"
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-60"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Template rows */}
      <div className="divide-y divide-neutral-100 overflow-hidden rounded-xl border border-neutral-200 bg-white">
        {templates.map(t => (
          <div key={t.id} className="group px-4 py-3 transition-colors hover:bg-emerald-50">
            {/* Main row */}
            <div className="flex items-center gap-3">
              <span className="shrink-0 text-base text-neutral-300">📄</span>
              <button
                onClick={() => setPreview(t)}
                className="min-w-0 flex-1 truncate text-left text-sm font-medium text-neutral-700 hover:text-emerald-800 hover:underline"
              >
                {t.title}
              </button>
              {t.sale_count > 0 && (
                <span className="shrink-0 text-[10px] text-neutral-400">{t.sale_count} ขาย</span>
              )}
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${TYPE_COLOR[t.document_type] ?? 'bg-neutral-100 text-neutral-600'}`}>
                {TYPE_LABEL[t.document_type] ?? t.document_type}
              </span>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${TIER_COLOR[t.tier] ?? 'bg-neutral-100 text-neutral-600'}`}>
                {TIER_LABEL[t.tier] ?? t.tier}
              </span>
              {t.tier !== 'free' && (
                <AddToCartButton
                  templateId={t.id}
                  isRequestOnly={t.is_request_only}
                  className="shrink-0 rounded px-2 py-1 text-xs font-medium text-white transition-colors bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
                />
              )}
              {t.tier === 'free' && (
                <FreeDownloadButton
                  templateId={t.id}
                  label="รับฟรี"
                  className="shrink-0 rounded px-2 py-1 text-xs font-medium text-white transition-colors bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60"
                />
              )}
            </div>

            {/* Second row: preview link + TOC */}
            <div className="mt-1 flex items-center gap-3 pl-7">
              <button
                onClick={() => setPreview(t)}
                className="text-[11px] font-medium text-emerald-600 hover:text-emerald-800 hover:underline"
              >
                🔍 ดูพรีวิวเอกสารก่อนซื้อ
              </button>
              {t.toc_sections && t.toc_sections.length > 0 && (
                <TocPreview sections={t.toc_sections} />
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
