'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
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

type Category = { id: string; name: string; emoji: string }

interface InitialData {
  title: string
  fields: FormField[]
  sampleData: FormEngineData['sampleData']
  slug: string
  tier: string
  categoryId: string
}

interface Props {
  categories: Category[]
  templateId?: string
  initialData?: InitialData
}

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

function toSlug(title: string): string {
  return `form-${Date.now()}`
}

const TIERS = [
  { value: 'free',     label: 'ฟรี',        price: '฿0' },
  { value: 'standard', label: 'Standard',   price: '฿20' },
  { value: 'premium',  label: 'Premium',    price: '฿50' },
  { value: 'ultra',    label: 'Ultra',      price: '฿100' },
]

const STEPS = ['1. สร้างฟอร์ม', '2. ตัวอย่างข้อมูล', '3. บันทึก']

export function FormBuilderClient({ categories, templateId, initialData }: Props) {
  const router = useRouter()
  const isEditMode = !!templateId
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [fields, setFields] = useState<FormField[]>(initialData?.fields ?? [])
  const [formTitle, setFormTitle] = useState(initialData?.title ?? '')
  const [sampleData, setSampleData] = useState<FormEngineData['sampleData']>(initialData?.sampleData ?? {})

  // Step 2 preview state
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)

  // Step 3 metadata state
  const [slug, setSlug] = useState(initialData?.slug ?? '')
  const [tier, setTier] = useState(initialData?.tier ?? 'standard')
  const [categoryId, setCategoryId] = useState(initialData?.categoryId ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<{ slug: string; pdfPath: string } | null>(null)

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

  function goToStep3() {
    setSlug(toSlug(formTitle))
    setSaveError(null)
    setStep(3)
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

  async function handleSave() {
    setIsSaving(true)
    setSaveError(null)
    try {
      const res = isEditMode
        ? await fetch('/api/admin/form-builder/update', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ templateId, fields, sampleData, title: formTitle, tier, categoryId: categoryId || undefined }),
          })
        : await fetch('/api/admin/form-builder/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fields, sampleData, title: formTitle, slug, tier, categoryId: categoryId || undefined }),
          })
      const data = await res.json()
      if (!res.ok) {
        setSaveError(data.error ?? 'Save failed')
        return
      }
      setSaveSuccess({ slug: data.slug, pdfPath: data.pdfPath })
    } catch (e) {
      setSaveError(String(e))
    } finally {
      setIsSaving(false)
    }
  }

  const isEmpty = fields.length === 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 flex-wrap">
        <div className="shrink-0">
          <h1 className="text-base font-bold text-gray-800">
            {isEditMode ? '✏️ แก้ไขฟอร์ม' : '📋 Form Builder'}
          </h1>
          <p className="text-xs text-gray-500">
            {isEditMode ? `กำลังแก้ไข: ${initialData?.slug}` : 'สร้างฟอร์มแล้วขายเป็น PDF 2 หน้า'}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
                step === i + 1 ? 'bg-amber-600 text-white' :
                step > i + 1 ? 'bg-green-100 text-green-700' :
                'bg-gray-100 text-gray-400'
              }`}>
                {step > i + 1 ? '✓ ' : ''}{s}
              </span>
              {i < STEPS.length - 1 && <span className="text-gray-300 text-xs">›</span>}
            </div>
          ))}
        </div>

        {step === 1 && (
          <input
            className="flex-1 min-w-[200px] max-w-xs border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-amber-400"
            placeholder="ชื่อฟอร์ม เช่น ใบลางาน"
            value={formTitle}
            onChange={e => setFormTitle(e.target.value)}
          />
        )}

        <div className="ml-auto flex items-center gap-2">
          {step === 1 && (
            <>
              <span className="text-xs text-gray-400">{fields.length} fields</span>
              <button
                onClick={goToStep2}
                disabled={isEmpty || !formTitle.trim()}
                className="bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white text-sm px-4 py-1.5 rounded font-medium transition-colors whitespace-nowrap"
              >
                ถัดไป: ตัวอย่างข้อมูล →
              </button>
            </>
          )}
          {step === 2 && (
            <>
              <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded">
                ← กลับแก้ฟอร์ม
              </button>
              <button
                onClick={goToStep3}
                className="bg-amber-600 hover:bg-amber-700 text-white text-sm px-4 py-1.5 rounded font-medium transition-colors whitespace-nowrap"
              >
                ถัดไป: บันทึก →
              </button>
            </>
          )}
          {step === 3 && (
            <button onClick={() => setStep(2)} className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded">
              ← กลับแก้ตัวอย่าง
            </button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="p-4">

        {/* ── STEP 1: Build form ── */}
        {step === 1 && (
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
        )}

        {/* ── STEP 2: Sample data + preview ── */}
        {step === 2 && (
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

        {/* ── STEP 3: Metadata + save ── */}
        {step === 3 && (
          <div className="max-w-lg mx-auto bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <h2 className="text-base font-bold text-gray-800">บันทึกเป็น Template</h2>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">ชื่อฟอร์ม</label>
              <p className="text-sm font-medium text-gray-800 bg-gray-50 border border-gray-200 rounded px-3 py-2">{formTitle}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Slug (URL)</label>
              {isEditMode ? (
                <>
                  <p className="text-sm font-mono bg-gray-50 border border-gray-200 rounded px-3 py-2 text-gray-500">{slug}</p>
                  <p className="text-xs text-gray-400 mt-1">Slug ไม่สามารถเปลี่ยนได้หลังสร้างแล้ว</p>
                </>
              ) : (
                <>
                  <input
                    className="w-full text-sm border border-gray-200 rounded px-3 py-2 focus:outline-none focus:border-amber-400 font-mono"
                    value={slug}
                    onChange={e => setSlug(e.target.value)}
                    placeholder="form-leave-request"
                  />
                  <p className="text-xs text-gray-400 mt-1">ใช้ตัวอักษรภาษาอังกฤษ ตัวเลข และ - เท่านั้น</p>
                </>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tier / ราคา</label>
              <div className="grid grid-cols-4 gap-2">
                {TIERS.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setTier(t.value)}
                    className={`text-sm border rounded px-2 py-2 text-center transition-colors ${
                      tier === t.value ? 'border-amber-500 bg-amber-50 text-amber-800 font-bold' : 'border-gray-200 text-gray-600 hover:border-amber-300'
                    }`}
                  >
                    <div className="font-medium">{t.label}</div>
                    <div className="text-xs opacity-70">{t.price}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">หมวดหมู่</label>
              <select
                className="w-full text-sm border border-gray-200 rounded px-3 py-2 focus:outline-none focus:border-amber-400"
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
              >
                <option value="">— ไม่ระบุ —</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                ))}
              </select>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-800 space-y-1">
              <p className="font-bold">📋 สรุป</p>
              <p>• {fields.length} fields · PDF 2 หน้า (ตัวอย่าง + เปล่า)</p>
              <p>• บันทึกเป็น draft — กด Publish ใน /admin/templates เมื่อพร้อม</p>
            </div>

            {saveError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{saveError}</p>
            )}

            {!saveSuccess && (
              <button
                onClick={handleSave}
                disabled={isSaving || !slug.trim()}
                className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold py-2.5 rounded transition-colors flex items-center justify-center gap-2"
              >
                {isSaving
                  ? <><span className="animate-spin">⏳</span> กำลัง Generate PDF และบันทึก...</>
                  : isEditMode ? '💾 อัปเดต Template' : '✅ Approve & Save เป็น Draft'
                }
              </button>
            )}

            {saveSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                <p className="text-sm font-bold text-green-800">
                  ✅ {isEditMode ? 'อัปเดตสำเร็จ' : 'บันทึกสำเร็จ'}
                </p>
                <p className="text-xs text-green-700">Slug: <span className="font-mono">{saveSuccess.slug}</span></p>
                <div className="flex flex-col gap-2">
                  <a
                    href={saveSuccess.pdfPath}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-amber-700 underline"
                  >
                    📄 ดู PDF ที่สร้างล่าสุด
                  </a>
                  <button
                    onClick={() => router.push('/admin/templates')}
                    className="w-full border border-gray-300 text-sm font-medium text-gray-700 py-2 rounded hover:bg-gray-50 transition-colors"
                  >
                    ไปหน้า Template Manager →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
