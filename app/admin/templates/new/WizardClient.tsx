'use client'
import { useState, useTransition, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createTemplateWizardAction, checkSlugExists } from '../actions'
import type { TocItem } from '@/lib/pdf-types'
import { ChecklistEngineForm } from './ChecklistEngineForm'
// DEPRECATED 2026-05-12 — engine-planner ถูก hidden แล้ว ลบได้หลัง 2026-05-19
// import { PlannerEngineForm } from './PlannerEngineForm'
import { PipelinePlannerForm } from './PipelinePlannerForm'
import { ReportEngineForm } from './ReportEngineForm'

type Mode = 'upload' | 'docx' | 'clone' | 'engine-checklist' | 'engine-planner' | 'engine-pipeline' | 'engine-report'
type ValidTag = 'bestseller' | 'trending' | 'staple' | 'new' | 'premium' | 'free'

export type Category = { slug: string; name: string; emoji: string }
export type CloneSource = { id: string; slug: string; title: string; tier: string; description: string | null }

const TIER_PRICE: Record<string, number> = { free: 0, standard: 30, premium: 30, ultra: 30 }
const ALL_TAGS: { tag: ValidTag; label: string }[] = [
  { tag: 'new',        label: 'ใหม่' },
  { tag: 'trending',   label: 'ร้อนแรง' },
  { tag: 'bestseller', label: 'ขายดี' },
  { tag: 'staple',     label: 'ยอดนิยมตลอดกาล' },
  { tag: 'premium',    label: 'พรีเมียม' },
  { tag: 'free',       label: 'ฟรี' },
]
const STEP_LABELS = ['Mode', 'Catalog', 'Content', 'Tags', 'Review', 'Publish']

function suggestTierFromPages(n: number): string {
  if (n <= 0) return 'standard'
  if (n === 1) return 'free'
  return 'standard'
}

function autoSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[฀-๿]/g, '')  // strip Thai
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function suggestTags(tier: string): ValidTag[] {
  const tags: ValidTag[] = ['new']
  if (tier === 'free') tags.push('free')
  if (tier === 'premium') tags.push('premium')
  return tags
}

interface Props {
  categories: Category[]
  cloneSources: CloneSource[]
  initialTitle?: string
  initialCatSlug?: string
  initialMode?: Mode
}

export function WizardClient({ categories, cloneSources, initialTitle, initialCatSlug, initialMode }: Props) {
  const router   = useRouter()
  const [pending, startTransition] = useTransition()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const docxInputRef = useRef<HTMLInputElement>(null)
  const modeRef      = useRef<Mode | null>(null)
  const titleRef     = useRef('')
  const slugTouchedRef = useRef(false)

  const initStep = initialMode && initialCatSlug && initialTitle ? 3 : initialMode && initialCatSlug ? 3 : initialMode ? 2 : 1

  const [step,            setStep]           = useState<number>(initStep)
  const [mode,            setMode]           = useState<Mode | null>(initialMode ?? null)
  const [catSlug,         setCatSlug]        = useState(initialCatSlug ?? '')
  const [title,           setTitle]          = useState(initialTitle ?? '')
  const [slug,            setSlug]           = useState(initialTitle ? autoSlug(initialTitle) : '')
  const [slugTouched,     setSlugTouched]    = useState(false)
  const [desc,            setDesc]           = useState('')
  const [pdfPath,         setPdfPath]        = useState('')
  const [pdfName,         setPdfName]        = useState('')
  const [uploadState,     setUploadState]    = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const [uploadError,     setUploadError]    = useState('')
  // docx mode state
  const [docxName,        setDocxName]       = useState('')
  const [docxState,       setDocxState]      = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const [docxError,       setDocxError]      = useState('')
  const [tocSections,     setTocSections]    = useState<TocItem[]>([])
  const [watermarkOn,     setWatermarkOn]    = useState(true)
  const [watermarkText,   setWatermarkText]  = useState('planprom.com')

  const [pages,       setPages]      = useState('')
  const [tier,        setTier]       = useState('standard')
  const [docType,     setDocType]    = useState('checklist')
  const [tags,        setTags]       = useState<ValidTag[]>(['new'])
  // DEPRECATED 2026-05-12 — clone hidden แล้ว ลบได้หลัง 2026-05-19
  // const [cloneId, setCloneId] = useState('')
  const [error,       setError]      = useState('')

  // engine mode state
  const [engineData,        setEngineData]        = useState<Record<string, unknown> | null>(null)
  const [engineState,       setEngineState]       = useState<'idle'|'generating'|'done'|'error'>('idle')
  const [engineError,       setEngineError]       = useState('')
  const [engineDocCode,     setEngineDocCode]     = useState('')
  const [enginePreviewPath,  setEnginePreviewPath]  = useState('')
  const [enginePreviewPages, setEnginePreviewPages] = useState<string[]>([])
  const [engineProgress,    setEngineProgress]    = useState(0)

  const ENGINE_STEPS = [
    'สร้าง HTML template...',
    'กำลัง generate PDF (~15 วินาที)',
    'กำลังสร้าง preview image...',
    'บันทึกข้อมูลลง DB...',
  ]

  useEffect(() => {
    if (engineState !== 'generating') return
    const t1 = setTimeout(() => setEngineProgress(1), 1000)
    const t2 = setTimeout(() => setEngineProgress(2), 15000)
    const t3 = setTimeout(() => setEngineProgress(3), 24000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [engineState])

  // keep refs in sync so callbacks don't close over stale values
  modeRef.current      = mode
  titleRef.current     = title
  slugTouchedRef.current = slugTouched

  const handleEngineDataChange = useCallback((data: Record<string, unknown>) => {
    setEngineData(data)
    // pipeline: auto-fill title/slug from meta.title so "ถัดไป" isn't blocked
    if (modeRef.current === 'engine-pipeline') {
      const pipelineTitle = (data as { meta?: { title?: string } })?.meta?.title ?? ''
      if (pipelineTitle) {
        setTitle(prev => prev.trim() ? prev : pipelineTitle)
        if (!slugTouchedRef.current) {
          const generated = autoSlug(pipelineTitle)
          const bkk = new Date(Date.now() + 7 * 3600000)
          const ds   = bkk.toISOString().slice(0, 10).replace(/-/g, '')
          setSlug(generated || `pipeline-${ds}`)
        }
      }
    }
  }, [])

  const isEngine  = mode === 'engine-checklist' || mode === 'engine-planner' || mode === 'engine-pipeline' || mode === 'engine-report'
  const priceBaht = TIER_PRICE[tier] ?? 30
  const catName   = categories.find(c => c.slug === catSlug)?.name ?? ''

  function handleTitleChange(val: string) {
    setTitle(val)
    if (!slugTouched) setSlug(autoSlug(val))
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') { setUploadError('ต้องเป็น PDF เท่านั้น'); return }
    if (file.size > 20 * 1024 * 1024) { setUploadError('ไฟล์ใหญ่เกิน 20 MB'); return }

    setUploadState('uploading')
    setUploadError('')
    setPdfName(file.name)

    const fd = new FormData()
    fd.append('file', file)
    fd.append('slug', slug || 'template')

    try {
      const res  = await fetch('/api/admin/templates/upload-pdf', { method: 'POST', body: fd })
      const json = await res.json() as { path?: string; error?: string }
      if (!res.ok || json.error) {
        setUploadError(json.error ?? 'Upload failed')
        setUploadState('error')
      } else {
        setPdfPath(json.path ?? '')
        setUploadState('done')
      }
    } catch (err) {
      setUploadError(String(err))
      setUploadState('error')
    }
  }

  async function handleDocxChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.docx')) { setDocxError('ต้องเป็นไฟล์ .docx เท่านั้น'); return }
    if (file.size > 20 * 1024 * 1024) { setDocxError('ไฟล์ใหญ่เกิน 20 MB'); return }

    setDocxState('uploading')
    setDocxError('')
    setDocxName(file.name)

    const fd = new FormData()
    fd.append('file', file)
    fd.append('slug', slug || 'template')
    fd.append('title', title || slug || 'template')
    fd.append('document_type', docType)
    fd.append('watermark_text', watermarkOn ? watermarkText : '')

    try {
      const res  = await fetch('/api/admin/templates/upload-docx', { method: 'POST', body: fd })
      const json = await res.json() as { path?: string; toc_sections?: TocItem[]; watermark_text?: string | null; error?: string }
      if (!res.ok || json.error) {
        setDocxError(json.error ?? 'Generate failed')
        setDocxState('error')
      } else {
        setPdfPath(json.path ?? '')
        setTocSections(json.toc_sections ?? [])
        setDocxState('done')
      }
    } catch (err) {
      setDocxError(String(err))
      setDocxState('error')
    }
  }

  function handlePagesChange(val: string) {
    setPages(val)
    const n = Number(val)
    if (n > 0) setTier(suggestTierFromPages(n))
  }

  // DEPRECATED 2026-05-12 — clone hidden แล้ว ลบได้หลัง 2026-05-19
  // function applyClone(id: string) {
  //   setCloneId(id)
  //   const src = cloneSources.find(s => s.id === id)
  //   if (!src) return
  //   setTitle(src.title + ' (copy)')
  //   setSlug(src.slug + '-copy')
  //   setSlugTouched(true)
  //   setDesc(src.description ?? '')
  //   setTier(src.tier)
  // }

  function goToStep(n: number) {
    setError('')
    setStep(n)
  }

  async function handleEngineGenerate() {
    if (!title.trim()) { setError('ใส่ชื่อ template ก่อน'); return }
    if (!slug.trim())  { setError('ใส่ slug ก่อน'); return }
    if (!engineData)   { setError('กรอกข้อมูล engine ก่อน'); return }
    setEngineState('generating')
    setEngineProgress(0)
    setEngineError('')
    setError('')
    try {
      const apiUrl =
        mode === 'engine-planner'  ? '/api/admin/templates/generate-planner' :
        mode === 'engine-pipeline' ? '/api/admin/templates/generate-planner-pipeline' :
        mode === 'engine-report'   ? '/api/admin/templates/generate-report' :
        '/api/admin/templates/generate-engine'
      const bodyPayload =
        mode === 'engine-planner' || mode === 'engine-pipeline' || mode === 'engine-report'
          ? { engine_data: engineData, slug: slug.trim(), watermark_text: watermarkOn ? watermarkText : undefined }
          : { engine_type: 'checklist', engine_data: engineData, slug: slug.trim(), watermark_text: watermarkOn ? watermarkText : undefined, category_name: catName || undefined }
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      })
      const json = await res.json() as { path?: string; preview_path?: string; preview_pages?: string[]; doc_code?: string; plan_code?: string; error?: string }
      if (!res.ok || json.error) {
        setEngineError(json.error ?? 'Generate failed')
        setEngineState('error')
      } else {
        setPdfPath(json.path ?? '')
        setEngineDocCode(json.doc_code ?? json.plan_code ?? '')
        setEnginePreviewPath(json.preview_path ?? '')
        setEnginePreviewPages(json.preview_pages ?? [])
        setEngineState('done')
      }
    } catch (err) {
      setEngineError(String(err))
      setEngineState('error')
    }
  }

  async function goNext() {
    if (step === 1 && !mode) { setError('เลือก mode ก่อน'); return }
    if (step === 2 && !catSlug) { setError('เลือก catalog ก่อน'); return }
    if (step === 3) {
      if (!title.trim()) { setError('ใส่ชื่อ template ก่อน'); return }
      const normalSlug = slug.trim().toLowerCase()
      if (!normalSlug)  { setError('Slug ต้องไม่ว่าง'); return }
      if (!/^[a-z0-9-]+$/.test(normalSlug)) { setError('Slug ใช้ได้แค่ a-z, 0-9, - (ห้ามมีช่องว่างหรืออักขระพิเศษ)'); return }
      setSlug(normalSlug)
      // ตรวจ slug ซ้ำก่อนเสียเวลา generate PDF
      try {
        const exists = await checkSlugExists(normalSlug)
        if (exists) {
          setError(`Slug "${normalSlug}" มีอยู่แล้วในระบบ — เปลี่ยน Slug ก่อนดำเนินการต่อ`)
          return
        }
      } catch {
        setError('ตรวจสอบ Slug ไม่ได้ — ลองใหม่')
        return
      }
      // DEPRECATED 2026-05-12 — clone hidden แล้ว ลบได้หลัง 2026-05-19
      // if (mode === 'clone' && !cloneId) { setError('เลือก template ที่จะ clone ก่อน'); return }
      if (mode === 'docx' && docxState !== 'done') { setError('อัพโหลด .docx ก่อน'); return }
      if ((mode === 'engine-checklist' || mode === 'engine-planner' || mode === 'engine-pipeline' || mode === 'engine-report') && engineState !== 'done') {
        setError('กด "Generate PDF Preview" ก่อนดำเนินการต่อ'); return
      }
      setTags(suggestTags(tier))
    }
    setError('')
    setStep(s => Math.min(s + 1, 6))
  }

  function toggleTag(tag: ValidTag) {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  function handlePublish(status: 'draft' | 'published' | 'draft_preview') {
    const finalDesc = isEngine
      ? mode === 'engine-checklist'
        ? (engineData as Record<string, Record<string, string>> | null)?.s2?.purpose ?? ''
        : mode === 'engine-report'
          ? (engineData as Record<string, Record<string, string>> | null)?.s4?.objective ?? ''
          : ((engineData as Record<string, Record<string, string>> | null)?.p1?.description
           ?? (engineData as Record<string, Record<string, string>> | null)?.meta?.description
           ?? '')
      : desc.trim()
    const finalDocType = isEngine
      ? mode === 'engine-checklist' ? 'checklist'
        : mode === 'engine-report' ? 'report'
        : 'planner'
      : docType
    const finalEngineType = isEngine
      ? mode === 'engine-checklist' ? 'checklist'
        : mode === 'engine-pipeline' ? 'pipeline'
        : mode === 'engine-report' ? 'report'
        : 'planner'
      : undefined
    startTransition(async () => {
      const result = await createTemplateWizardAction({
        title: title.trim(),
        slug:  slug.trim(),
        description: finalDesc,
        tier,
        pdfPath: pdfPath.trim(),
        pageCount: pages ? Number(pages) : null,
        hasFormFields: false,
        categorySlug: catSlug,
        tags,
        status,
        documentType: finalDocType,
        tocSections: tocSections.length > 0 ? tocSections : undefined,
        watermarkText: (mode === 'docx' || isEngine) && watermarkOn ? watermarkText : undefined,
        previewPath:  isEngine && enginePreviewPath  ? enginePreviewPath  : undefined,
        previewPages: isEngine && enginePreviewPages.length > 0 ? enginePreviewPages : undefined,
        engineType: finalEngineType,
        engineData: isEngine && engineData
          ? (engineDocCode && (engineData as Record<string, Record<string,unknown>>).s1
              ? { ...engineData, s1: { ...(engineData as Record<string, Record<string,unknown>>).s1, docCode: engineDocCode } }
              : engineData)
          : undefined,
      })
      if (result.error) {
        setError(result.error)
      } else {
        router.push('/admin/templates')
      }
    })
  }

  // ── Shared styles ──────────────────────────────────────────────────────────
  const INPUT = 'w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:bg-white'

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEP_LABELS.map((label, i) => {
            const n = i + 1
            const done    = step > n
            const current = step === n
            return (
              <div key={n} className="flex flex-1 flex-col items-center">
                <button
                  onClick={() => done ? goToStep(n) : undefined}
                  disabled={!done}
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-black transition
                    ${current ? 'bg-amber-600 text-white shadow-md' : done ? 'bg-black text-white cursor-pointer' : 'bg-neutral-200 text-neutral-400'}`}
                >
                  {done ? '✓' : n}
                </button>
                <span className={`mt-1 text-[9px] font-bold uppercase tracking-wider ${current ? 'text-amber-600' : done ? 'text-black' : 'text-neutral-400'}`}>
                  {label}
                </span>
                {i < STEP_LABELS.length - 1 && (
                  <div className={`absolute hidden`} />
                )}
              </div>
            )
          })}
        </div>
        <div className="mt-3 h-1 w-full rounded-full bg-neutral-200">
          <div
            className="h-1 rounded-full bg-amber-600 transition-all"
            style={{ width: `${((step - 1) / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          ⚠️ {error}
        </div>
      )}

      {/* ── STEP 1: Mode ───────────────────────────────────────────────────── */}
      {step === 1 && (
        <div>
          <h2 className="mb-1 text-xl font-black text-black">เลือก Mode</h2>
          <p className="mb-6 text-sm text-neutral-500">template นี้จะเริ่มยังไง?</p>
          <div className="grid gap-3">
            {([
              { m: 'engine-checklist' as Mode, icon: '✅', title: 'Engine: Checklist', desc: 'กรอกข้อมูล 5 Section → ระบบสร้าง PDF เช็คลิสต์มาตรฐานอัตโนมัติ' },
              // DEPRECATED 2026-05-12 — ลบได้หลัง 2026-05-19
              // { m: 'engine-planner' as Mode, icon: '📅', title: 'Engine: Planner', desc: 'กรอกข้อมูล 4 Pillar → ระบบสร้าง PDF Planner ครบถ้วนอัตโนมัติ' },
              { m: 'engine-pipeline'  as Mode, icon: '🔄', title: 'Engine: Planner Pipeline',  desc: 'กรอก 5 แกน (เป้า → ภาพรวม → สัปดาห์ → วัน → รีวิว) → ระบบสร้าง PDF Planner อัตโนมัติ' },
              { m: 'engine-report'   as Mode, icon: '📊', title: 'Engine: Report',             desc: 'กรอก 8 Section (Cover → TOC → Summary → Content → Conclusion) → ระบบสร้าง PDF รายงานมืออาชีพ' },
              { m: 'docx'             as Mode, icon: '📝', title: 'สร้างจาก .docx',    desc: 'อัพโหลด .docx → ระบบ generate PDF มาตรฐาน A4 อัตโนมัติ' },
              { m: 'upload'           as Mode, icon: '📤', title: 'Upload PDF',         desc: 'มี PDF อยู่แล้ว — อัพโหลดเข้าระบบโดยตรง' },
              // DEPRECATED 2026-05-12 — ลบได้หลัง 2026-05-19
              // { m: 'clone' as Mode, icon: '✏️', title: 'Clone', desc: 'Clone จาก template ที่มีอยู่ แล้วแก้ไข' },
            ] as { m: Mode; icon: string; title: string; desc: string }[]).map(({ m, icon, title: t, desc }) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError('') }}
                className={`flex items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left transition ${
                  mode === m ? 'border-amber-600 bg-amber-50 shadow-md' : 'border-neutral-200 bg-white hover:border-amber-300'
                }`}
              >
                <span className="text-3xl">{icon}</span>
                <div>
                  <p className="font-black text-black">{t}</p>
                  <p className="text-sm text-neutral-500">{desc}</p>
                </div>
                {mode === m && <span className="ml-auto text-amber-600 font-black">✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── STEP 2: Catalog ─────────────────────────────────────────────────── */}
      {step === 2 && (
        <div>
          <h2 className="mb-1 text-xl font-black text-black">เลือก Catalog</h2>
          <p className="mb-6 text-sm text-neutral-500">template นี้อยู่ในหมวดไหน?</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {categories.map(cat => (
              <button
                key={cat.slug}
                onClick={() => { setCatSlug(cat.slug); setError('') }}
                className={`flex flex-col items-center rounded-2xl border-2 px-4 py-5 text-center transition ${
                  catSlug === cat.slug ? 'border-amber-600 bg-amber-50 shadow-md' : 'border-neutral-200 bg-white hover:border-amber-300'
                }`}
              >
                <span className="text-3xl">{cat.emoji}</span>
                <span className="mt-2 text-xs font-black text-black leading-snug">{cat.name}</span>
                {catSlug === cat.slug && <span className="mt-1 text-[10px] font-black text-amber-600">✓ เลือกแล้ว</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── STEP 3: Content ─────────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <h2 className="mb-1 text-xl font-black text-black">ข้อมูล Template</h2>
            <p className="mb-4 text-sm text-neutral-500">Mode: <strong>{mode}</strong> · Catalog: <strong>{catName}</strong></p>
          </div>

          {/* DEPRECATED 2026-05-12 — clone UI hidden แล้ว ลบได้หลัง 2026-05-19
          {mode === 'clone' && (
            <div>
              <label className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-neutral-400">
                Clone จาก Template ไหน *
              </label>
              {cloneSources.length === 0 ? (
                <p className="rounded-xl border border-dashed border-neutral-300 px-4 py-3 text-sm text-neutral-400">
                  ยังไม่มี template ให้ clone — ใช้ mode อื่นก่อน
                </p>
              ) : (
                <select
                  value={cloneId}
                  onChange={e => applyClone(e.target.value)}
                  className={INPUT}
                >
                  <option value="">-- เลือก template --</option>
                  {cloneSources.map(s => (
                    <option key={s.id} value={s.id}>{s.title} ({s.tier})</option>
                  ))}
                </select>
              )}
            </div>
          )}
          */}

          <div>
            <label className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-neutral-400">ชื่อ Template (ใช้ในระบบ) *</label>
            <input value={title} onChange={e => handleTitleChange(e.target.value)} placeholder="เช่น แพลนเนอร์งบประมาณรายเดือน" className={INPUT} />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-neutral-400">Slug (ใช้ในระบบ) * (a-z, 0-9, -)</label>
            <input
              value={slug}
              onChange={e => { setSlug(e.target.value); setSlugTouched(true) }}
              placeholder="budget-planner-monthly"
              className={`${INPUT} font-mono`}
            />
            <p className="mt-1 text-[11px] text-neutral-400">URL: /templates/{slug || '...'}</p>
          </div>

          {!isEngine && (
            <div>
              <label className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-neutral-400">คำอธิบาย</label>
              <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} placeholder="เหมาะกับใคร ใช้ทำอะไร" className={INPUT} />
            </div>
          )}

          {isEngine ? (
            <div>
              <label className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-neutral-400">Tier / ราคา</label>
              <select value={tier} onChange={e => setTier(e.target.value)} className={INPUT}>
                <option value="free">Free — ฿0</option>
                <option value="standard">Standard — ฿30</option>
              </select>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-neutral-400">จำนวนหน้า</label>
                <input
                  type="number" min="1" value={pages}
                  onChange={e => handlePagesChange(e.target.value)}
                  placeholder="2"
                  className={INPUT}
                />
                {pages && <p className="mt-1 text-[11px] text-amber-600 font-bold">แนะนำ: {tier} (฿{TIER_PRICE[tier]})</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-neutral-400">Tier / ราคา</label>
                <select value={tier} onChange={e => setTier(e.target.value)} className={INPUT}>
                  <option value="free">Free — ฿0</option>
                  <option value="standard">Standard — ฿30</option>
                </select>
              </div>
            </div>
          )}

          {!isEngine && (
            <div>
              <label className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-neutral-400">ประเภทเอกสาร *</label>
              <select value={docType} onChange={e => setDocType(e.target.value)} className={INPUT}>
                <option value="checklist">✅ Checklist — รายการตรวจสอบ</option>
                <option value="planner">📅 Planner — วางแผนล่วงหน้า</option>
                <option value="form">📝 Form — ฟอร์มกรอกข้อมูล</option>
                <option value="report">📊 Report — รายงาน/สรุปผล</option>
              </select>
            </div>
          )}

          {(mode === 'engine-checklist' || mode === 'engine-planner' || mode === 'engine-pipeline' || mode === 'engine-report') && (
            <div className="space-y-4">
              {/* Watermark */}
              <div>
                <label className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-neutral-400">Watermark</label>
                <div className="flex gap-4 text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={!watermarkOn} onChange={() => setWatermarkOn(false)} />
                    <span>ไม่ใส่</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={watermarkOn} onChange={() => setWatermarkOn(true)} />
                    <span>ใส่</span>
                  </label>
                </div>
                {watermarkOn && (
                  <input value={watermarkText} onChange={e => setWatermarkText(e.target.value)}
                    placeholder="planprom.com" className={`${INPUT} mt-2 font-mono`} />
                )}
              </div>

              {/* Engine Form */}
              <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-3">
                <p className="text-[11px] font-black uppercase tracking-widest text-neutral-400 mb-3">
                  {mode === 'engine-checklist'
                    ? '✅ Checklist Engine — กรอก 5 Section'
                    : mode === 'engine-pipeline'
                      ? '🔄 Pipeline Engine — กรอก 5 แกน'
                      : mode === 'engine-report'
                        ? '📊 Report Engine — กรอก 8 Section'
                        : '📅 Planner Engine — กรอก 4 Pillar'}
                </p>
                {mode === 'engine-checklist'
                  ? <ChecklistEngineForm onChange={handleEngineDataChange as Parameters<typeof ChecklistEngineForm>[0]['onChange']} />
                  : mode === 'engine-pipeline'
                    ? <PipelinePlannerForm onChange={handleEngineDataChange as Parameters<typeof PipelinePlannerForm>[0]['onChange']} />
                    : mode === 'engine-report'
                      ? <ReportEngineForm onChange={handleEngineDataChange as Parameters<typeof ReportEngineForm>[0]['onChange']} />
                      // DEPRECATED 2026-05-12 — engine-planner hidden แล้ว ลบได้หลัง 2026-05-19
                      : null
                }
              </div>

              {/* Generate button */}
              <div>
                {engineState === 'done' ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">✅</span>
                        <div>
                          <p className="text-sm font-black text-emerald-800">PDF สร้างแล้ว</p>
                          {engineDocCode && <p className="font-mono text-xs font-black text-emerald-700">{engineDocCode}</p>}
                          <p className="font-mono text-[11px] text-emerald-600">{pdfPath}</p>
                        </div>
                      </div>
                      <button type="button"
                        onClick={() => { setEngineState('idle'); setPdfPath('') }}
                        className="text-xs font-bold text-neutral-400 hover:text-red-600">
                        Generate ใหม่
                      </button>
                    </div>
                    <a href={pdfPath} target="_blank" rel="noreferrer"
                      className="block text-center rounded-xl border border-violet-300 bg-violet-50 py-2 text-sm font-black text-violet-700 hover:bg-violet-100">
                      👁 ดู PDF Preview ในแท็บใหม่
                    </a>
                  </div>
                ) : engineState === 'generating' ? (
                  <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-4 space-y-2.5">
                    <p className="text-sm font-black text-violet-700">⏳ กำลัง Generate...</p>
                    {ENGINE_STEPS.map((label, i) => {
                      const done    = i < engineProgress
                      const current = i === engineProgress
                      return (
                        <div key={i} className={`flex items-center gap-2 text-sm transition-colors ${done ? 'text-emerald-600' : current ? 'text-violet-800 font-bold' : 'text-neutral-400'}`}>
                          <span className="w-4 shrink-0 text-center">
                            {done ? '✅' : current ? '⏳' : '○'}
                          </span>
                          <span>{label}</span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <button type="button" onClick={handleEngineGenerate}
                    className="w-full rounded-xl bg-violet-600 py-3 text-sm font-black text-white transition hover:bg-violet-700">
                    🔄 Generate PDF Preview
                  </button>
                )}
                {engineError && <p className="mt-1.5 text-xs font-bold text-red-600">⚠️ {engineError}</p>}
              </div>
            </div>
          )}

          {mode === 'docx' && (
            <div className="space-y-4">
              {/* Watermark options */}
              <div>
                <label className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-neutral-400">Watermark</label>
                <div className="flex gap-4 text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={!watermarkOn} onChange={() => setWatermarkOn(false)} />
                    <span>ไม่ใส่</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={watermarkOn} onChange={() => setWatermarkOn(true)} />
                    <span>ใส่</span>
                  </label>
                </div>
                {watermarkOn && (
                  <input
                    value={watermarkText}
                    onChange={e => setWatermarkText(e.target.value)}
                    placeholder="planprom.com"
                    className={`${INPUT} mt-2 font-mono`}
                  />
                )}
              </div>

              {/* Docx file upload */}
              <div>
                <label className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-neutral-400">
                  ไฟล์ .docx *
                </label>
                <input ref={docxInputRef} type="file" accept=".docx" className="hidden" onChange={handleDocxChange} />
                {docxState === 'idle' || docxState === 'error' ? (
                  <button
                    type="button"
                    onClick={() => docxInputRef.current?.click()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 px-4 py-5 text-sm font-bold text-neutral-500 transition hover:border-violet-400 hover:bg-violet-50 hover:text-violet-700"
                  >
                    <span className="text-xl">📝</span>
                    Browse .docx จากเครื่อง (max 20 MB)
                  </button>
                ) : docxState === 'uploading' ? (
                  <div className="flex items-center gap-3 rounded-xl border border-violet-200 bg-violet-50 px-4 py-4">
                    <span className="animate-spin text-xl">⏳</span>
                    <span className="text-sm font-bold text-violet-700">กำลัง generate PDF จาก {docxName}…</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">✅</span>
                        <div>
                          <p className="text-sm font-black text-emerald-800">{docxName} → PDF สร้างแล้ว</p>
                          <p className="font-mono text-[11px] text-emerald-600">{pdfPath}</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => { setDocxState('idle'); setPdfPath(''); setDocxName(''); setTocSections([]) }} className="text-xs font-bold text-neutral-400 hover:text-red-600">เปลี่ยน</button>
                    </div>
                    {tocSections.length > 0 && (
                      <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
                        <p className="text-[11px] font-black text-violet-700 mb-1.5">สารบัญที่พบ ({tocSections.length} หัวข้อ)</p>
                        <ul className="space-y-0.5">
                          {tocSections.slice(0, 8).map((item, i) => (
                            <li key={i} className="text-[11px] text-neutral-600" style={{ paddingLeft: `${(item.level - 1) * 10}px` }}>
                              {item.level === 1 ? '●' : '○'} {item.title}
                            </li>
                          ))}
                          {tocSections.length > 8 && <li className="text-[11px] text-neutral-400">…และอีก {tocSections.length - 8} หัวข้อ</li>}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                {docxError && <p className="mt-1.5 text-xs font-bold text-red-600">⚠️ {docxError}</p>}
              </div>
            </div>
          )}

          {mode === 'upload' && (
            <div>
              <label className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-neutral-400">
                ไฟล์ PDF *
              </label>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Browse button area */}
              {uploadState === 'idle' || uploadState === 'error' ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 px-4 py-5 text-sm font-bold text-neutral-500 transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700"
                >
                  <span className="text-xl">📂</span>
                  Browse PDF จากเครื่อง (max 20 MB)
                </button>
              ) : uploadState === 'uploading' ? (
                <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
                  <span className="animate-spin text-xl">⏳</span>
                  <span className="text-sm font-bold text-amber-700">กำลัง upload {pdfName}…</span>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">✅</span>
                    <div>
                      <p className="text-sm font-black text-emerald-800">{pdfName}</p>
                      <p className="font-mono text-[11px] text-emerald-600">{pdfPath}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setUploadState('idle'); setPdfPath(''); setPdfName('') }}
                    className="text-xs font-bold text-neutral-400 hover:text-red-600"
                  >
                    เปลี่ยน
                  </button>
                </div>
              )}

              {uploadError && (
                <p className="mt-1.5 text-xs font-bold text-red-600">⚠️ {uploadError}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── STEP 4: Tags ────────────────────────────────────────────────────── */}
      {step === 4 && (
        <div>
          <h2 className="mb-1 text-xl font-black text-black">Auto-tag</h2>
          <p className="mb-2 text-sm text-neutral-500">ระบบแนะนำ tag จาก tier + หมวด — กด toggle ได้เลย</p>
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <span className="font-black">Auto-suggest:</span> tier={tier} · ฿{priceBaht} · catalog={catName}
          </div>
          <div className="flex flex-wrap gap-2">
            {ALL_TAGS.map(({ tag, label }) => {
              const on = tags.includes(tag)
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full px-4 py-2 text-sm font-black transition ${
                    on ? 'bg-amber-600 text-white shadow' : 'border border-neutral-200 bg-white text-neutral-500 hover:border-amber-400'
                  }`}
                >
                  {on ? '✓ ' : ''}{label}
                </button>
              )
            })}
          </div>
          {tags.length === 0 && (
            <p className="mt-3 text-xs text-neutral-400">เลือก tag อย่างน้อย 1 อัน (แนะนำ: ใหม่)</p>
          )}
        </div>
      )}

      {/* ── STEP 5: Review ──────────────────────────────────────────────────── */}
      {step === 5 && (
        <div>
          <h2 className="mb-4 text-xl font-black text-black">Review ก่อน Publish</h2>

          {/* Preview card */}
          <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-black text-black">{title || '(ไม่มีชื่อ)'}</p>
                <p className="mt-0.5 font-mono text-xs text-neutral-400">/templates/{slug}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-black text-emerald-700">฿{priceBaht}</span>
              </div>
            </div>
            {desc && <p className="mt-3 text-sm text-neutral-600">{desc}</p>}
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-black uppercase text-amber-800">{tier}</span>
              {catName && <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] font-bold text-neutral-600">{catName}</span>}
              {tags.map(t => (
                <span key={t} className="rounded-full bg-black px-2 py-0.5 text-[10px] font-black text-white">{t}</span>
              ))}
            </div>
            {pages && <p className="mt-2 text-xs text-neutral-400">{pages} หน้า</p>}
          </div>

          {/* Summary */}
          <div className="mt-4 rounded-xl border border-neutral-200 bg-white px-4 py-4 text-sm space-y-1.5">
            <Row k="Mode" v={mode ?? '-'} />
            <Row k="Catalog" v={catName || '-'} />
            <Row k="Type" v={docType} />
            <Row k="Slug" v={slug || '-'} mono />
            <Row k="Tier" v={`${tier} — ฿${priceBaht}`} />
            <Row k="หน้า" v={pages || '-'} />
            <Row k="PDF path" v={pdfPath || '(กรอกหลัง upload)'} mono />
            <Row k="Tags" v={tags.join(', ') || '-'} />
          </div>
        </div>
      )}

      {/* ── STEP 6: Publish ─────────────────────────────────────────────────── */}
      {step === 6 && (
        <div>
          <h2 className="mb-2 text-xl font-black text-black">
            {(mode === 'docx' || mode === 'engine-checklist' || mode === 'engine-planner' || mode === 'engine-pipeline') ? 'บันทึกเป็น Draft Preview' : 'พร้อม Publish!'}
          </h2>
          <p className="mb-6 text-sm text-neutral-500">
            {(mode === 'docx' || mode === 'engine-checklist' || mode === 'engine-planner' || mode === 'engine-pipeline')
              ? 'PDF ถูก generate แล้ว — บันทึกเป็น Draft Preview แล้วไปที่หน้า Edit เพื่อ Approve และ publish'
              : 'เลือกว่าจะเผยแพร่เลย หรือบันทึกเป็น draft ก่อน'}
          </p>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 mb-6">
            <p className="font-black text-black">{title}</p>
            <p className="text-sm text-neutral-600">฿{priceBaht} · {tier} · {catName}</p>
            {mode === 'docx' && tocSections.length > 0 && (
              <p className="text-xs text-violet-600 mt-1">📋 สารบัญ {tocSections.length} หัวข้อ{watermarkOn ? ` · watermark: "${watermarkText}"` : ''}</p>
            )}
            <div className="mt-2 flex flex-wrap gap-1">
              {tags.map(t => <span key={t} className="rounded-full bg-black px-2 py-0.5 text-[10px] font-black text-white">{t}</span>)}
            </div>
          </div>

          {(mode === 'docx' || mode === 'engine-checklist' || mode === 'engine-planner' || mode === 'engine-pipeline') ? (
            <button
              onClick={() => handlePublish('draft_preview')}
              disabled={pending}
              className="w-full rounded-2xl bg-violet-600 py-4 text-sm font-black text-white shadow transition hover:bg-violet-700 disabled:opacity-50"
            >
              {pending ? 'กำลังบันทึก...' : '📋 บันทึกเป็น Draft Preview'}
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handlePublish('draft')}
                disabled={pending}
                className="rounded-2xl border-2 border-neutral-300 bg-white py-4 text-sm font-black text-neutral-700 transition hover:border-black disabled:opacity-50"
              >
                💾 Save as Draft
              </button>
              <button
                onClick={() => handlePublish('published')}
                disabled={pending}
                className="rounded-2xl bg-amber-600 py-4 text-sm font-black text-white shadow transition hover:bg-amber-700 disabled:opacity-50"
              >
                {pending ? 'กำลังบันทึก...' : '🚀 Publish ทันที'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Nav buttons ─────────────────────────────────────────────────────── */}
      {step < 6 && (
        <div className="mt-8 flex gap-3">
          {step > 1 && (
            <button
              onClick={() => goToStep(step - 1)}
              className="flex-1 rounded-xl border border-neutral-200 py-3 text-sm font-black text-neutral-600 hover:border-black"
            >
              ← ย้อนกลับ
            </button>
          )}
          <button
            onClick={goNext}
            className="flex-1 rounded-xl bg-amber-600 py-3 text-sm font-black text-white transition hover:bg-amber-700"
          >
            {step === 5 ? 'ยืนยัน →' : 'ถัดไป →'}
          </button>
        </div>
      )}

    </div>
  )
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <span className="w-20 shrink-0 text-[11px] font-black uppercase tracking-wider text-neutral-400">{k}</span>
      <span className={`text-neutral-800 ${mono ? 'font-mono text-xs' : 'font-bold text-sm'}`}>{v}</span>
    </div>
  )
}
