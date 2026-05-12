'use client'

import { useState } from 'react'
import type { FormField, FormEngineData } from '@/lib/engine-form-types'

interface Props {
  fields: FormField[]
  sampleData: FormEngineData['sampleData']
  onChange: (id: string, value: string | string[]) => void
  onPreview: () => void
  onBack: () => void
  isPreviewing: boolean
  previewUrl: string | null
  previewError: string | null
}

const SKIP_TYPES = new Set(['section_header', 'divider', 'page_break', 'logo', 'running_number'])

const TYPE_LABEL: Record<string, string> = {
  text: 'ข้อความ', multiline: 'หลายบรรทัด', email: 'อีเมล',
  date: 'วันที่', date_range: 'ช่วงวันที่',
  checkbox: 'Checkbox', radio: 'Radio', dropdown: 'Dropdown',
  signature: 'ลายเซ็น', table: 'ตาราง',
}

export function SampleDataEditor({ fields, sampleData, onChange, onPreview, onBack, isPreviewing, previewUrl, previewError }: Props) {
  const editable = fields.filter(f => !SKIP_TYPES.has(f.type))

  return (
    <div className="flex gap-4 h-[calc(100vh-120px)]">
      {/* Left: sample data form */}
      <div className="w-80 shrink-0 flex flex-col gap-3 overflow-y-auto pr-1">
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <p className="text-xs font-bold text-amber-800">หน้า 1 — ตัวอย่างที่กรอกแล้ว</p>
          <p className="text-xs text-amber-600 mt-0.5">แก้ไขข้อมูลตัวอย่างด้านล่าง แล้วกด Preview PDF</p>
        </div>

        {editable.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">ไม่มี field ที่แก้ไขได้</p>
        )}

        {editable.map(f => (
          <FieldInput key={f.id} field={f} value={sampleData[f.id] ?? ''} onChange={v => onChange(f.id, v)} />
        ))}

        <button
          onClick={onPreview}
          disabled={isPreviewing}
          className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded font-medium flex items-center justify-center gap-2 transition-colors mt-2"
        >
          {isPreviewing ? (
            <><span className="animate-spin">⏳</span> กำลัง Generate PDF...</>
          ) : (
            <>👁️ Preview PDF 2 หน้า</>
          )}
        </button>

        {previewError && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">{previewError}</p>
        )}
      </div>

      {/* Right: PDF iframe */}
      <div className="flex-1 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden flex flex-col">
        {previewUrl ? (
          <iframe src={previewUrl} className="w-full h-full" title="PDF Preview" />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-2">
            <p className="text-3xl">📄</p>
            <p className="text-sm font-medium text-gray-600">PDF Preview</p>
            <p className="text-xs text-gray-400">กด "Preview PDF" เพื่อดูตัวอย่าง</p>
          </div>
        )}
      </div>
    </div>
  )
}

function FieldInput({ field, value, onChange }: { field: FormField; value: string | string[]; onChange: (v: string | string[]) => void }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
      <div className="flex items-center gap-1 mb-1">
        <span className="text-xs font-bold text-gray-700 flex-1">{field.label || '(ไม่มีชื่อ)'}</span>
        <span className="text-xs text-gray-400 bg-gray-100 px-1 rounded">{TYPE_LABEL[field.type] ?? field.type}</span>
      </div>

      {(field.type === 'text' || field.type === 'email' || field.type === 'date' || field.type === 'date_range') && (
        <input
          className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-amber-400"
          value={typeof value === 'string' ? value : ''}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder ?? ''}
        />
      )}

      {field.type === 'multiline' && (
        <textarea
          className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-amber-400 resize-none"
          rows={3}
          value={typeof value === 'string' ? value : ''}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder ?? ''}
        />
      )}

      {field.type === 'radio' || field.type === 'dropdown' ? (
        <div className="flex flex-col gap-1">
          {(field.options ?? []).map(opt => (
            <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name={field.id}
                checked={value === opt}
                onChange={() => onChange(opt)}
                className="accent-amber-600"
              />
              {opt}
            </label>
          ))}
        </div>
      ) : null}

      {field.type === 'checkbox' && (
        <div className="flex flex-col gap-1">
          {(field.options ?? []).map(opt => {
            const checked = Array.isArray(value) ? value.includes(opt) : false
            return (
              <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    const arr = Array.isArray(value) ? [...value] : []
                    onChange(checked ? arr.filter(v => v !== opt) : [...arr, opt])
                  }}
                  className="accent-amber-600"
                />
                {opt}
              </label>
            )
          })}
        </div>
      )}

      {field.type === 'signature' && (
        <p className="text-xs text-gray-400 italic">ลายเซ็น — แสดงเส้นว่างใน PDF</p>
      )}
    </div>
  )
}
