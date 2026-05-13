'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
import type { FormField } from '@/lib/engine-form-types'

interface Props {
  field: FormField
  onChange: (updated: FormField) => void
  onDelete: () => void
}

export function FieldCard({ field, onChange, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: field.id })

  const [expanded, setExpanded] = useState(false)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const hasOptions = ['checkbox', 'radio', 'dropdown', 'inspection'].includes(field.type)
  const hasTableConfig = field.type === 'table'
  const isLayout = ['section_header', 'divider', 'page_break', 'logo'].includes(field.type)

  function addOption() {
    onChange({ ...field, options: [...(field.options ?? []), `ตัวเลือก ${(field.options?.length ?? 0) + 1}`] })
  }
  function updateOption(i: number, val: string) {
    const opts = [...(field.options ?? [])]
    opts[i] = val
    onChange({ ...field, options: opts })
  }
  function removeOption(i: number) {
    onChange({ ...field, options: (field.options ?? []).filter((_, j) => j !== i) })
  }

  const typeLabel: Record<string, string> = {
    text: 'ข้อความ', multiline: 'หลายบรรทัด', email: 'อีเมล',
    number: 'ตัวเลข', currency: 'จำนวนเงิน',
    date: 'วันที่', date_range: 'ช่วงวันที่',
    checkbox: 'Checkbox', radio: 'Radio', dropdown: 'Dropdown', inspection: 'ผ่าน/ไม่ผ่าน',
    signature: 'ลายเซ็น', logo: 'โลโก้', running_number: 'เลขที่เอกสาร',
    id_card: 'บัตรประชาชน', photo_upload: 'รูปภาพ', barcode: 'Barcode/QR',
    gps: 'พิกัด GPS', dimension: 'ขนาด W×L×H', weight_height: 'น้ำหนัก/สูง',
    table: 'ตาราง', section_header: 'หัวข้อส่วน', divider: 'เส้นคั่น', page_break: 'ขึ้นหน้าใหม่',
  }

  return (
    <div ref={setNodeRef} style={style} className="bg-white border border-gray-200 rounded-lg shadow-sm mb-2">
      {/* Header row */}
      <div className="flex items-center gap-2 px-3 py-2">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none shrink-0"
          title="ลากเพื่อเรียงลำดับ"
        >
          ⠿
        </button>

        {/* Label */}
        <div className="flex-1 min-w-0">
          {isLayout && field.type !== 'section_header' ? (
            <span className="text-sm text-gray-500 italic">{typeLabel[field.type]}</span>
          ) : (
            <input
              className="w-full text-sm font-medium text-gray-800 border-0 border-b border-transparent focus:border-amber-400 focus:outline-none bg-transparent truncate"
              value={field.label}
              onChange={e => onChange({ ...field, label: e.target.value })}
              placeholder="ชื่อ field"
            />
          )}
        </div>

        {/* Type badge */}
        <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
          {typeLabel[field.type] ?? field.type}
        </span>

        {/* Required toggle */}
        {!isLayout && (
          <button
            onClick={() => onChange({ ...field, required: !field.required })}
            className={`text-xs px-1.5 py-0.5 rounded shrink-0 ${field.required ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'}`}
            title="required"
          >
            *
          </button>
        )}

        {/* Config toggle */}
        {(hasOptions || hasTableConfig || !isLayout) && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="text-xs text-gray-400 hover:text-gray-600 shrink-0"
            title="ตั้งค่า"
          >
            {expanded ? '▲' : '▼'}
          </button>
        )}

        {/* Delete */}
        <button
          onClick={onDelete}
          className="text-gray-300 hover:text-red-500 shrink-0 text-base leading-none"
          title="ลบ"
        >
          ✕
        </button>
      </div>

      {/* Expanded config */}
      {expanded && (
        <div className="px-3 pb-3 border-t border-gray-100 pt-2 space-y-2">
          {/* Width toggle (non-layout) */}
          {!isLayout && (
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-xs text-gray-500 w-16 shrink-0">ความกว้าง</span>
              {([
                { label: '1/4', value: 25 },
                { label: '1/3', value: 33 },
                { label: '1/2', value: 50 },
                { label: '2/3', value: 67 },
                { label: '3/4', value: 75 },
                { label: 'เต็ม', value: 100 },
              ] as const).map(w => (
                <button
                  key={w.value}
                  onClick={() => onChange({ ...field, width: w.value })}
                  className={`text-xs px-2 py-0.5 rounded border ${(field.width ?? 100) === w.value ? 'border-amber-500 text-amber-700 bg-amber-50' : 'border-gray-200 text-gray-500'}`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          )}

          {/* Placeholder */}
          {['text', 'multiline', 'email', 'number', 'currency'].includes(field.type) && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-16">Placeholder</span>
              <input
                className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-amber-400"
                value={field.placeholder ?? ''}
                onChange={e => onChange({ ...field, placeholder: e.target.value })}
                placeholder="ข้อความตัวอย่าง"
              />
            </div>
          )}

          {/* Options for checkbox/radio/dropdown */}
          {hasOptions && (
            <div>
              <p className="text-xs text-gray-500 mb-1">ตัวเลือก</p>
              {(field.options ?? []).map((opt, i) => (
                <div key={i} className="flex items-center gap-1 mb-1">
                  <input
                    className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-amber-400"
                    value={opt}
                    onChange={e => updateOption(i, e.target.value)}
                  />
                  <button onClick={() => removeOption(i)} className="text-gray-300 hover:text-red-500 text-sm">✕</button>
                </div>
              ))}
              <button onClick={addOption} className="text-xs text-amber-600 hover:text-amber-800">+ เพิ่มตัวเลือก</button>
            </div>
          )}

          {/* Table config */}
          {hasTableConfig && (
            <div className="space-y-1">
              <p className="text-xs text-gray-500">คอลัมน์ตาราง</p>
              {(field.tableColumns ?? ['รายการ', 'จำนวน', 'หมายเหตุ']).map((col, i) => (
                <div key={i} className="flex items-center gap-1 mb-1">
                  <input
                    className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-amber-400"
                    value={col}
                    onChange={e => {
                      const cols = [...(field.tableColumns ?? [])]
                      cols[i] = e.target.value
                      onChange({ ...field, tableColumns: cols })
                    }}
                  />
                  <button
                    onClick={() => onChange({ ...field, tableColumns: (field.tableColumns ?? []).filter((_, j) => j !== i) })}
                    className="text-gray-300 hover:text-red-500 text-sm"
                  >✕</button>
                </div>
              ))}
              <button
                onClick={() => onChange({ ...field, tableColumns: [...(field.tableColumns ?? []), `คอลัมน์ ${(field.tableColumns?.length ?? 0) + 1}`] })}
                className="text-xs text-amber-600 hover:text-amber-800"
              >+ เพิ่มคอลัมน์</button>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">จำนวนแถว</span>
                <input
                  type="number" min={1} max={20}
                  className="w-16 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-amber-400"
                  value={field.tableRows ?? 3}
                  onChange={e => onChange({ ...field, tableRows: Number(e.target.value) })}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
