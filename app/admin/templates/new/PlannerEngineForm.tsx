'use client'
import { useState, useEffect, useRef } from 'react'
import type {
  PlannerEngineDataV2, PlanningHorizon, PlannerSegment,
  PlannerDecisionMatrix, PlannerAxis3,
} from '@/lib/engine-types'

const INPUT = 'w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:bg-white transition'
const LABEL = 'block text-[11px] font-black uppercase tracking-widest text-neutral-600 mb-1.5'
const SELECT = `${INPUT} cursor-pointer`

function DynList({ items, onChange, placeholder, addLabel }: {
  items: string[]; onChange: (v: string[]) => void
  placeholder?: string; addLabel?: string
}) {
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
      <button type="button" onClick={() => onChange([...items, ''])}
        className="text-xs font-black text-violet-600 hover:text-violet-700">
        + {addLabel ?? 'เพิ่มรายการ'}
      </button>
    </div>
  )
}

function AxisCard({ num, title, color, borderClass, children, optional, enabled, onToggle }: {
  num: string; title: string; color: string; borderClass?: string; children: React.ReactNode
  optional?: boolean; enabled?: boolean; onToggle?: () => void
}) {
  const [open, setOpen] = useState(num === 'META' || num === '1' || num === '5')
  return (
    <div className={`rounded-xl border-2 overflow-hidden ${borderClass ?? 'border-neutral-300'}`}>
      <div className={`flex items-center gap-3 px-4 py-3 ${color}`}>
        {optional && (
          <input type="checkbox" checked={enabled} onChange={onToggle}
            className="rounded accent-violet-600 cursor-pointer" />
        )}
        {!optional && <span className="text-xs font-black bg-white/40 rounded-full px-2 py-0.5">
          {num === 'META' ? 'ตั้งค่า' : `แกนที่ ${num}`}
        </span>}
        {optional && (
          <span className="text-xs font-black bg-white/40 rounded-full px-2 py-0.5">แกนที่ {num}</span>
        )}
        <span className="font-black text-sm flex-1">{title}</span>
        <button type="button" onClick={() => setOpen(o => !o)} className="text-xs">{open ? '▲' : '▼'}</button>
      </div>
      {open && (
        <div className={`px-4 py-4 space-y-4 bg-white ${optional && !enabled ? 'opacity-40 pointer-events-none' : ''}`}>
          {children}
        </div>
      )}
    </div>
  )
}

function getDefaultSegments(h: PlanningHorizon): PlannerSegment[] {
  switch (h) {
    case 'year': return [
      { label: 'Q1 (ม.ค.–มี.ค.)', theme: '', keyActions: '' },
      { label: 'Q2 (เม.ย.–มิ.ย.)', theme: '', keyActions: '' },
      { label: 'Q3 (ก.ค.–ก.ย.)', theme: '', keyActions: '' },
      { label: 'Q4 (ต.ค.–ธ.ค.)', theme: '', keyActions: '' },
    ]
    case 'month': return ['สัปดาห์ที่ 1','สัปดาห์ที่ 2','สัปดาห์ที่ 3','สัปดาห์ที่ 4'].map(l=>({label:l,theme:'',keyActions:''}))
    case 'week':  return ['จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์','อาทิตย์'].map(l=>({label:l,theme:'',keyActions:''}))
    case 'day':   return ['เช้า (06:00–09:00)','สาย (09:00–12:00)','บ่าย (12:00–15:00)','เย็น (15:00–18:00)','ค่ำ (18:00–21:00)'].map(l=>({label:l,theme:'',keyActions:''}))
  }
}

function getHabitDays(h: PlanningHorizon): number {
  if (h === 'year' || h === 'month') return 31
  if (h === 'week') return 7
  return 0
}

function getReviewCycle(h: PlanningHorizon): PlannerAxis3['reviewCycle'] {
  if (h === 'year') return 'monthly'
  if (h === 'month') return 'weekly'
  return 'daily'
}

function getDiaryDays(h: PlanningHorizon): number {
  return h === 'month' ? 7 : 0
}

interface Props { onChange: (data: PlannerEngineDataV2) => void }

export function PlannerEngineForm({ onChange }: Props) {
  // META
  const [displayTitle, setDisplayTitle] = useState('')
  const [description,  setDescription]  = useState('')
  const [horizon,      setHorizon]      = useState<PlanningHorizon>('year')
  const [colorTheme,   setColorTheme]   = useState<PlannerEngineDataV2['meta']['colorTheme']>('violet')
  const [coverPage,    setCoverPage]    = useState(true)
  const [howToUse,     setHowToUse]     = useState(false)

  // Axis 1
  const [roadmap,     setRoadmap]     = useState<PlannerSegment[]>(getDefaultSegments('year'))
  const [goalItems,   setGoalItems]   = useState(['', ''])
  const [showKpiLine, setShowKpiLine] = useState(true)
  const [bigRocks,    setBigRocks]    = useState([''])

  // Axis 2 (optional)
  const [showAxis2,      setShowAxis2]      = useState(false)
  const [decisions,      setDecisions]      = useState<PlannerDecisionMatrix[]>([{ question: '', options: ['', ''] }])
  const [extraBigRocks,  setExtraBigRocks]  = useState([''])

  // Axis 3 (optional, on by default)
  const [showAxis3,         setShowAxis3]         = useState(true)
  const [habits,            setHabits]            = useState(['', '', ''])
  const [habitDays,         setHabitDays]         = useState(31)
  const [includeMood,       setIncludeMood]        = useState(false)
  const [finCats,           setFinCats]           = useState<{name:string;type:'income'|'expense'}[]>([
    { name: 'รายรับ', type: 'income' },
    { name: 'รายจ่าย', type: 'expense' },
  ])
  const [reviewCycle, setReviewCycle] = useState<PlannerAxis3['reviewCycle']>('monthly')
  const [reviewQs,    setReviewQs]    = useState(['สิ่งที่ทำได้ดีในช่วงนี้คืออะไร?', 'สิ่งที่ต้องปรับปรุงคืออะไร?'])

  // Axis 4 (optional, off by default)
  const [showAxis4,   setShowAxis4]   = useState(false)
  const [checklist,   setChecklist]   = useState<{phase:string;items:string[]}[]>([{ phase: '', items: [''] }])
  const [packingList, setPackingList] = useState<{category:string;items:string[]}[]>([{ category: '', items: [''] }])
  const [ideaBoard,   setIdeaBoard]   = useState(false)

  // Axis 5
  const [diaryEnabled,  setDiaryEnabled]  = useState(false)
  const [diaryDays,     setDiaryDays]     = useState(0)
  const [reviewQs5,     setReviewQs5]     = useState([''])
  const [notesStyle,    setNotesStyle]    = useState<'lined'|'dotgrid'|'blank'>('lined')
  const [notesPages,    setNotesPages]    = useState(1)
  const [gratitude,     setGratitude]     = useState(false)
  const [gratitudePs,   setGratitudePs]   = useState(['วันนี้ขอบคุณสำหรับ...'])

  // skip cascade on first mount
  const firstMount = useRef(true)
  useEffect(() => {
    if (firstMount.current) { firstMount.current = false; return }
    setRoadmap(getDefaultSegments(horizon))
    setHabitDays(getHabitDays(horizon))
    setReviewCycle(getReviewCycle(horizon))
    const dd = getDiaryDays(horizon)
    setDiaryEnabled(dd > 0)
    setDiaryDays(dd)
  }, [horizon])

  useEffect(() => {
    onChange({
      meta: { schemaVersion: '2.0', planningHorizon: horizon, displayTitle, description, colorTheme, coverPage, howToUse },
      axis1: {
        roadmap: roadmap.filter(s => s.label.trim()),
        goalItems: goalItems.filter(g => g.trim()),
        showKpiLine,
        bigRocks: bigRocks.filter(r => r.trim()),
      },
      ...(showAxis2 ? { axis2: {
        decisions: decisions.filter(d => d.question.trim()),
        extraBigRocks: extraBigRocks.filter(r => r.trim()),
      }} : {}),
      ...(showAxis3 ? { axis3: {
        habitTracker: { habits: habits.filter(h => h.trim()), days: habitDays },
        includeMoodTracker: includeMood,
        financeTracker: { categories: finCats.filter(c => c.name.trim()) },
        reviewCycle,
        reviewQuestions: reviewQs.filter(q => q.trim()),
      }} : {}),
      ...(showAxis4 ? { axis4: {
        checklist: checklist.filter(p => p.phase.trim() && p.items.filter(i=>i.trim()).length > 0),
        packingList: packingList.filter(p => p.category.trim() && p.items.filter(i=>i.trim()).length > 0),
        ideaBoard,
      }} : {}),
      axis5: {
        dailyDiary: { enabled: diaryEnabled, days: diaryEnabled ? diaryDays : 0 },
        reviewQuestions: reviewQs5.filter(q => q.trim()),
        notesStyle,
        notesPages,
        includeGratitudeJournal: gratitude,
        gratitudePrompts: gratitude ? gratitudePs.filter(p => p.trim()) : [],
      },
    })
  }, [
    displayTitle, description, horizon, colorTheme, coverPage, howToUse,
    roadmap, goalItems, showKpiLine, bigRocks,
    showAxis2, decisions, extraBigRocks,
    showAxis3, habits, habitDays, includeMood, finCats, reviewCycle, reviewQs,
    showAxis4, checklist, packingList, ideaBoard,
    diaryEnabled, diaryDays, reviewQs5, notesStyle, notesPages, gratitude, gratitudePs,
    onChange,
  ])

  function updateSegment(i: number, field: keyof PlannerSegment, val: string) {
    setRoadmap(prev => prev.map((s, j) => j === i ? { ...s, [field]: val } : s))
  }
  function updateDecision(i: number, field: 'question', val: string) {
    setDecisions(prev => prev.map((d, j) => j === i ? { ...d, [field]: val } : d))
  }
  function updateDecisionOption(di: number, oi: number, val: string) {
    setDecisions(prev => prev.map((d, j) => j === di ? { ...d, options: d.options.map((o,k) => k===oi ? val : o) } : d))
  }
  function addDecisionOption(di: number) {
    setDecisions(prev => prev.map((d, j) => j === di ? { ...d, options: [...d.options, ''] } : d))
  }

  const HORIZON_LABEL: Record<string, string> = { year: 'รายปี (12 เดือน)', month: 'รายเดือน (4 สัปดาห์)', week: 'รายสัปดาห์ (7 วัน)', day: 'รายวัน (ช่วงเวลา)' }
  const THEME_OPTS: {v: PlannerEngineDataV2['meta']['colorTheme']; l: string; color: string}[] = [
    { v: 'violet', l: 'ม่วง', color: 'bg-violet-500' },
    { v: 'indigo', l: 'น้ำเงิน', color: 'bg-indigo-500' },
    { v: 'emerald', l: 'เขียว', color: 'bg-emerald-500' },
    { v: 'rose', l: 'ชมพู', color: 'bg-rose-500' },
    { v: 'amber', l: 'เหลือง', color: 'bg-amber-500' },
  ]

  return (
    <div className="space-y-3">

      {/* META */}
      <AxisCard num="META" title="ตั้งค่าพื้นฐาน" color="bg-neutral-100 text-neutral-800">
        <div>
          <label className={LABEL}>ชื่อ Planner ที่แสดงใน PDF *</label>
          <input value={displayTitle} onChange={e => setDisplayTitle(e.target.value)}
            placeholder="เช่น แผนชีวิต 2026 — เส้นทางสู่เป้าหมาย" className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>คำอธิบาย (แสดงในร้านค้า) *</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
            placeholder="เช่น Planner ครบจบสำหรับวางแผนชีวิตรายปี ตั้งแต่เป้าหมายถึงการติดตาม"
            className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>ช่วงเวลาหลักของแผน (Planning Horizon) *</label>
          <select value={horizon} onChange={e => setHorizon(e.target.value as PlanningHorizon)} className={SELECT}>
            {Object.entries(HORIZON_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <p className="mt-1 text-[11px] text-violet-600 font-bold">
            การเลือกนี้จะปรับ: โครงสร้างแผน · จำนวนวัน habit · รอบทบทวน · บันทึกประจำวัน
          </p>
        </div>
        <div>
          <label className={LABEL}>สีธีม PDF</label>
          <div className="flex gap-2 flex-wrap">
            {THEME_OPTS.map(({ v, l, color }) => (
              <button key={v} type="button" onClick={() => setColorTheme(v)}
                className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm font-bold transition
                  ${colorTheme === v ? 'border-neutral-900 shadow-sm' : 'border-neutral-200 hover:border-neutral-400'}`}>
                <span className={`w-3 h-3 rounded-full ${color}`}></span>{l}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-neutral-700">
            <input type="checkbox" checked={coverPage} onChange={e => setCoverPage(e.target.checked)} className="rounded" />
            หน้าปก
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-neutral-700">
            <input type="checkbox" checked={howToUse} onChange={e => setHowToUse(e.target.checked)} className="rounded" />
            วิธีใช้
          </label>
        </div>
      </AxisCard>

      {/* AXIS 1 */}
      <AxisCard num="1" title="ทิศทางและเป้าหมาย" color="bg-violet-50 text-violet-800" borderClass="border-violet-300">
        <div>
          <label className={LABEL}>โครงสร้างแผนงาน (ปรับชื่อ + ธีมแต่ละช่วงได้)</label>
          <div className="space-y-3">
            {roadmap.map((s, i) => (
              <div key={i} className="rounded-lg border border-violet-100 p-3 space-y-2">
                <div className="flex gap-2">
                  <input value={s.label} onChange={e => updateSegment(i, 'label', e.target.value)}
                    placeholder="ช่วงเวลา" className={`${INPUT} w-32 font-bold`} />
                  <input value={s.theme} onChange={e => updateSegment(i, 'theme', e.target.value)}
                    placeholder="ธีม / เป้าหมายช่วงนี้..." className={INPUT} />
                </div>
                <textarea value={s.keyActions} onChange={e => updateSegment(i, 'keyActions', e.target.value)}
                  rows={2} placeholder="สิ่งที่จะทำในช่วงนี้ (1 บรรทัด = 1 รายการ)"
                  className={`${INPUT} text-xs`} />
              </div>
            ))}
          </div>
        </div>
        <div>
          <label className={LABEL}>เป้าหมายหลัก</label>
          <DynList items={goalItems} onChange={setGoalItems}
            placeholder="เช่น เพิ่มรายได้เสริม ฿50,000 ภายในสิ้นปี"
            addLabel="เพิ่มเป้าหมาย" />
        </div>
        <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-neutral-700">
          <input type="checkbox" checked={showKpiLine} onChange={e => setShowKpiLine(e.target.checked)} className="rounded" />
          แสดงช่อง "ตัวชี้วัด / วิธีวัดผล" ใต้แต่ละเป้าหมายใน PDF
        </label>
        <div>
          <label className={LABEL}>สิ่งสำคัญที่ต้องทำให้ได้ก่อน</label>
          <DynList items={bigRocks} onChange={setBigRocks}
            placeholder="เช่น เปิดตัว side project ตัวแรก"
            addLabel="เพิ่มรายการสำคัญ" />
        </div>
      </AxisCard>

      {/* AXIS 2 */}
      <AxisCard num="2" title="ตารางช่วยตัดสินใจ" color="bg-sky-50 text-sky-800" borderClass="border-sky-300"
        optional enabled={showAxis2} onToggle={() => setShowAxis2(v => !v)}>
        <div>
          <label className={LABEL}>คำถามสำหรับตัดสินใจ</label>
          <div className="space-y-4">
            {decisions.map((d, di) => (
              <div key={di} className="rounded-lg border border-sky-100 p-3 space-y-2">
                <div className="flex gap-2">
                  <input value={d.question} onChange={e => updateDecision(di, 'question', e.target.value)}
                    placeholder="เช่น ควรเรียนคอร์สไหนก่อนดี?" className={INPUT} />
                  {decisions.length > 1 && (
                    <button type="button" onClick={() => setDecisions(prev => prev.filter((_, j) => j !== di))}
                      className="text-red-400 text-sm px-1">✕</button>
                  )}
                </div>
                {d.options.map((o, oi) => (
                  <input key={oi} value={o} onChange={e => updateDecisionOption(di, oi, e.target.value)}
                    placeholder={`ตัวเลือกที่ ${oi + 1}`} className={INPUT} />
                ))}
                <button type="button" onClick={() => addDecisionOption(di)}
                  className="text-xs font-black text-sky-600">+ เพิ่มตัวเลือก</button>
              </div>
            ))}
            <button type="button"
              onClick={() => setDecisions(prev => [...prev, { question: '', options: ['', ''] }])}
              className="text-xs font-black text-sky-600 hover:text-sky-700">
              + เพิ่มคำถาม
            </button>
          </div>
        </div>
        <div>
          <label className={LABEL}>รายการเพิ่มเติม</label>
          <DynList items={extraBigRocks} onChange={setExtraBigRocks}
            placeholder="เช่น ตัดสินใจเรื่อง..." addLabel="เพิ่มรายการ" />
        </div>
      </AxisCard>

      {/* AXIS 3 */}
      <AxisCard num="3" title="ติดตามและดูแลตัวเอง" color="bg-emerald-50 text-emerald-800" borderClass="border-emerald-300"
        optional enabled={showAxis3} onToggle={() => setShowAxis3(v => !v)}>
        <div>
          <label className={LABEL}>
            ตารางนิสัยประจำ{habitDays <= 7 ? 'สัปดาห์' : 'เดือน'}
            <span className="ml-2 text-violet-500">({habitDays} วัน — กำหนดอัตโนมัติจาก Horizon)</span>
          </label>
          <DynList items={habits} onChange={setHabits}
            placeholder="เช่น ออกกำลังกาย / อ่านหนังสือ / ดื่มน้ำ 8 แก้ว"
            addLabel="เพิ่มนิสัย" />
          {habitDays === 0 && (
            <p className="mt-1 text-[11px] text-amber-600 font-bold">Horizon รายวัน — ตารางนิสัยซ่อนอัตโนมัติใน PDF</p>
          )}
        </div>
        <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-neutral-700">
          <input type="checkbox" checked={includeMood} onChange={e => setIncludeMood(e.target.checked)} className="rounded" />
          บันทึกอารมณ์ประจำวัน (😊 ดีมาก → 😞 แย่)
        </label>
        <div>
          <label className={LABEL}>บันทึกรายรับ-รายจ่าย</label>
          <div className="space-y-2">
            {finCats.map((c, i) => (
              <div key={i} className="flex gap-2">
                <input value={c.name} onChange={e => { const n = [...finCats]; n[i] = { ...n[i], name: e.target.value }; setFinCats(n) }}
                  placeholder="ชื่อรายการ" className={INPUT} />
                <select value={c.type}
                  onChange={e => { const n = [...finCats]; n[i] = { ...n[i], type: e.target.value as 'income' | 'expense' }; setFinCats(n) }}
                  className="rounded-lg border border-neutral-200 bg-neutral-50 px-2 text-sm cursor-pointer">
                  <option value="income">รายรับ</option>
                  <option value="expense">รายจ่าย</option>
                </select>
                {finCats.length > 1 && (
                  <button type="button" onClick={() => setFinCats(prev => prev.filter((_, j) => j !== i))}
                    className="px-2 text-red-400 hover:text-red-600 text-sm">✕</button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => setFinCats(prev => [...prev, { name: '', type: 'expense' }])}
              className="text-xs font-black text-emerald-600 hover:text-emerald-700">+ เพิ่มรายการ</button>
          </div>
        </div>
        <div>
          <label className={LABEL}>รอบทบทวนตัวเอง
            <span className="ml-2 text-violet-500">(กำหนดอัตโนมัติจาก Horizon)</span>
          </label>
          <select value={reviewCycle} onChange={e => setReviewCycle(e.target.value as PlannerAxis3['reviewCycle'])} className={SELECT}>
            <option value="daily">ทุกวัน</option>
            <option value="weekly">รายสัปดาห์</option>
            <option value="monthly">รายเดือน</option>
          </select>
        </div>
        <div>
          <label className={LABEL}>คำถามทบทวนตัวเอง</label>
          <DynList items={reviewQs} onChange={setReviewQs}
            placeholder="เช่น สิ่งที่ทำได้ดีในช่วงนี้คืออะไร?"
            addLabel="เพิ่มคำถาม" />
        </div>
      </AxisCard>

      {/* AXIS 4 */}
      <AxisCard num="4" title="เช็คลิสต์และรายการเตรียมตัว" color="bg-rose-50 text-rose-800" borderClass="border-rose-300"
        optional enabled={showAxis4} onToggle={() => setShowAxis4(v => !v)}>
        <div>
          <label className={LABEL}>เช็คลิสต์แบ่งตามช่วง</label>
          <div className="space-y-4">
            {checklist.map((p, pi) => (
              <div key={pi} className="rounded-lg border border-rose-100 p-3 space-y-2">
                <div className="flex gap-2">
                  <input value={p.phase} onChange={e => setChecklist(prev => prev.map((x, j) => j === pi ? { ...x, phase: e.target.value } : x))}
                    placeholder="ชื่อช่วง เช่น ก่อนออกเดินทาง" className={INPUT} />
                  {checklist.length > 1 && (
                    <button type="button" onClick={() => setChecklist(prev => prev.filter((_, j) => j !== pi))}
                      className="text-red-400 text-sm px-1">✕</button>
                  )}
                </div>
                <DynList items={p.items}
                  onChange={items => setChecklist(prev => prev.map((x, j) => j === pi ? { ...x, items } : x))}
                  placeholder="เช่น จองตั๋วเครื่องบิน" addLabel="เพิ่มรายการ" />
              </div>
            ))}
            <button type="button" onClick={() => setChecklist(prev => [...prev, { phase: '', items: [''] }])}
              className="text-xs font-black text-rose-600 hover:text-rose-700">+ เพิ่มช่วง</button>
          </div>
        </div>
        <div>
          <label className={LABEL}>รายการเตรียมของ (แบ่งตามหมวด)</label>
          <div className="space-y-4">
            {packingList.map((p, pi) => (
              <div key={pi} className="rounded-lg border border-rose-100 p-3 space-y-2">
                <div className="flex gap-2">
                  <input value={p.category} onChange={e => setPackingList(prev => prev.map((x, j) => j === pi ? { ...x, category: e.target.value } : x))}
                    placeholder="หมวด เช่น เสื้อผ้า / ของใช้" className={INPUT} />
                  {packingList.length > 1 && (
                    <button type="button" onClick={() => setPackingList(prev => prev.filter((_, j) => j !== pi))}
                      className="text-red-400 text-sm px-1">✕</button>
                  )}
                </div>
                <DynList items={p.items}
                  onChange={items => setPackingList(prev => prev.map((x, j) => j === pi ? { ...x, items } : x))}
                  placeholder="เช่น เสื้อยืด 5 ตัว" addLabel="เพิ่มรายการ" />
              </div>
            ))}
            <button type="button" onClick={() => setPackingList(prev => [...prev, { category: '', items: [''] }])}
              className="text-xs font-black text-rose-600 hover:text-rose-700">+ เพิ่มหมวด</button>
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-neutral-700">
          <input type="checkbox" checked={ideaBoard} onChange={e => setIdeaBoard(e.target.checked)} className="rounded" />
          บอร์ดไอเดีย (4 ช่อง)
        </label>
      </AxisCard>

      {/* AXIS 5 */}
      <AxisCard num="5" title="บันทึกและทบทวน" color="bg-amber-50 text-amber-800" borderClass="border-amber-300">
        <div>
          <label className={LABEL}>
            บันทึกประจำวัน
            <span className="ml-2 text-violet-500">({diaryEnabled ? `${diaryDays} วัน` : 'ปิด'} — กำหนดอัตโนมัติ)</span>
          </label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-neutral-700">
              <input type="checkbox" checked={diaryEnabled} onChange={e => setDiaryEnabled(e.target.checked)} className="rounded" />
              เปิดใช้งาน
            </label>
            {diaryEnabled && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-500">จำนวนวัน</span>
                <input type="number" min={1} max={31} value={diaryDays}
                  onChange={e => setDiaryDays(Math.min(31, Math.max(1, Number(e.target.value))))}
                  className={`${INPUT} w-20`} />
              </div>
            )}
          </div>
        </div>
        <div>
          <label className={LABEL}>คำถามทบทวนบทเรียน</label>
          <DynList items={reviewQs5} onChange={setReviewQs5}
            placeholder="เช่น สิ่งที่เรียนรู้มากที่สุดคืออะไร?"
            addLabel="เพิ่มคำถาม" />
        </div>
        <div>
          <label className={LABEL}>สไตล์หน้าจดบันทึก</label>
          <div className="flex gap-3 flex-wrap">
            {([['lined','เส้นบรรทัด'],['dotgrid','ตารางจุด'],['blank','ว่างเปล่า']] as const).map(([v,l]) => (
              <label key={v} className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 cursor-pointer text-sm font-bold transition
                ${notesStyle === v ? 'border-amber-500 bg-amber-50 text-amber-800' : 'border-neutral-200 text-neutral-500 hover:border-amber-300'}`}>
                <input type="radio" checked={notesStyle === v} onChange={() => setNotesStyle(v)} className="hidden" />
                {notesStyle === v ? '✓ ' : ''}{l}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className={LABEL}>จำนวนหน้าจดบันทึก</label>
          <input type="number" min={0} max={10} value={notesPages}
            onChange={e => setNotesPages(Math.min(10, Math.max(0, Number(e.target.value))))}
            className={`${INPUT} w-24`} />
        </div>
        <div>
          <label className="flex items-center gap-2 cursor-pointer mb-2 text-sm font-bold text-neutral-700">
            <input type="checkbox" checked={gratitude} onChange={e => setGratitude(e.target.checked)} className="rounded" />
            บันทึกสิ่งดีๆ ประจำวัน
          </label>
          {gratitude && (
            <DynList items={gratitudePs} onChange={setGratitudePs}
              placeholder="เช่น วันนี้ขอบคุณสำหรับ..."
              addLabel="เพิ่มคำถาม" />
          )}
        </div>
      </AxisCard>

    </div>
  )
}
