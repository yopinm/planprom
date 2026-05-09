'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import AddToCartButton from '@/components/cart/AddToCartButton'
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

            {/* Preview image — scrollable */}
            <div className="flex-1 overflow-y-auto bg-neutral-100">
              {preview.preview_path ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview.preview_path}
                  alt={`ตัวอย่าง ${preview.title}`}
                  className="w-full h-auto"
                />
              ) : (
                <div className="flex h-48 items-center justify-center text-sm text-neutral-400">
                  ไม่มีภาพตัวอย่าง
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex shrink-0 items-center justify-between border-t border-neutral-100 bg-neutral-50 px-5 py-4">
              <button
                onClick={close}
                className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100"
              >
                ปิด
              </button>
              {preview.tier !== 'free' ? (
                <Link
                  href={`/templates/${preview.slug}`}
                  onClick={close}
                  className="rounded-xl bg-amber-500 px-5 py-2 text-sm font-black text-white transition hover:bg-amber-600"
                >
                  ดูรายละเอียด / ซื้อ →
                </Link>
              ) : (
                <a
                  href="#line-cta"
                  onClick={close}
                  className="rounded-xl bg-[#06C755] px-5 py-2 text-sm font-black text-white transition hover:bg-green-500"
                >
                  🎁 รับฟรีผ่าน LINE OA
                </a>
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
              <Link
                href={t.tier === 'free' ? '#line-cta' : `/templates/${t.slug}`}
                className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-700 group-hover:text-emerald-800"
              >
                {t.title}
              </Link>
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
                  className="shrink-0 rounded px-2 py-1 text-xs font-medium text-white transition-colors bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
                />
              )}
              {t.tier === 'free' && (
                <span className="shrink-0 text-sm font-black text-emerald-700">ฟรี</span>
              )}
            </div>

            {/* Second row: preview link + TOC */}
            {(t.preview_path || (t.toc_sections && t.toc_sections.length > 0)) && (
              <div className="mt-1 flex items-center gap-3 pl-7">
                {t.preview_path && (
                  <button
                    onClick={() => setPreview(t)}
                    className="text-[11px] font-medium text-emerald-600 hover:text-emerald-800 hover:underline"
                  >
                    🔍 ดูพรีวิวเอกสารก่อนซื้อ
                  </button>
                )}
                {t.toc_sections && t.toc_sections.length > 0 && (
                  <TocPreview sections={t.toc_sections} />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
