'use client'

import { useState } from 'react'

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
import AddToCartButton from '@/components/cart/AddToCartButton'
import FreeDownloadButton from '@/components/templates/FreeDownloadButton'

export interface FeaturedTemplate {
  id: string
  slug: string
  title: string
  tier: string
  preview_path: string | null
  category_name: string | null
  category_emoji: string | null
}

export default function FeaturedTemplateCard({ template }: { template: FeaturedTemplate }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="rounded-xl border border-amber-200 bg-white px-5 py-4 shadow-sm transition hover:border-amber-400 hover:shadow-md">
        <p className="text-sm font-black text-amber-500 mb-3">
          ✨ แนะนำสัปดาห์นี้
          <span className="ml-2 font-medium text-amber-400 text-xs">· {getThisWeekRange()}</span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-black text-neutral-900 text-sm flex-1 min-w-0 truncate">
            {template.title}
          </p>

          {template.category_emoji && (
            <span className="shrink-0 text-xs text-neutral-400">
              {template.category_emoji} {template.category_name}
            </span>
          )}

          <button
            onClick={() => setOpen(true)}
            className="shrink-0 rounded-lg border border-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-600 transition hover:border-neutral-400"
          >
            ดูพรีวิวสินค้า
          </button>

          {template.tier === 'free' ? (
            <FreeDownloadButton
              templateId={template.id}
              label="รับฟรี"
              className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1 text-xs font-black text-white hover:bg-emerald-700 disabled:opacity-60 transition"
            />
          ) : (
            <AddToCartButton
              templateId={template.id}
              className="shrink-0 rounded-lg bg-amber-500 px-3 py-1 text-xs font-black text-white hover:bg-amber-600 disabled:opacity-60 transition"
            />
          )}
        </div>
      </div>

      {/* Preview modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative flex w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            style={{ maxHeight: '90vh' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-start justify-between border-b border-neutral-100 px-5 py-4">
              <div className="min-w-0 pr-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">ตัวอย่างเอกสาร PDF</p>
                <p className="mt-0.5 line-clamp-2 text-sm font-black leading-snug text-neutral-900">{template.title}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-base font-black text-neutral-600 transition hover:bg-neutral-200"
                aria-label="ปิด"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-neutral-100">
              {template.preview_path ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={template.preview_path}
                  alt={`ตัวอย่าง ${template.title}`}
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
                onClick={() => setOpen(false)}
                className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100"
              >
                ปิด
              </button>
              {template.tier !== 'free' ? (
                <AddToCartButton
                  templateId={template.id}
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-black text-white transition hover:bg-indigo-700 disabled:opacity-60"
                />
              ) : (
                <FreeDownloadButton
                  templateId={template.id}
                  label="⬇️ รับฟรี"
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-60"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
