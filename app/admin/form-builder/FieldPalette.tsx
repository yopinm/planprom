'use client'

import type { FormFieldType } from '@/lib/engine-form-types'

interface PaletteItem {
  type: FormFieldType
  label: string
  icon: string
}

const PALETTE_GROUPS: { name: string; items: PaletteItem[] }[] = [
  {
    name: 'ข้อความ',
    items: [
      { type: 'text',      icon: '✏️', label: 'ข้อความบรรทัดเดียว' },
      { type: 'multiline', icon: '📄', label: 'ข้อความหลายบรรทัด' },
      { type: 'email',     icon: '✉️', label: 'อีเมล' },
    ],
  },
  {
    name: 'วันที่',
    items: [
      { type: 'date',       icon: '📅', label: 'วันที่' },
      { type: 'date_range', icon: '📆', label: 'ช่วงวันที่' },
    ],
  },
  {
    name: 'ตัวเลือก',
    items: [
      { type: 'checkbox', icon: '☑️', label: 'Checkbox' },
      { type: 'radio',    icon: '🔘', label: 'Radio Button' },
      { type: 'dropdown', icon: '▾',  label: 'Dropdown' },
    ],
  },
  {
    name: 'พิเศษ',
    items: [
      { type: 'signature',      icon: '🖊️', label: 'ลายเซ็น' },
      { type: 'logo',           icon: '🏷️', label: 'โลโก้ / ตราองค์กร' },
      { type: 'running_number', icon: '🔢', label: 'เลขที่เอกสาร' },
      { type: 'table',          icon: '🗃️', label: 'ตาราง' },
    ],
  },
  {
    name: 'โครงสร้าง',
    items: [
      { type: 'section_header', icon: '📌', label: 'หัวข้อส่วน' },
      { type: 'divider',        icon: '➖', label: 'เส้นคั่น' },
      { type: 'page_break',     icon: '📃', label: 'ขึ้นหน้าใหม่' },
    ],
  },
]

interface Props {
  onAdd: (type: FormFieldType) => void
}

export function FieldPalette({ onAdd }: Props) {
  return (
    <div className="w-56 shrink-0 bg-white border border-gray-200 rounded-lg overflow-y-auto max-h-[calc(100vh-160px)]">
      <div className="px-3 py-2 border-b border-gray-100 bg-amber-50">
        <p className="text-xs font-bold text-amber-800">Field Types</p>
        <p className="text-xs text-amber-600">คลิกเพื่อเพิ่มลงฟอร์ม</p>
      </div>
      {PALETTE_GROUPS.map(g => (
        <div key={g.name} className="px-2 py-2 border-b border-gray-100 last:border-0">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 px-1">{g.name}</p>
          {g.items.map(item => (
            <button
              key={item.type}
              onClick={() => onAdd(item.type)}
              className="w-full text-left px-2 py-1.5 rounded text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-800 flex items-center gap-2 transition-colors"
            >
              <span className="text-base leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}
