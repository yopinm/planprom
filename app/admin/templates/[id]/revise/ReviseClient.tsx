'use client'
// DC-8: ReviseClient — pre-filled engine form for revision flow
// Does NOT import ChecklistEngineForm/PlannerEngineForm (frozen) — owns its own state + UI
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { ChecklistEngineData, PlannerEngineData, QuarterlyTheme } from '@/lib/engine-types'

const INPUT = 'w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none focus:border-amber-400 focus:bg-white transition'
const LABEL = 'block text-[11px] font-black uppercase tracking-widest text-neutral-400 mb-1.5'
const SELECT = `${INPUT} cursor-pointer`

function DynList({ items, onChange, placeholder, addLabel, color = 'emerald' }: {
  items: string[]; onChange: (v: string[]) => void
  placeholder?: string; addLabel?: string; color?: string
}) {
  const btnCls = color === 'violet'
    ? 'text-xs font-black text-violet-600 hover:text-violet-700'
    : 'text-xs font-black text-emerald-600 hover:text-emerald-700'
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input value={item} onChange={e => { const n = [...items]; n[i] = e.target.value; onChange(n) }}
            placeholder={placeholder ?? 'กรอก...'} className={INPUT} />
          {items.length > 1 && (
            <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="px-2 text-red-400 hover:text-red-600 text-sm">✕</button>
          )}
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, ''])} className={btnCls}>
        + {addLabel ?? 'เพิ่มรายการ'}
      </button>
    </div>
  )
}

function Card({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="rounded-xl border border-neutral-200 overflow-hidden">
      <button type="button" onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-4 py-3 text-left ${color}`}>
        <span className="font-black text-sm">{title}</span>
        <span className="text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-4 py-4 space-y-4 bg-white">{children}</div>}
    </div>
  )
}

// ── Checklist form ──────────────────────────────────────────────────────────
function ChecklistReviseForm({ initial, onChange }: {
  initial: ChecklistEngineData
  onChange: (d: ChecklistEngineData) => void
}) {
  const [s1title, setS1title]   = useState(initial.s1.title)
  const [s1date,  setS1date]    = useState(initial.s1.createdDate)
  const [s1author, setS1author] = useState(initial.s1.author)
  const [s2purpose, setS2purpose] = useState(initial.s2.purpose)
  const [s2ctx,   setS2ctx]     = useState(initial.s2.context)
  const [s2pre,   setS2pre]     = useState(initial.s2.prerequisites)
  const [items,   setItems]     = useState(initial.s3.items.length ? initial.s3.items : [''])
  const [exec,    setExec]      = useState(initial.s5.executorRole)
  const [review,  setReview]    = useState(initial.s5.reviewerRole)

  const emit = useCallback(() => {
    onChange({
      s1: { title: s1title, docCode: initial.s1.docCode, version: initial.s1.version, createdDate: s1date, author: s1author },
      s2: { purpose: s2purpose, context: s2ctx, prerequisites: s2pre },
      s3: { items: items.filter(i => i.trim()) },
      s5: { executorRole: exec, reviewerRole: review },
    })
  }, [s1title, s1date, s1author, s2purpose, s2ctx, s2pre, items, exec, review, onChange, initial])

  function up<T>(setter: (v: T) => void) {
    return (v: T) => { setter(v); setTimeout(emit, 0) }
  }

  return (
    <div className="space-y-3" onBlur={emit} onChange={emit}>
      <Card title="ส่วนที่ 1 — ส่วนหัวและข้อมูลพื้นฐาน" color="bg-emerald-50 text-emerald-800">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={LABEL}>ชื่อเช็คลิสต์ *</label>
            <input value={s1title} onChange={e => setS1title(e.target.value)} className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>รหัสเอกสาร (คงเดิม)</label>
            <div className="w-full rounded-lg border border-dashed border-neutral-300 bg-neutral-100 px-3 py-2.5 text-sm text-neutral-500 font-mono">
              {initial.s1.docCode}
            </div>
          </div>
          <div>
            <label className={LABEL}>วันที่จัดทำ</label>
            <input type="date" value={s1date} onChange={e => setS1date(e.target.value)} className={INPUT} />
          </div>
          <div className="col-span-2">
            <label className={LABEL}>ผู้จัดทำ / ผู้รับผิดชอบ</label>
            <input value={s1author} onChange={e => setS1author(e.target.value)}
              placeholder="ปล่อยว่าง — ลูกค้ากรอกเองในเอกสาร" className={INPUT} />
          </div>
        </div>
      </Card>

      <Card title="ส่วนที่ 2 — วัตถุประสงค์และข้อมูลทั่วไป" color="bg-blue-50 text-blue-800">
        <div>
          <label className={LABEL}>วัตถุประสงค์ *</label>
          <textarea value={s2purpose} onChange={e => setS2purpose(e.target.value)} rows={3} className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>บริบทการใช้งาน</label>
          <textarea value={s2ctx} onChange={e => setS2ctx(e.target.value)} rows={2} className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>เงื่อนไข / อุปกรณ์ที่ต้องเตรียม</label>
          <textarea value={s2pre} onChange={e => setS2pre(e.target.value)} rows={2} className={INPUT} />
        </div>
      </Card>

      <Card title="ส่วนที่ 3 — รายการตรวจสอบ" color="bg-amber-50 text-amber-800">
        <DynList items={items} onChange={up(setItems)}
          placeholder="เช่น ตรวจสอบสายดิน" addLabel="เพิ่มรายการตรวจสอบ" />
      </Card>

      <Card title="ส่วนที่ 4 — หมายเหตุและข้อสังเกต" color="bg-neutral-50 text-neutral-600">
        <p className="text-sm text-neutral-400">ระบบสร้างช่องว่าง 8 บรรทัดให้อัตโนมัติ</p>
      </Card>

      <Card title="ส่วนที่ 5 — การยืนยันและอนุมัติ" color="bg-violet-50 text-violet-800">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>ชื่อ / ตำแหน่งผู้ปฏิบัติงาน</label>
            <input value={exec} onChange={e => setExec(e.target.value)} className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>ชื่อ / ตำแหน่งผู้ตรวจสอบ</label>
            <input value={review} onChange={e => setReview(e.target.value)} className={INPUT} />
          </div>
        </div>
      </Card>
    </div>
  )
}

// ── Planner form ────────────────────────────────────────────────────────────
function PlannerReviseForm({ initial, onChange }: {
  initial: PlannerEngineData
  onChange: (d: PlannerEngineData) => void
}) {
  const [title,   setTitle]   = useState(initial.p1.plannerTitle)
  const [desc,    setDesc]    = useState(initial.p1.description)
  const [period,  setPeriod]  = useState(initial.p1.period)
  const [fw,      setFw]      = useState(initial.p1.framework)
  const [goals,   setGoals]   = useState(initial.p1.yearlyGoals.length ? initial.p1.yearlyGoals : [''])
  const [themes,  setThemes]  = useState<QuarterlyTheme[]>(initial.p1.quarterlyThemes.length ? initial.p1.quarterlyThemes : [{ quarter: 'Q1', theme: '', keyActions: '' }])
  const [rocks,   setRocks]   = useState(initial.p1.bigRocks.length ? initial.p1.bigRocks : [''])
  const [views,   setViews]   = useState(initial.p2.views)
  const [dpp,     setDpp]     = useState(initial.p2.daysPerPage)
  const [focusAreas, setFocusAreas] = useState(initial.p2.focusAreas.length ? initial.p2.focusAreas : [''])
  const [eisenhower, setEisenhower] = useState(initial.p2.includeEisenhower)
  const [habits,  setHabits]  = useState(initial.p3.habitNames.length ? initial.p3.habitNames : [''])
  const [mood,    setMood]    = useState(initial.p3.includeMoodTracker)
  const [finance, setFinance] = useState(initial.p3.financeCategories.length ? initial.p3.financeCategories : ['รายรับ', 'รายจ่าย'])
  const [reviewCycle, setReviewCycle] = useState(initial.p3.reviewCycle)
  const [reviewQs, setReviewQs] = useState(initial.p3.reviewQuestions.length ? initial.p3.reviewQuestions : [''])
  const [projects, setProjects] = useState(initial.p4.projectAreas.length ? initial.p4.projectAreas : [''])
  const [gratitude, setGratitude] = useState(initial.p4.includeGratitudeJournal)
  const [gratitudePs, setGratitudePs] = useState(initial.p4.gratitudePrompts.length ? initial.p4.gratitudePrompts : [''])
  const [notesStyle, setNotesStyle] = useState(initial.p4.notesStyle)
  const [brainPages, setBrainPages] = useState(initial.p4.brainDumpPages)

  function emit() {
    onChange({
      p1: { plannerTitle: title, description: desc, period, framework: fw,
            yearlyGoals: goals.filter(g => g.trim()),
            quarterlyThemes: themes.filter(t => t.quarter.trim() || t.theme.trim()),
            bigRocks: rocks.filter(r => r.trim()) },
      p2: { views, daysPerPage: dpp, focusAreas: focusAreas.filter(a => a.trim()), includeEisenhower: eisenhower },
      p3: { habitNames: habits.filter(h => h.trim()), includeMoodTracker: mood,
            financeCategories: finance.filter(c => c.trim()),
            reviewCycle, reviewQuestions: reviewQs.filter(q => q.trim()) },
      p4: { projectAreas: projects.filter(a => a.trim()), includeGratitudeJournal: gratitude,
            gratitudePrompts: gratitudePs.filter(p => p.trim()),
            notesStyle, brainDumpPages: brainPages },
    })
  }

  function toggleView(v: 'monthly' | 'weekly' | 'daily') {
    const next = views.includes(v) ? views.filter(x => x !== v) : [...views, v]
    setViews(next)
    setTimeout(emit, 0)
  }

  return (
    <div className="space-y-3" onBlur={emit} onChange={emit}>
      <Card title="แกนที่ 1 — เป้าหมายและวิสัยทัศน์" color="bg-violet-50 text-violet-800">
        <div>
          <label className={LABEL}>ชื่อ Planner *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>คำอธิบาย</label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} className={INPUT} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>ช่วงเวลา</label>
            <select value={period} onChange={e => setPeriod(e.target.value as typeof period)} className={SELECT}>
              <option value="yearly">รายปี</option>
              <option value="quarterly">รายไตรมาส</option>
              <option value="monthly">รายเดือน</option>
              <option value="weekly">รายสัปดาห์</option>
            </select>
          </div>
          <div>
            <label className={LABEL}>Framework</label>
            <select value={fw} onChange={e => setFw(e.target.value as typeof fw)} className={SELECT}>
              <option value="OKR">OKR</option>
              <option value="SMART">SMART Goals</option>
              <option value="both">SMART + OKR</option>
              <option value="none">ไม่ระบุ</option>
            </select>
          </div>
        </div>
        <div>
          <label className={LABEL}>เป้าหมายประจำปี</label>
          <DynList items={goals} onChange={v => { setGoals(v); setTimeout(emit, 0) }}
            placeholder="เช่น เพิ่มยอดขาย 30%" addLabel="เพิ่มเป้าหมาย" color="violet" />
        </div>
        <div>
          <label className={LABEL}>ภาพรวมรายไตรมาส</label>
          <div className="space-y-3">
            {themes.map((t, i) => (
              <div key={i} className="rounded-lg border border-violet-100 p-3 space-y-2">
                <div className="flex gap-2 items-center">
                  <input value={t.quarter} onChange={e => { const n = [...themes]; n[i] = { ...n[i], quarter: e.target.value }; setThemes(n) }}
                    placeholder="Q1" className={`${INPUT} w-20`} />
                  <input value={t.theme} onChange={e => { const n = [...themes]; n[i] = { ...n[i], theme: e.target.value }; setThemes(n) }}
                    placeholder="Theme หลัก..." className={INPUT} />
                  {themes.length > 1 && (
                    <button type="button" onClick={() => { setThemes(themes.filter((_, j) => j !== i)); setTimeout(emit, 0) }}
                      className="text-red-400 text-sm px-1">✕</button>
                  )}
                </div>
                <textarea value={t.keyActions} onChange={e => { const n = [...themes]; n[i] = { ...n[i], keyActions: e.target.value }; setThemes(n) }}
                  rows={2} placeholder="Key actions..." className={`${INPUT} text-xs`} />
              </div>
            ))}
            <button type="button" onClick={() => { setThemes([...themes, { quarter: '', theme: '', keyActions: '' }]); setTimeout(emit, 0) }}
              className="text-xs font-black text-violet-600">+ เพิ่มไตรมาส</button>
          </div>
        </div>
        <div>
          <label className={LABEL}>Big Rocks</label>
          <DynList items={rocks} onChange={v => { setRocks(v); setTimeout(emit, 0) }}
            placeholder="เช่น เปิดตัวสินค้าใหม่" addLabel="เพิ่ม Big Rock" color="violet" />
        </div>
      </Card>

      <Card title="แกนที่ 2 — การบริหารเวลาและภารกิจ" color="bg-amber-50 text-amber-800">
        <div>
          <label className={LABEL}>มุมมองที่ต้องการ</label>
          <div className="flex gap-3 flex-wrap">
            {(['monthly', 'weekly', 'daily'] as const).map(v => (
              <label key={v} className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 cursor-pointer text-sm font-bold transition
                ${views.includes(v) ? 'border-amber-500 bg-amber-50 text-amber-800' : 'border-neutral-200 text-neutral-500'}`}>
                <input type="checkbox" checked={views.includes(v)} onChange={() => toggleView(v)} className="hidden" />
                {views.includes(v) ? '✓ ' : ''}{v === 'monthly' ? '📅 รายเดือน' : v === 'weekly' ? '🗓 รายสัปดาห์' : '📋 รายวัน'}
              </label>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>วันต่อหน้า</label>
            <input type="number" value={dpp} min={1} max={31} onChange={e => setDpp(Number(e.target.value))} className={INPUT} />
          </div>
        </div>
        <div>
          <label className={LABEL}>Focus Areas</label>
          <DynList items={focusAreas} onChange={v => { setFocusAreas(v); setTimeout(emit, 0) }}
            placeholder="เช่น งาน · สุขภาพ" addLabel="เพิ่ม Focus Area" />
        </div>
        <label className="flex items-center gap-2 text-sm font-bold text-neutral-700">
          <input type="checkbox" checked={eisenhower} onChange={e => { setEisenhower(e.target.checked); setTimeout(emit, 0) }} />
          รวม Eisenhower Matrix
        </label>
      </Card>

      <Card title="แกนที่ 3 — ติดตามพฤติกรรมและดูแลตัวเอง" color="bg-emerald-50 text-emerald-800">
        <div>
          <label className={LABEL}>Habit Tracker</label>
          <DynList items={habits} onChange={v => { setHabits(v); setTimeout(emit, 0) }}
            placeholder="เช่น ออกกำลังกาย" addLabel="เพิ่ม Habit" />
        </div>
        <label className="flex items-center gap-2 text-sm font-bold text-neutral-700">
          <input type="checkbox" checked={mood} onChange={e => { setMood(e.target.checked); setTimeout(emit, 0) }} />
          Mood Tracker
        </label>
        <div>
          <label className={LABEL}>หมวดหมู่การเงิน</label>
          <DynList items={finance} onChange={v => { setFinance(v); setTimeout(emit, 0) }}
            placeholder="เช่น รายรับ" addLabel="เพิ่มหมวด" />
        </div>
        <div>
          <label className={LABEL}>รอบรีวิว</label>
          <select value={reviewCycle} onChange={e => setReviewCycle(e.target.value as typeof reviewCycle)} className={SELECT}>
            <option value="weekly">รายสัปดาห์</option>
            <option value="monthly">รายเดือน</option>
            <option value="both">ทั้งคู่</option>
          </select>
        </div>
        <div>
          <label className={LABEL}>คำถามรีวิว</label>
          <DynList items={reviewQs} onChange={v => { setReviewQs(v); setTimeout(emit, 0) }}
            placeholder="เช่น สิ่งที่ทำได้ดีคืออะไร?" addLabel="เพิ่มคำถาม" />
        </div>
      </Card>

      <Card title="แกนที่ 4 — บันทึกความคิดและทรัพยากร" color="bg-rose-50 text-rose-800">
        <div>
          <label className={LABEL}>Project Areas</label>
          <DynList items={projects} onChange={v => { setProjects(v); setTimeout(emit, 0) }}
            placeholder="เช่น โปรเจกต์ A" addLabel="เพิ่ม Project" />
        </div>
        <label className="flex items-center gap-2 text-sm font-bold text-neutral-700">
          <input type="checkbox" checked={gratitude} onChange={e => { setGratitude(e.target.checked); setTimeout(emit, 0) }} />
          Gratitude Journal
        </label>
        {gratitude && (
          <div>
            <label className={LABEL}>Prompts ความกตัญญู</label>
            <DynList items={gratitudePs} onChange={v => { setGratitudePs(v); setTimeout(emit, 0) }}
              placeholder="เช่น วันนี้ขอบคุณสำหรับ..." addLabel="เพิ่ม Prompt" />
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>สไตล์หน้าจด</label>
            <select value={notesStyle} onChange={e => setNotesStyle(e.target.value as typeof notesStyle)} className={SELECT}>
              <option value="lined">เส้นบรรทัด</option>
              <option value="dotgrid">Dot Grid</option>
              <option value="blank">เปล่า</option>
            </select>
          </div>
          <div>
            <label className={LABEL}>หน้า Brain Dump</label>
            <input type="number" value={brainPages} min={0} max={10} onChange={e => setBrainPages(Number(e.target.value))} className={INPUT} />
          </div>
        </div>
      </Card>
    </div>
  )
}

// ── Main ReviseClient ────────────────────────────────────────────────────────
interface Props {
  templateId: string
  slug: string
  engineType: 'checklist' | 'planner'
  initialData: ChecklistEngineData | PlannerEngineData
  nextRevisionNumber: number
  categoryName?: string
}

type GenState = 'idle' | 'generating' | 'done' | 'error'
type ApproveState = 'idle' | 'loading' | 'done' | 'error'

export function ReviseClient({ templateId, slug, engineType, initialData, nextRevisionNumber, categoryName }: Props) {
  const router = useRouter()
  const [engineData, setEngineData] = useState<ChecklistEngineData | PlannerEngineData>(initialData)
  const [genState,   setGenState]   = useState<GenState>('idle')
  const [genError,   setGenError]   = useState('')
  const [pdfPath,    setPdfPath]    = useState('')
  const [previewPath, setPreviewPath] = useState<string | null>(null)
  const [changeNote, setChangeNote] = useState('')
  const [approveState, setApproveState] = useState<ApproveState>('idle')
  const [approveError, setApproveError] = useState('')

  async function handleGenerate() {
    setGenState('generating')
    setGenError('')
    try {
      const res = await fetch('/api/admin/templates/generate-revision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          engine_type: engineType,
          engine_data: engineData,
          slug,
          category_name: categoryName || undefined,
        }),
      })
      const json = await res.json() as { path?: string; preview_path?: string; error?: string }
      if (!res.ok || json.error) {
        setGenError(json.error ?? 'Generate failed')
        setGenState('error')
      } else {
        setPdfPath(json.path ?? '')
        setPreviewPath(json.preview_path ?? null)
        setGenState('done')
      }
    } catch (err) {
      setGenError(String(err))
      setGenState('error')
    }
  }

  async function handleApprove() {
    if (!pdfPath) return
    setApproveState('loading')
    setApproveError('')
    try {
      const res = await fetch('/api/admin/templates/approve-revision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_id: templateId, engine_data: engineData, pdf_path: pdfPath, preview_path: previewPath, change_note: changeNote }),
      })
      const json = await res.json() as { ok?: boolean; revision_number?: number; error?: string }
      if (!res.ok || json.error) {
        setApproveError(json.error ?? 'Approve failed')
        setApproveState('error')
      } else {
        setApproveState('done')
        router.push(`/admin/templates/${templateId}/edit`)
        router.refresh()
      }
    } catch (err) {
      setApproveError(String(err))
      setApproveState('error')
    }
  }

  return (
    <div className="space-y-6">
      {/* Form */}
      <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-4">
        {engineType === 'checklist' ? (
          <ChecklistReviseForm
            initial={initialData as ChecklistEngineData}
            onChange={setEngineData}
          />
        ) : (
          <PlannerReviseForm
            initial={initialData as PlannerEngineData}
            onChange={setEngineData}
          />
        )}
      </div>

      {/* Generate button */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-black text-neutral-900">Generate PDF Preview</p>
            <p className="text-xs text-neutral-400 mt-0.5">Revision {nextRevisionNumber} · docCode คงเดิม</p>
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={genState === 'generating'}
            className="rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-black text-white hover:bg-amber-700 disabled:opacity-50 transition"
          >
            {genState === 'generating' ? '⏳ กำลัง Generate...' : `🔄 Generate (Rev ${nextRevisionNumber})`}
          </button>
        </div>

        {genState === 'error' && (
          <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-bold">{genError}</p>
        )}

        {genState === 'done' && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
              <span className="text-emerald-700 font-black text-sm">✅ PDF พร้อมแล้ว</span>
              <a href={pdfPath} target="_blank" rel="noopener noreferrer"
                className="text-xs text-indigo-600 underline hover:text-indigo-800">ดู PDF →</a>
              {previewPath && (
                <img src={previewPath} alt="preview" className="ml-auto h-24 rounded-lg border border-neutral-200 object-cover" />
              )}
            </div>

            {/* change_note + approve */}
            <div>
              <label className={LABEL}>หมายเหตุการแก้ไข (ไม่บังคับ)</label>
              <input
                value={changeNote}
                onChange={e => setChangeNote(e.target.value)}
                placeholder="เช่น แก้ชื่อเป้าหมาย Q2 · เพิ่มรายการตรวจสอบ 3 รายการ"
                className={INPUT}
              />
            </div>

            {approveError && (
              <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-bold">{approveError}</p>
            )}

            <button
              type="button"
              onClick={handleApprove}
              disabled={approveState === 'loading' || approveState === 'done'}
              className="w-full rounded-xl bg-violet-600 py-3 text-sm font-black text-white hover:bg-violet-700 disabled:opacity-50 transition"
            >
              {approveState === 'loading' ? '⏳ กำลังบันทึก...' : approveState === 'done' ? '✅ บันทึกแล้ว' : `✅ Approve Revision ${nextRevisionNumber}`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
