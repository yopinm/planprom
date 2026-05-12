'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import type { FormField, FormFieldType, FormEngineData } from '@/lib/engine-form-types'
import { autoGenSampleData } from '@/lib/engine-form-types'
import { FieldPalette } from './FieldPalette'
import { FieldCard } from './FieldCard'
import { SampleDataEditor } from './SampleDataEditor'

function makeId() {
  return Math.random().toString(36).slice(2, 9)
}

function makeField(type: FormFieldType): FormField {
  const defaults: Partial<Record<FormFieldType, Partial<FormField>>> = {
    checkbox:       { label: 'เลือกรายการ', options: ['ตัวเลือก 1', 'ตัวเลือก 2'] },
    radio:          { label: 'เลือกหนึ่งรายการ', options: ['ตัวเลือก 1', 'ตัวเลือก 2'] },
    dropdown:       { label: 'เลือกจากรายการ', options: ['ตัวเลือก 1', 'ตัวเลือก 2'] },
    table:          { label: 'ตาราง', tableColumns: ['รายการ', 'จำนวน', 'หมายเหตุ'], tableRows: 3 },
    section_header: { label: 'หัวข้อส่วน' },
    signature:      { label: 'ลายเซ็นผู้ขอ' },
    running_number: { label: 'เลขที่เอกสาร' },
    logo:           { label: 'โลโก้ / ตราองค์กร' },
    divider:        { label: 'เส้นคั่น' },
    page_break:     { label: 'ขึ้นหน้าใหม่' },
    text:           { label: 'ชื่อ-นามสกุล' },
    multiline:      { label: 'รายละเอียด' },
    email:          { label: 'อีเมล' },
    date:           { label: 'วันที่' },
    date_range:     { label: 'ช่วงวันที่' },
  }
  return { id: makeId(), type, label: '', width: 'full', ...defaults[type] }
}

const STEPS = ['สร้างฟอร์ม', 'ข้อมูลตัวอย่าง']

export function FormBuilderClient() {
  const [step, setStep] = useState<1 | 2>(1)
  const [fields, setFields] = useState<FormField[]>([])
  const [formTitle, setFormTitle] = useState('')
  const [sampleData, setSampleData] = useState<FormEngineData['sampleData']>({})
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const addField = useCallback((type: FormFieldType) => {
    setFields(prev => [...prev, makeField(type)])
  }, [])

  const updateField = useCallback((id: string, updated: FormField) => {
    setFields(prev => prev.map(f => f.id === id ? updated : f))
  }, [])

  const deleteField = useCallback((id: string) => {
    setFields(prev => prev.filter(f => f.id !== id))
  }, [])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setFields(prev => {
        const oldIndex = prev.findIndex(f => f.id === active.id)
        const newIndex = prev.findIndex(f => f.id === over.id)
        return arrayMove(prev, oldIndex, newIndex)
      })
    }
  }

  function goToStep2() {
    setSampleData(autoGenSampleData(fields))
    setPreviewUrl(null)
    setPreviewError(null)
    setStep(2)
  }

  async function handlePreview() {
    setIsPreviewing(true)
    setPreviewError(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    try {
      const res = await fetch('/api/admin/form-builder/generate-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields, sampleData, title: formTitle }),
      })
      if (!res.ok) {
        const { error } = await res.json()
        setPreviewError(error ?? 'Generate failed')
        return
      }
      const blob = await res.blob()
      setPreviewUrl(URL.createObjectURL(blob))
    } catch (e) {
      setPreviewError(String(e))
    } finally {
      setIsPreviewing(false)
    }
  }

  const isEmpty = fields.length === 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4">
        <div>
          <h1 className="text-base font-bold text-gray-800">📋 Form Builder</h1>
          <p className="text-xs text-gray-500">สร้างฟอร์มแล้วขายเป็น PDF 2 หน้า</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${step === i + 1 ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                {i + 1}. {s}
              </span>
              {i < STEPS.length - 1 && <span className="text-gray-300 text-xs">›</span>}
            </div>
          ))}
        </div>

        <input
          className="flex-1 max-w-xs border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-amber-400"
          placeholder="ชื่อฟอร์ม เช่น ใบลางาน"
          value={formTitle}
          onChange={e => setFormTitle(e.target.value)}
          disabled={step === 2}
        />

        <div className="ml-auto flex items-center gap-2">
          {step === 1 ? (
            <>
              <span className="text-xs text-gray-400">{fields.length} fields</span>
              <button
                onClick={goToStep2}
                disabled={isEmpty || !formTitle.trim()}
                className="bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white text-sm px-4 py-1.5 rounded font-medium transition-colors"
              >
                ถัดไป: ตัวอย่างข้อมูล →
              </button>
            </>
          ) : (
            <button
              onClick={() => setStep(1)}
              className="text-sm text-gray-600 hover:text-gray-800 border border-gray-200 px-3 py-1.5 rounded transition-colors"
            >
              ← กลับแก้ฟอร์ม
            </button>
          )}
        </div>
      </div>

      {/* Main layout */}
      <div className="p-4">
        {step === 1 ? (
          <div className="flex gap-4">
            <FieldPalette onAdd={addField} />
            <div className="flex-1">
              {isEmpty ? (
                <div className="border-2 border-dashed border-amber-200 rounded-lg bg-amber-50/50 h-64 flex flex-col items-center justify-center text-center gap-2">
                  <p className="text-2xl">📋</p>
                  <p className="text-sm font-medium text-amber-700">ยังไม่มี field</p>
                  <p className="text-xs text-amber-500">คลิก field type ทางซ้ายเพื่อเพิ่มลงฟอร์ม</p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  modifiers={[restrictToVerticalAxis]}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                    {fields.map(field => (
                      <FieldCard
                        key={field.id}
                        field={field}
                        onChange={updated => updateField(field.id, updated)}
                        onDelete={() => deleteField(field.id)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
              {!isEmpty && (
                <p className="text-xs text-gray-400 text-center mt-3">
                  ลากจุด ⠿ เพื่อเรียงลำดับ · คลิก ▼ เพื่อตั้งค่า field
                </p>
              )}
            </div>
          </div>
        ) : (
          <SampleDataEditor
            fields={fields}
            sampleData={sampleData}
            onChange={(id, val) => setSampleData(prev => ({ ...prev, [id]: val }))}
            onPreview={handlePreview}
            onBack={() => setStep(1)}
            isPreviewing={isPreviewing}
            previewUrl={previewUrl}
            previewError={previewError}
          />
        )}
      </div>
    </div>
  )
}
