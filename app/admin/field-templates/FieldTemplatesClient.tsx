'use client'

import { useState } from 'react'
import type { FormFieldType } from '@/lib/engine-form-types'
import { PALETTE_GROUPS_FROM_REGISTRY } from '@/lib/field-registry'

const FIELD_TYPES: { value: FormFieldType; label: string }[] = [
  { value: 'text',          label: 'ข้อความ (text)' },
  { value: 'multiline',     label: 'หลายบรรทัด (multiline)' },
  { value: 'number',        label: 'ตัวเลข (number)' },
  { value: 'currency',      label: 'จำนวนเงิน (currency)' },
  { value: 'date',          label: 'วันที่ (date)' },
  { value: 'date_range',    label: 'ช่วงวันที่ (date_range)' },
  { value: 'checkbox',      label: 'Checkbox' },
  { value: 'radio',         label: 'Radio' },
  { value: 'dropdown',      label: 'Dropdown' },
  { value: 'email',         label: 'อีเมล (email)' },
  { value: 'signature',     label: 'ลายเซ็น (signature)' },
  { value: 'photo_upload',  label: 'รูปภาพ (photo_upload)' },
]

const ICONS = ['✏️','📝','🔢','💲','📅','☑️','🔘','▾','📧','🖊️','📸','🏦','🧾','💳','📉','🏷️','💰','⚖️','🔬','🛂','📋','🔧','🏗️','⭐','🎓','🎫']

const BUILTIN_GROUPS = PALETTE_GROUPS_FROM_REGISTRY.map(g => g.name)

type Row = { id: string; label: string; type: string; icon: string; grp: string; preset: object }

interface Props {
  initialRows: Row[]
}

export function FieldTemplatesClient({ initialRows }: Props) {
  const [rows, setRows] = useState<Row[]>(initialRows)
  const [label, setLabel]   = useState('')
  const [type, setType]     = useState<FormFieldType>('text')
  const [icon, setIcon]     = useState('✏️')
  const [grp, setGrp]       = useState('')
  const [newGrp, setNewGrp] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  const activeGrp = grp === '__new__' ? newGrp.trim() : grp

  // Custom groups already in DB (not in built-in)
  const customGroups = [...new Set(rows.map(r => r.grp))].filter(g => !BUILTIN_GROUPS.includes(g))

  // Group rows for display
  const grouped = rows.reduce<Record<string, Row[]>>((acc, r) => {
    ;(acc[r.grp] ??= []).push(r)
    return acc
  }, {})

  async function handleAdd() {
    if (!label.trim()) return setError('กรุณาใส่ชื่อ field')
    if (!activeGrp) return setError('กรุณาเลือกหรือใส่ชื่อกลุ่ม')
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/field-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: label.trim(), type, icon, grp: activeGrp }),
      })
      const data = await res.json()
      if (!res.ok) return setError(data.error ?? 'เกิดข้อผิดพลาด')
      setRows(prev => [...prev, { id: data.id, label: label.trim(), type, icon, grp: activeGrp, preset: {} }])
      setLabel('')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/field-templates/${id}`, { method: 'DELETE' })
    setRows(prev => prev.filter(r => r.id !== id))
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">Field Templates</h1>
        <p className="text-sm text-gray-500 mt-0.5">เพิ่ม field ที่ใช้บ่อยให้โชว์ใน Form Builder palette</p>
      </div>

      {/* Add form */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 space-y-3">
        <p className="text-sm font-bold text-gray-700">+ เพิ่ม Field ใหม่</p>

        <div className="flex gap-2">
          {/* Icon picker */}
          <select
            value={icon}
            onChange={e => setIcon(e.target.value)}
            className="text-lg border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-amber-400 w-20 text-center"
          >
            {ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
          </select>

          {/* Label */}
          <input
            className="flex-1 text-sm border border-gray-200 rounded px-3 py-1.5 focus:outline-none focus:border-amber-400"
            placeholder="ชื่อ field เช่น ERP Name, รหัสลูกค้า"
            value={label}
            onChange={e => setLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
        </div>

        <div className="flex gap-2">
          {/* Field type */}
          <select
            value={type}
            onChange={e => setType(e.target.value as FormFieldType)}
            className="flex-1 text-sm border border-gray-200 rounded px-3 py-1.5 focus:outline-none focus:border-amber-400"
          >
            {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>

          {/* Group */}
          <select
            value={grp}
            onChange={e => setGrp(e.target.value)}
            className="flex-1 text-sm border border-gray-200 rounded px-3 py-1.5 focus:outline-none focus:border-amber-400"
          >
            <option value="">— เลือกกลุ่ม —</option>
            {customGroups.map(g => <option key={g} value={g}>{g}</option>)}
            {BUILTIN_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
            <option value="__new__">+ สร้างกลุ่มใหม่...</option>
          </select>
        </div>

        {grp === '__new__' && (
          <input
            className="w-full text-sm border border-amber-300 rounded px-3 py-1.5 focus:outline-none focus:border-amber-500"
            placeholder="ชื่อกลุ่มใหม่ เช่น 🧾 บัญชี"
            value={newGrp}
            onChange={e => setNewGrp(e.target.value)}
          />
        )}

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          onClick={handleAdd}
          disabled={saving || !label.trim() || !activeGrp}
          className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white text-sm font-bold py-2 rounded transition-colors"
        >
          {saving ? 'กำลังบันทึก...' : '+ เพิ่ม Field'}
        </button>
      </div>

      {/* Field list grouped */}
      {Object.keys(grouped).length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">ยังไม่มี field template</p>
      ) : (
        Object.entries(grouped).map(([grpName, items]) => (
          <div key={grpName} className="mb-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 px-1">{grpName}</p>
            <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="text-lg leading-none">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.type}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-gray-300 hover:text-red-500 text-sm transition-colors"
                    title="ลบ"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
