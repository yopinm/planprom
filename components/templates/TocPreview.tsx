'use client'
import { useState } from 'react'
import type { TocItem } from '@/lib/pdf-types'

export type { TocItem }

export function TocPreview({ sections }: { sections: TocItem[] }) {
  const [open, setOpen] = useState(false)
  if (!sections || sections.length === 0) return null
  return (
    <div className="mt-1">
      <button
        onClick={e => { e.preventDefault(); setOpen(o => !o) }}
        className="text-[11px] font-bold text-violet-600 hover:text-violet-800"
      >
        {open ? '▲ ปิดสารบัญ' : `▼ ดูสารบัญ (${sections.length} หัวข้อ)`}
      </button>
      {open && (
        <ul className="mt-1.5 rounded-lg border border-violet-100 bg-violet-50 px-3 py-2 space-y-0.5">
          {sections.map((item, i) => (
            <li
              key={i}
              className="text-[11px] text-neutral-600 leading-snug"
              style={{ paddingLeft: `${(item.level - 1) * 12}px` }}
            >
              <span className="mr-1 text-violet-400">
                {item.level === 1 ? '●' : item.level === 2 ? '○' : '·'}
              </span>
              {item.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
