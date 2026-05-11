'use client'
import { useState, useEffect, useCallback } from 'react'
import AddToCartButton from '@/components/cart/AddToCartButton'
import FreeDownloadButton from '@/components/templates/FreeDownloadButton'

export type CatalogTemplate = {
  id: string; slug: string; title: string
  price_baht: number; tier: string; sale_count: number
  document_type: string; preview_path: string | null
}

const TYPE_LABEL: Record<string, string> = {
  checklist: '✅ เช็คลิสต์',
  planner:   '📅 แพลนเนอร์',
  form:      '📝 ฟอร์ม',
  report:    '📊 รายงาน',
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
const TYPE_ORDER = ['planner', 'checklist', 'form', 'report']
const TYPE_HEADER: Record<string, { bg: string; border: string; text: string; sub: string }> = {
  planner:   { bg: 'bg-purple-50',  border: 'border-purple-300', text: 'text-purple-900', sub: 'วางแผนล่วงหน้า · บรรลุเป้าหมาย' },
  checklist: { bg: 'bg-blue-50',    border: 'border-blue-300',   text: 'text-blue-900',   sub: 'ตรวจสอบรายการ · ไม่พลาดทุกขั้นตอน' },
  form:      { bg: 'bg-teal-50',    border: 'border-teal-300',   text: 'text-teal-900',   sub: 'กรอกข้อมูล · ใช้ซ้ำได้' },
  report:    { bg: 'bg-orange-50',  border: 'border-orange-300', text: 'text-orange-900', sub: 'สรุปผล · วิเคราะห์ข้อมูล' },
}

export function CatalogTemplateList({ templates }: { templates: CatalogTemplate[] }) {
  const [preview, setPreview] = useState<CatalogTemplate | null>(null)
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

  const knownSet = new Set(TYPE_ORDER)
  const otherTypes = [...new Set(templates.map(t => t.document_type).filter(t => !knownSet.has(t)))]
  const orderedTypes = [...TYPE_ORDER, ...otherTypes].filter(type =>
    templates.some(t => t.document_type === type)
  )

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

      {/* Grouped list */}
      <div className="space-y-5">
        {orderedTypes.map(type => {
          const items = templates.filter(t => t.document_type === type)
          const h = TYPE_HEADER[type] ?? { bg: 'bg-neutral-50', border: 'border-neutral-300', text: 'text-neutral-900', sub: '' }
          return (
            <div key={type} className={`overflow-hidden rounded-2xl border-2 ${h.border}`}>
              <div className={`flex items-center justify-between px-5 py-3 ${h.bg}`}>
                <div>
                  <p className={`text-base font-black ${h.text}`}>{TYPE_LABEL[type] ?? type}</p>
                  <p className="text-xs text-neutral-500">{h.sub}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-0.5 text-xs font-bold text-neutral-500 shadow-sm">
                  {items.length} รายการ
                </span>
              </div>

              <div className="divide-y divide-neutral-100 bg-white">
                {items.map(t => (
                  <div key={t.id} className="group px-5 py-3 transition-colors hover:bg-emerald-50">
                    {/* Main row */}
                    <div className="flex items-center gap-3">
                      <span className="shrink-0 text-base text-neutral-300">📄</span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-700 group-hover:text-emerald-800">
                        {t.title}
                      </span>
                      {t.sale_count > 0 && (
                        <span className="shrink-0 text-[10px] text-neutral-400">{t.sale_count} ขาย</span>
                      )}
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${TIER_COLOR[t.tier] ?? 'bg-neutral-100 text-neutral-600'}`}>
                        {TIER_LABEL[t.tier] ?? t.tier}
                      </span>
                      {t.tier === 'free' ? (
                        <FreeDownloadButton
                          templateId={t.id}
                          label="รับฟรี"
                          className="shrink-0 rounded px-2 py-1 text-xs font-medium text-white transition-colors bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60"
                        />
                      ) : (
                        <AddToCartButton
                          templateId={t.id}
                          className="shrink-0 rounded px-2 py-1 text-xs font-medium text-white transition-colors bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
                        />
                      )}
                    </div>

                    {/* Preview button — only when preview_path exists */}
                    {t.preview_path && (
                      <div className="mt-1 pl-7">
                        <button
                          onClick={() => setPreview(t)}
                          className="text-[11px] font-medium text-emerald-600 hover:text-emerald-800 hover:underline"
                        >
                          🔍 ดูพรีวิวก่อนซื้อ
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
