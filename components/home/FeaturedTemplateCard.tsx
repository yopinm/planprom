'use client'

import { useState } from 'react'
import AddToCartButton from '@/components/cart/AddToCartButton'
import FreeDownloadButton from '@/components/templates/FreeDownloadButton'

function getThisWeekRange(): string {
  const now = new Date()
  const day = now.getDay()
  const diffToMon = day === 0 ? -6 : 1 - day
  const mon = new Date(now)
  mon.setDate(now.getDate() + diffToMon)
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  const M = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
  if (mon.getMonth() === sun.getMonth())
    return `${mon.getDate()}–${sun.getDate()} ${M[sun.getMonth()]}`
  return `${mon.getDate()} ${M[mon.getMonth()]}–${sun.getDate()} ${M[sun.getMonth()]}`
}

export interface FeaturedTemplate {
  id: string
  slug: string
  title: string
  tier: string
  preview_path: string | null
  preview_pages: string[] | null
  category_name: string | null
  category_emoji: string | null
  is_request_only?: boolean
}

function PreviewModal({ template, onClose }: { template: FeaturedTemplate; onClose: () => void }) {
  const [pageIdx, setPageIdx] = useState(0)
  const raw = template.preview_pages
  const arr: string[] = Array.isArray(raw) ? raw : (() => { try { const p = JSON.parse(raw as unknown as string); return Array.isArray(p) ? p : [] } catch { return [] } })()
  const pages = arr.length > 0 ? arr : (template.preview_path ? [template.preview_path] : [])
  const cur = Math.min(pageIdx, Math.max(0, pages.length - 1))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="relative flex w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        style={{ maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
        <div className="flex shrink-0 items-start justify-between border-b border-neutral-100 px-5 py-4">
          <div className="min-w-0 pr-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">ตัวอย่างเอกสาร PDF</p>
            <p className="mt-0.5 line-clamp-2 text-sm font-black leading-snug text-neutral-900">{template.title}</p>
          </div>
          <button onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-base font-black text-neutral-600 hover:bg-neutral-200">✕</button>
        </div>
        <div className="flex-1 overflow-hidden bg-neutral-100">
          {pages.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-neutral-400">ไม่มีภาพตัวอย่าง</div>
          ) : (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pages[cur]} alt={`ตัวอย่าง ${template.title} หน้า ${cur + 1}`} className="w-full h-auto block" />
              {pages.length > 1 && (
                <>
                  {cur > 0 && <button onClick={() => setPageIdx(i => i - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 text-sm font-bold">‹</button>}
                  {cur < pages.length - 1 && <button onClick={() => setPageIdx(i => i + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 text-sm font-bold">›</button>}
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                    {pages.map((_, i) => <button key={i} onClick={() => setPageIdx(i)} className={`h-1.5 w-1.5 rounded-full transition ${i === cur ? 'bg-white' : 'bg-white/40'}`} />)}
                  </div>
                  <div className="absolute top-2 right-2 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-medium text-white">{cur + 1} / {pages.length}</div>
                </>
              )}
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center justify-between border-t border-neutral-100 bg-neutral-50 px-5 py-4">
          <button onClick={onClose} className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100">ปิด</button>
          {template.tier !== 'free' ? (
            <AddToCartButton templateId={template.id} isRequestOnly={template.is_request_only}
              className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-black text-white hover:bg-indigo-700 disabled:opacity-60" />
          ) : (
            <FreeDownloadButton templateId={template.id} label="⬇️ รับฟรี"
              className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-60" />
          )}
        </div>
      </div>
    </div>
  )
}

function FeaturedRow({ template }: { template: FeaturedTemplate }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <div className="flex flex-wrap items-center gap-2 py-2.5">
        <div className="flex-1 min-w-0">
          <p className="font-black text-neutral-900 text-sm truncate">{template.title}</p>
          {template.category_emoji && (
            <p className="text-xs text-neutral-400 mt-0.5">{template.category_emoji} {template.category_name}</p>
          )}
        </div>
        <button onClick={() => setOpen(true)}
          className="shrink-0 rounded-lg border border-neutral-200 px-2.5 py-1 text-xs font-semibold text-neutral-600 hover:border-neutral-400 transition">
          ดูพรีวิว
        </button>
        {template.tier === 'free' ? (
          <FreeDownloadButton templateId={template.id} label="รับฟรี"
            className="shrink-0 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-black text-white hover:bg-emerald-700 disabled:opacity-60 transition" />
        ) : (
          <AddToCartButton templateId={template.id} isRequestOnly={template.is_request_only}
            className="shrink-0 rounded-lg bg-amber-500 px-2.5 py-1 text-xs font-black text-white hover:bg-amber-600 disabled:opacity-60 transition" />
        )}
      </div>
      {open && <PreviewModal template={template} onClose={() => setOpen(false)} />}
    </>
  )
}

export default function FeaturedTemplateCard({ templates }: { templates: FeaturedTemplate[] }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-white px-5 py-4 shadow-sm transition hover:border-amber-300 hover:shadow-md">
      <p className="text-sm font-black text-amber-500 mb-2">
        ✨ แนะนำสัปดาห์นี้
        <span className="ml-2 font-medium text-amber-400 text-xs">· {getThisWeekRange()}</span>
      </p>
      <div className="divide-y divide-neutral-100">
        {templates.map(t => <FeaturedRow key={t.id} template={t} />)}
      </div>
    </div>
  )
}
