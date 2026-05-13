'use client'

import { useState } from 'react'
import type { FormField, FormFieldType } from '@/lib/engine-form-types'
import { PALETTE_GROUPS_FROM_REGISTRY } from '@/lib/field-registry'

const BASE_GROUPS = new Set(['ข้อความ', 'วันที่', 'ตัวเลือก', 'พิเศษ', 'โครงสร้าง'])

interface Props {
  onAdd: (type: FormFieldType, preset?: Partial<FormField>) => void
}

export function FieldPalette({ onAdd }: Props) {
  const [search, setSearch] = useState('')
  const [collapsed, setCollapsed] = useState<Set<string>>(
    () => new Set(PALETTE_GROUPS_FROM_REGISTRY.filter(g => !BASE_GROUPS.has(g.name)).map(g => g.name))
  )

  const q = search.trim().toLowerCase()

  function toggleGroup(name: string) {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const searchResults = q
    ? PALETTE_GROUPS_FROM_REGISTRY.flatMap(g =>
        g.items.filter(d =>
          d.paletteLabel.toLowerCase().includes(q) ||
          d.shortLabel.toLowerCase().includes(q)
        )
      )
    : null

  return (
    <div className="w-56 shrink-0 bg-white border border-gray-200 rounded-lg flex flex-col max-h-[calc(100vh-160px)]">
      {/* Header + search (A) */}
      <div className="px-3 py-2 border-b border-gray-100 bg-amber-50 shrink-0">
        <p className="text-xs font-bold text-amber-800">Field Types</p>
        <input
          className="mt-1.5 w-full text-xs border border-amber-200 rounded px-2 py-1 bg-white focus:outline-none focus:border-amber-400 placeholder:text-gray-400"
          placeholder="ค้นหา field..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="overflow-y-auto flex-1">
        {/* Search results (A) */}
        {searchResults !== null ? (
          searchResults.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">ไม่พบ field ที่ค้นหา</p>
          ) : (
            <div className="px-2 py-2">
              {searchResults.map((item, idx) => (
                <button
                  key={`${item.type}-${idx}`}
                  onClick={() => onAdd(item.type, item.preset)}
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-amber-50 hover:text-amber-800 flex items-center gap-2 transition-colors"
                >
                  <span className="text-base leading-none">{item.icon}</span>
                  <span className="text-xs text-gray-700">{item.paletteLabel}</span>
                </button>
              ))}
            </div>
          )
        ) : (
          /* Grouped list with collapsible industry groups (B) + registry (C) */
          PALETTE_GROUPS_FROM_REGISTRY.map(g => {
            const isCollapsed = collapsed.has(g.name)
            return (
              <div key={g.name} className="border-b border-gray-100 last:border-0">
                <button
                  onClick={() => toggleGroup(g.name)}
                  className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-gray-50"
                >
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{g.name}</span>
                  <span className="text-gray-300 text-[10px]">{isCollapsed ? '▶' : '▼'}</span>
                </button>

                {!isCollapsed && (
                  <div className="px-2 pb-2">
                    {g.items.map((item, idx) => (
                      <button
                        key={`${item.type}-${idx}`}
                        onClick={() => onAdd(item.type, item.preset)}
                        className="w-full text-left px-2 py-1.5 rounded hover:bg-amber-50 hover:text-amber-800 flex items-center gap-2 transition-colors"
                      >
                        <span className="text-base leading-none">{item.icon}</span>
                        <span className="text-xs text-gray-700">{item.paletteLabel}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
