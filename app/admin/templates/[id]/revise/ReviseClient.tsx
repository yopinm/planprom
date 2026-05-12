'use client'
// DC-8: ReviseClient — pre-filled engine form for revision flow
// Does NOT import ChecklistEngineForm/PlannerEngineForm (frozen) — owns its own state + UI
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type {
  ChecklistEngineData, PlannerEngineData, QuarterlyTheme,
  PlannerEngineDataV2, PlanningHorizon, PlannerSegment,
  PlannerDecisionMatrix, PlannerAxis3,
  PlannerPipelineData, PipelinePhase, PipelineBigRock, PipelineMetric,
  PlannerPipelineDataV4, PipelineHorizon, PipelineWeeklyLayout, PipelineDailyLayout,
  MonthlyPlanItem, WeeklyTaskItem, DailyRoutineItem,
} from '@/lib/engine-types'

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
  const [s1title,   setS1title]   = useState(initial.s1.title)
  const [s1date,    setS1date]    = useState(initial.s1.createdDate)
  const [s1author,  setS1author]  = useState(initial.s1.author)
  const [s2purpose, setS2purpose] = useState(initial.s2.purpose)
  const [s2ctx,     setS2ctx]     = useState(initial.s2.context)
  const [s2pre,     setS2pre]     = useState(initial.s2.prerequisites)
  const [items,     setItems]     = useState(initial.s3.items.length ? initial.s3.items : [''])
  const [exec,      setExec]      = useState(initial.s5.executorRole)
  const [review,    setReview]    = useState(initial.s5.reviewerRole)

  // useEffect — same pattern as frozen ChecklistEngineForm, no stale closure
  useEffect(() => {
    onChange({
      s1: { title: s1title, docCode: initial.s1.docCode, version: initial.s1.version, createdDate: s1date, author: s1author },
      s2: { purpose: s2purpose, context: s2ctx, prerequisites: s2pre },
      s3: { items: items.filter(i => i.trim()) },
      s5: { executorRole: exec, reviewerRole: review },
    })
  }, [s1title, s1date, s1author, s2purpose, s2ctx, s2pre, items, exec, review,
      onChange, initial.s1.docCode, initial.s1.version])

  return (
    <div className="space-y-3">
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
        <DynList items={items} onChange={setItems}
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

  // useEffect — same pattern as frozen PlannerEngineForm, no stale closure
  useEffect(() => {
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
  }, [title, desc, period, fw, goals, themes, rocks, views, dpp, focusAreas, eisenhower,
      habits, mood, finance, reviewCycle, reviewQs, projects, gratitude, gratitudePs,
      notesStyle, brainPages, onChange])

  function toggleView(v: 'monthly' | 'weekly' | 'daily') {
    setViews(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])
  }

  return (
    <div className="space-y-3">
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
          <DynList items={goals} onChange={setGoals}
            placeholder="เช่น เพิ่มยอดขาย 30%" addLabel="เพิ่มเป้าหมาย" color="violet" />
        </div>
        <div>
          <label className={LABEL}>ภาพรวมรายไตรมาส</label>
          <div className="space-y-3">
            {themes.map((t, i) => (
              <div key={i} className="rounded-lg border border-violet-100 p-3 space-y-2">
                <div className="flex gap-2 items-center">
                  <input value={t.quarter}
                    onChange={e => setThemes(prev => prev.map((x, j) => j === i ? { ...x, quarter: e.target.value } : x))}
                    placeholder="Q1" className={`${INPUT} w-20`} />
                  <input value={t.theme}
                    onChange={e => setThemes(prev => prev.map((x, j) => j === i ? { ...x, theme: e.target.value } : x))}
                    placeholder="Theme หลัก..." className={INPUT} />
                  {themes.length > 1 && (
                    <button type="button" onClick={() => setThemes(prev => prev.filter((_, j) => j !== i))}
                      className="text-red-400 text-sm px-1">✕</button>
                  )}
                </div>
                <textarea value={t.keyActions}
                  onChange={e => setThemes(prev => prev.map((x, j) => j === i ? { ...x, keyActions: e.target.value } : x))}
                  rows={2} placeholder="Key actions..." className={`${INPUT} text-xs`} />
              </div>
            ))}
            <button type="button" onClick={() => setThemes(prev => [...prev, { quarter: '', theme: '', keyActions: '' }])}
              className="text-xs font-black text-violet-600">+ เพิ่มไตรมาส</button>
          </div>
        </div>
        <div>
          <label className={LABEL}>Big Rocks</label>
          <DynList items={rocks} onChange={setRocks}
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
          <DynList items={focusAreas} onChange={setFocusAreas}
            placeholder="เช่น งาน · สุขภาพ" addLabel="เพิ่ม Focus Area" />
        </div>
        <label className="flex items-center gap-2 text-sm font-bold text-neutral-700 cursor-pointer">
          <input type="checkbox" checked={eisenhower} onChange={e => setEisenhower(e.target.checked)} />
          รวม Eisenhower Matrix
        </label>
      </Card>

      <Card title="แกนที่ 3 — ติดตามพฤติกรรมและดูแลตัวเอง" color="bg-emerald-50 text-emerald-800">
        <div>
          <label className={LABEL}>Habit Tracker</label>
          <DynList items={habits} onChange={setHabits}
            placeholder="เช่น ออกกำลังกาย" addLabel="เพิ่ม Habit" />
        </div>
        <label className="flex items-center gap-2 text-sm font-bold text-neutral-700 cursor-pointer">
          <input type="checkbox" checked={mood} onChange={e => setMood(e.target.checked)} />
          Mood Tracker
        </label>
        <div>
          <label className={LABEL}>หมวดหมู่การเงิน</label>
          <DynList items={finance} onChange={setFinance}
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
          <DynList items={reviewQs} onChange={setReviewQs}
            placeholder="เช่น สิ่งที่ทำได้ดีคืออะไร?" addLabel="เพิ่มคำถาม" />
        </div>
      </Card>

      <Card title="แกนที่ 4 — บันทึกความคิดและทรัพยากร" color="bg-rose-50 text-rose-800">
        <div>
          <label className={LABEL}>Project Areas</label>
          <DynList items={projects} onChange={setProjects}
            placeholder="เช่น โปรเจกต์ A" addLabel="เพิ่ม Project" />
        </div>
        <label className="flex items-center gap-2 text-sm font-bold text-neutral-700 cursor-pointer">
          <input type="checkbox" checked={gratitude} onChange={e => setGratitude(e.target.checked)} />
          Gratitude Journal
        </label>
        {gratitude && (
          <div>
            <label className={LABEL}>Prompts ความกตัญญู</label>
            <DynList items={gratitudePs} onChange={setGratitudePs}
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

// ── Planner Revise Form v2 ───────────────────────────────────────────────────
function PlannerReviseFormV2({ initial, onChange }: {
  initial: PlannerEngineDataV2
  onChange: (d: PlannerEngineDataV2) => void
}) {
  const [displayTitle, setDisplayTitle] = useState(initial.meta.displayTitle)
  const [description,  setDescription]  = useState(initial.meta.description)
  const [horizon,      setHorizon]      = useState<PlanningHorizon>(initial.meta.planningHorizon)
  const [colorTheme,   setColorTheme]   = useState(initial.meta.colorTheme)
  const [coverPage,    setCoverPage]    = useState(initial.meta.coverPage)
  const [howToUse,     setHowToUse]     = useState(initial.meta.howToUse)

  const [roadmap,     setRoadmap]     = useState<PlannerSegment[]>(initial.axis1.roadmap.length ? initial.axis1.roadmap : getDefaultSegV2(initial.meta.planningHorizon))
  const [goalItems,   setGoalItems]   = useState(initial.axis1.goalItems.length ? initial.axis1.goalItems : [''])
  const [showKpiLine, setShowKpiLine] = useState(initial.axis1.showKpiLine)
  const [bigRocks,    setBigRocks]    = useState(initial.axis1.bigRocks.length ? initial.axis1.bigRocks : [''])

  const [showAxis2,     setShowAxis2]     = useState(!!initial.axis2)
  const [decisions,     setDecisions]     = useState<PlannerDecisionMatrix[]>(initial.axis2?.decisions.length ? initial.axis2.decisions : [{ question: '', options: ['', ''] }])
  const [extraBigRocks, setExtraBigRocks] = useState(initial.axis2?.extraBigRocks.length ? initial.axis2.extraBigRocks : [''])

  const [showAxis3,   setShowAxis3]   = useState(!!initial.axis3)
  const [habits,      setHabits]      = useState(initial.axis3?.habitTracker.habits.length ? initial.axis3.habitTracker.habits : [''])
  const [habitDays,   setHabitDays]   = useState(initial.axis3?.habitTracker.days ?? getHabitDaysV2(initial.meta.planningHorizon))
  const [includeMood, setIncludeMood] = useState(initial.axis3?.includeMoodTracker ?? false)
  const [finCats,     setFinCats]     = useState<{name:string;type:'income'|'expense'}[]>(
    initial.axis3?.financeTracker.categories.length ? initial.axis3.financeTracker.categories : [{ name: 'รายรับ', type: 'income' }, { name: 'รายจ่าย', type: 'expense' }]
  )
  const [reviewCycle, setReviewCycle] = useState<PlannerAxis3['reviewCycle']>(initial.axis3?.reviewCycle ?? getReviewCycleV2(initial.meta.planningHorizon))
  const [reviewQs,    setReviewQs]    = useState(initial.axis3?.reviewQuestions.length ? initial.axis3.reviewQuestions : [''])

  const [showAxis4,   setShowAxis4]   = useState(!!initial.axis4)
  const [checklist,   setChecklist]   = useState<{phase:string;items:string[]}[]>(initial.axis4?.checklist.length ? initial.axis4.checklist : [{ phase: '', items: [''] }])
  const [packingList, setPackingList] = useState<{category:string;items:string[]}[]>(initial.axis4?.packingList.length ? initial.axis4.packingList : [{ category: '', items: [''] }])
  const [ideaBoard,   setIdeaBoard]   = useState(initial.axis4?.ideaBoard ?? false)

  const [diaryEnabled, setDiaryEnabled] = useState(initial.axis5.dailyDiary.enabled)
  const [diaryDays,    setDiaryDays]    = useState(initial.axis5.dailyDiary.days || 7)
  const [reviewQs5,    setReviewQs5]    = useState(initial.axis5.reviewQuestions.length ? initial.axis5.reviewQuestions : [''])
  const [notesStyle,   setNotesStyle]   = useState(initial.axis5.notesStyle)
  const [notesPages,   setNotesPages]   = useState(initial.axis5.notesPages)
  const [gratitude,    setGratitude]    = useState(initial.axis5.includeGratitudeJournal)
  const [gratitudePs,  setGratitudePs]  = useState(initial.axis5.gratitudePrompts.length ? initial.axis5.gratitudePrompts : [''])

  const firstMount = useRef(true)
  useEffect(() => {
    if (firstMount.current) { firstMount.current = false; return }
    setRoadmap(getDefaultSegV2(horizon))
    setHabitDays(getHabitDaysV2(horizon))
    setReviewCycle(getReviewCycleV2(horizon))
    const dd = horizon === 'month' ? 7 : 0
    setDiaryEnabled(dd > 0)
    setDiaryDays(dd > 0 ? dd : diaryDays)
  }, [horizon]) // eslint-disable-line react-hooks/exhaustive-deps

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
      extras: initial.extras,
    })
  }, [
    displayTitle, description, horizon, colorTheme, coverPage, howToUse,
    roadmap, goalItems, showKpiLine, bigRocks,
    showAxis2, decisions, extraBigRocks,
    showAxis3, habits, habitDays, includeMood, finCats, reviewCycle, reviewQs,
    showAxis4, checklist, packingList, ideaBoard,
    diaryEnabled, diaryDays, reviewQs5, notesStyle, notesPages, gratitude, gratitudePs,
    onChange, initial.extras,
  ])

  return (
    <div className="space-y-3">
      <Card title="ตั้งค่าพื้นฐาน" color="bg-neutral-100 text-neutral-800">
        <div>
          <label className={LABEL}>ชื่อ Planner ที่แสดงใน PDF *</label>
          <input value={displayTitle} onChange={e => setDisplayTitle(e.target.value)} className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>คำอธิบาย</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>ช่วงเวลาหลักของแผน</label>
          <select value={horizon} onChange={e => setHorizon(e.target.value as PlanningHorizon)} className={SELECT}>
            <option value="year">รายปี</option>
            <option value="month">รายเดือน</option>
            <option value="week">รายสัปดาห์</option>
            <option value="day">รายวัน</option>
          </select>
        </div>
        <div>
          <label className={LABEL}>สีธีม</label>
          <select value={colorTheme} onChange={e => setColorTheme(e.target.value as typeof colorTheme)} className={SELECT}>
            <option value="violet">ม่วง</option>
            <option value="indigo">น้ำเงิน</option>
            <option value="emerald">เขียว</option>
            <option value="rose">ชมพู</option>
            <option value="amber">เหลือง</option>
          </select>
        </div>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-neutral-700">
            <input type="checkbox" checked={coverPage} onChange={e => setCoverPage(e.target.checked)} /> หน้าปก
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-neutral-700">
            <input type="checkbox" checked={howToUse} onChange={e => setHowToUse(e.target.checked)} /> วิธีใช้
          </label>
        </div>
      </Card>

      <Card title="แกนที่ 1 — ทิศทางและเป้าหมาย" color="bg-violet-50 text-violet-800">
        <div>
          <label className={LABEL}>โครงสร้างแผนงาน</label>
          <div className="space-y-3">
            {roadmap.map((s, i) => (
              <div key={i} className="rounded-lg border border-violet-100 p-3 space-y-2">
                <div className="flex gap-2">
                  <input value={s.label} onChange={e => setRoadmap(prev => prev.map((x,j)=>j===i?{...x,label:e.target.value}:x))}
                    placeholder="ช่วงเวลา" className={`${INPUT} w-32 font-bold`} />
                  <input value={s.theme} onChange={e => setRoadmap(prev => prev.map((x,j)=>j===i?{...x,theme:e.target.value}:x))}
                    placeholder="ธีม / เป้าหมายช่วงนี้..." className={INPUT} />
                </div>
                <textarea value={s.keyActions} onChange={e => setRoadmap(prev => prev.map((x,j)=>j===i?{...x,keyActions:e.target.value}:x))}
                  rows={2} placeholder="สิ่งที่จะทำ (1 บรรทัด = 1 รายการ)" className={`${INPUT} text-xs`} />
              </div>
            ))}
          </div>
        </div>
        <div>
          <label className={LABEL}>เป้าหมายหลัก</label>
          <DynList items={goalItems} onChange={setGoalItems} placeholder="เช่น เพิ่มยอดขาย 30%" addLabel="เพิ่มเป้าหมาย" color="violet" />
        </div>
        <label className="flex items-center gap-2 text-sm font-bold text-neutral-700 cursor-pointer">
          <input type="checkbox" checked={showKpiLine} onChange={e => setShowKpiLine(e.target.checked)} />
          แสดงช่อง "ตัวชี้วัด / วิธีวัดผล" ใน PDF
        </label>
        <div>
          <label className={LABEL}>สิ่งสำคัญที่ต้องทำให้ได้ก่อน</label>
          <DynList items={bigRocks} onChange={setBigRocks} placeholder="เช่น เปิดตัวสินค้าใหม่" addLabel="เพิ่ม" color="violet" />
        </div>
      </Card>

      <Card title={`แกนที่ 2 — ตารางตัดสินใจ ${showAxis2 ? '✓' : '(ปิด)'}`} color="bg-sky-50 text-sky-800">
        <label className="flex items-center gap-2 text-sm font-bold text-neutral-700 cursor-pointer">
          <input type="checkbox" checked={showAxis2} onChange={e => setShowAxis2(e.target.checked)} />
          เปิดใช้งานแกนที่ 2
        </label>
        {showAxis2 && (
          <>
            {decisions.map((d, di) => (
              <div key={di} className="rounded-lg border border-sky-100 p-3 space-y-2">
                <input value={d.question}
                  onChange={e => setDecisions(prev => prev.map((x,j)=>j===di?{...x,question:e.target.value}:x))}
                  placeholder="คำถามสำหรับตัดสินใจ" className={INPUT} />
                {d.options.map((o, oi) => (
                  <input key={oi} value={o}
                    onChange={e => setDecisions(prev => prev.map((x,j)=>j===di?{...x,options:x.options.map((v,k)=>k===oi?e.target.value:v)}:x))}
                    placeholder={`ตัวเลือกที่ ${oi+1}`} className={INPUT} />
                ))}
              </div>
            ))}
            <DynList items={extraBigRocks} onChange={setExtraBigRocks} placeholder="รายการเพิ่มเติม" addLabel="เพิ่ม" />
          </>
        )}
      </Card>

      <Card title={`แกนที่ 3 — ติดตามและดูแลตัวเอง ${showAxis3 ? '✓' : '(ปิด)'}`} color="bg-emerald-50 text-emerald-800">
        <label className="flex items-center gap-2 text-sm font-bold text-neutral-700 cursor-pointer">
          <input type="checkbox" checked={showAxis3} onChange={e => setShowAxis3(e.target.checked)} />
          เปิดใช้งานแกนที่ 3
        </label>
        {showAxis3 && (
          <>
            <div>
              <label className={LABEL}>ตารางนิสัย ({habitDays} วัน)</label>
              <DynList items={habits} onChange={setHabits} placeholder="เช่น ออกกำลังกาย" addLabel="เพิ่มนิสัย" />
            </div>
            <label className="flex items-center gap-2 text-sm font-bold text-neutral-700 cursor-pointer">
              <input type="checkbox" checked={includeMood} onChange={e => setIncludeMood(e.target.checked)} />
              บันทึกอารมณ์ประจำวัน
            </label>
            <div>
              <label className={LABEL}>รายรับ-รายจ่าย</label>
              <div className="space-y-2">
                {finCats.map((c, i) => (
                  <div key={i} className="flex gap-2">
                    <input value={c.name}
                      onChange={e => setFinCats(prev => prev.map((x,j)=>j===i?{...x,name:e.target.value}:x))}
                      placeholder="ชื่อรายการ" className={INPUT} />
                    <select value={c.type}
                      onChange={e => setFinCats(prev => prev.map((x,j)=>j===i?{...x,type:e.target.value as 'income'|'expense'}:x))}
                      className="rounded-lg border border-neutral-200 bg-neutral-50 px-2 text-sm cursor-pointer">
                      <option value="income">รายรับ</option>
                      <option value="expense">รายจ่าย</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className={LABEL}>รอบทบทวน</label>
              <select value={reviewCycle} onChange={e => setReviewCycle(e.target.value as PlannerAxis3['reviewCycle'])} className={SELECT}>
                <option value="daily">ทุกวัน</option>
                <option value="weekly">รายสัปดาห์</option>
                <option value="monthly">รายเดือน</option>
              </select>
            </div>
            <div>
              <label className={LABEL}>คำถามทบทวน</label>
              <DynList items={reviewQs} onChange={setReviewQs} placeholder="เช่น สิ่งที่ทำได้ดีคืออะไร?" addLabel="เพิ่มคำถาม" />
            </div>
          </>
        )}
      </Card>

      <Card title={`แกนที่ 4 — เช็คลิสต์ ${showAxis4 ? '✓' : '(ปิด)'}`} color="bg-rose-50 text-rose-800">
        <label className="flex items-center gap-2 text-sm font-bold text-neutral-700 cursor-pointer">
          <input type="checkbox" checked={showAxis4} onChange={e => setShowAxis4(e.target.checked)} />
          เปิดใช้งานแกนที่ 4
        </label>
        {showAxis4 && (
          <>
            {checklist.map((p, pi) => (
              <div key={pi} className="rounded-lg border border-rose-100 p-3 space-y-2">
                <input value={p.phase}
                  onChange={e => setChecklist(prev => prev.map((x,j)=>j===pi?{...x,phase:e.target.value}:x))}
                  placeholder="ชื่อช่วง" className={INPUT} />
                <DynList items={p.items}
                  onChange={items => setChecklist(prev => prev.map((x,j)=>j===pi?{...x,items}:x))}
                  placeholder="รายการ" addLabel="เพิ่ม" />
              </div>
            ))}
            <label className="flex items-center gap-2 text-sm font-bold text-neutral-700 cursor-pointer">
              <input type="checkbox" checked={ideaBoard} onChange={e => setIdeaBoard(e.target.checked)} />
              บอร์ดไอเดีย
            </label>
          </>
        )}
      </Card>

      <Card title="แกนที่ 5 — บันทึกและทบทวน" color="bg-amber-50 text-amber-800">
        <label className="flex items-center gap-2 text-sm font-bold text-neutral-700 cursor-pointer">
          <input type="checkbox" checked={diaryEnabled} onChange={e => setDiaryEnabled(e.target.checked)} />
          บันทึกประจำวัน
          {diaryEnabled && (
            <input type="number" min={1} max={31} value={diaryDays}
              onChange={e => setDiaryDays(Number(e.target.value))}
              className={`${INPUT} w-20 ml-2`} />
          )}
        </label>
        <div>
          <label className={LABEL}>คำถามทบทวนบทเรียน</label>
          <DynList items={reviewQs5} onChange={setReviewQs5} placeholder="เช่น สิ่งที่เรียนรู้มากที่สุด?" addLabel="เพิ่มคำถาม" />
        </div>
        <div>
          <label className={LABEL}>สไตล์หน้าจดบันทึก</label>
          <select value={notesStyle} onChange={e => setNotesStyle(e.target.value as typeof notesStyle)} className={SELECT}>
            <option value="lined">เส้นบรรทัด</option>
            <option value="dotgrid">ตารางจุด</option>
            <option value="blank">ว่างเปล่า</option>
          </select>
        </div>
        <div>
          <label className={LABEL}>จำนวนหน้าจดบันทึก</label>
          <input type="number" min={0} max={10} value={notesPages}
            onChange={e => setNotesPages(Number(e.target.value))} className={`${INPUT} w-24`} />
        </div>
        <label className="flex items-center gap-2 text-sm font-bold text-neutral-700 cursor-pointer">
          <input type="checkbox" checked={gratitude} onChange={e => setGratitude(e.target.checked)} />
          บันทึกสิ่งดีๆ
        </label>
        {gratitude && (
          <DynList items={gratitudePs} onChange={setGratitudePs} placeholder="วันนี้ขอบคุณสำหรับ..." addLabel="เพิ่มคำถาม" />
        )}
      </Card>
    </div>
  )
}

// ── Pipeline Revise Form ─────────────────────────────────────────────────────
function PipelineReviseForm({ initial, onChange }: {
  initial: PlannerPipelineData
  onChange: (d: PlannerPipelineData) => void
}) {
  const [displayTitle, setDisplayTitle] = useState(initial.meta.title)
  const [description,  setDescription]  = useState(initial.meta.description)
  const [colorTheme,   setColorTheme]   = useState(initial.meta.colorTheme)
  const [coverPage,    setCoverPage]    = useState(initial.meta.coverPage)

  const [bigGoal,         setBigGoal]         = useState(initial.stage1_goal.bigGoal)
  const [deadline,        setDeadline]        = useState(initial.stage1_goal.deadline)
  const [why,             setWhy]             = useState(initial.stage1_goal.why)
  const [successCriteria, setSuccessCriteria] = useState<string[]>(initial.stage1_goal.successCriteria.length ? initial.stage1_goal.successCriteria : [''])
  const [budget,          setBudget]          = useState(initial.stage1_goal.constraints.budget ?? '')
  const [timeLimit,       setTimeLimit]       = useState(initial.stage1_goal.constraints.timeLimit ?? '')
  const [others,          setOthers]          = useState<string[]>(initial.stage1_goal.constraints.others ?? [])

  const [phases,   setPhases]   = useState<PipelinePhase[]>(initial.stage2_plan.phases.length ? initial.stage2_plan.phases : [{ name: 'Phase 1', timeRange: '', tasks: [''], budget: '' }])
  const [bigRocks, setBigRocks] = useState<PipelineBigRock[]>(initial.stage2_plan.bigRocks.length ? initial.stage2_plan.bigRocks : [{ task: '', deadline: '' }])

  const [habits,          setHabits]          = useState<string[]>(initial.stage3_track.habits.length ? initial.stage3_track.habits : [''])
  const [metrics,         setMetrics]         = useState<PipelineMetric[]>(initial.stage3_track.metrics.length ? initial.stage3_track.metrics : [{ name: '', target: '', frequency: 'weekly' }])
  const [reviewCycle,     setReviewCycle]     = useState(initial.stage3_track.reviewCycle)
  const [reviewQuestions, setReviewQuestions] = useState<string[]>(initial.stage3_track.reviewQuestions.length ? initial.stage3_track.reviewQuestions : [''])
  const [adjustmentRules, setAdjustmentRules] = useState<string[]>(initial.stage3_track.adjustmentRules ?? [])

  const [notesStyle, setNotesStyle] = useState(initial.notes?.notesStyle ?? 'lined' as 'lined'|'dotgrid'|'blank')
  const [notesPages, setNotesPages] = useState(initial.notes?.notesPages ?? 1)
  const [diaryDays,  setDiaryDays]  = useState(initial.notes?.diaryDays ?? 0)

  useEffect(() => {
    onChange({
      meta: { schemaVersion: '3.0', mode: 'pipeline', title: displayTitle, description, colorTheme, coverPage },
      stage1_goal: {
        bigGoal, deadline, why,
        successCriteria: successCriteria.filter(s => s.trim()),
        constraints: {
          ...(budget.trim()    ? { budget }    : {}),
          ...(timeLimit.trim() ? { timeLimit } : {}),
          ...(others.filter(o => o.trim()).length > 0 ? { others: others.filter(o => o.trim()) } : {}),
        },
      },
      stage2_plan: {
        phases: phases.filter(p => p.name.trim()).map(p => ({ ...p, tasks: p.tasks.filter(t => t.trim()) })),
        bigRocks: bigRocks.filter(r => r.task.trim()),
      },
      stage3_track: {
        habits: habits.filter(h => h.trim()),
        metrics: metrics.filter(m => m.name.trim()),
        reviewCycle,
        reviewQuestions: reviewQuestions.filter(q => q.trim()),
        ...(adjustmentRules.filter(r => r.trim()).length > 0 ? { adjustmentRules: adjustmentRules.filter(r => r.trim()) } : {}),
      },
      notes: (notesPages > 0 || diaryDays > 0) ? { diaryDays, notesPages, notesStyle } : undefined,
      extras: initial.extras,
    })
  }, [
    displayTitle, description, colorTheme, coverPage,
    bigGoal, deadline, why, successCriteria, budget, timeLimit, others,
    phases, bigRocks, habits, metrics, reviewCycle, reviewQuestions, adjustmentRules,
    notesStyle, notesPages, diaryDays, onChange, initial.extras,
  ])

  return (
    <div className="space-y-3">
      <Card title="ตั้งค่า PDF" color="bg-neutral-100 text-neutral-800">
        <div>
          <label className={LABEL}>ชื่อที่แสดงใน PDF *</label>
          <input value={displayTitle} onChange={e => setDisplayTitle(e.target.value)} className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>คำอธิบาย</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>สีธีม</label>
          <select value={colorTheme} onChange={e => setColorTheme(e.target.value as typeof colorTheme)} className={SELECT}>
            <option value="violet">ม่วง</option>
            <option value="rose">ชมพู</option>
            <option value="emerald">เขียว</option>
            <option value="amber">เหลือง</option>
            <option value="sky">ฟ้า</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm font-bold text-neutral-700 cursor-pointer">
          <input type="checkbox" checked={coverPage} onChange={e => setCoverPage(e.target.checked)} /> หน้าปก
        </label>
      </Card>

      <Card title="ขั้นที่ 1 — ตั้งเป้าหมาย" color="bg-violet-50 text-violet-800">
        <div>
          <label className={LABEL}>เป้าหมายใหญ่ *</label>
          <textarea value={bigGoal} onChange={e => setBigGoal(e.target.value)} rows={2} className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>Deadline *</label>
          <input value={deadline} onChange={e => setDeadline(e.target.value)} className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>ทำไมเป้าหมายนี้ถึงสำคัญ?</label>
          <input value={why} onChange={e => setWhy(e.target.value)} className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>เกณฑ์ความสำเร็จ</label>
          <DynList items={successCriteria} onChange={setSuccessCriteria} placeholder="เช่น ยอดขายถึง ฿100,000" addLabel="เพิ่มเกณฑ์" color="violet" />
        </div>
        <div className="space-y-2">
          <label className={LABEL}>ข้อจำกัด (ไม่บังคับ)</label>
          <input value={budget} onChange={e => setBudget(e.target.value)} placeholder="งบ เช่น ฿50,000" className={INPUT} />
          <input value={timeLimit} onChange={e => setTimeLimit(e.target.value)} placeholder="เวลา เช่น ทำได้วันละ 2 ชั่วโมง" className={INPUT} />
          {others.length > 0
            ? <DynList items={others} onChange={setOthers} placeholder="อื่นๆ" addLabel="เพิ่ม" />
            : <button type="button" onClick={() => setOthers([''])} className="text-xs font-black text-neutral-500 hover:text-neutral-700">+ อื่นๆ</button>
          }
        </div>
      </Card>

      <Card title="ขั้นที่ 2 — วางแผนลงมือทำ" color="bg-emerald-50 text-emerald-800">
        <div>
          <label className={LABEL}>Phase / ขั้นตอน</label>
          <div className="space-y-3">
            {phases.map((p, pi) => (
              <div key={pi} className="rounded-lg border border-emerald-100 p-3 space-y-2">
                <div className="flex gap-2">
                  <input value={p.name} onChange={e => setPhases(prev => prev.map((x,j)=>j===pi?{...x,name:e.target.value}:x))}
                    placeholder={`Phase ${pi+1}`} className={`${INPUT} font-bold`} />
                  {phases.length > 1 && (
                    <button type="button" onClick={() => setPhases(prev => prev.filter((_,j)=>j!==pi))} className="text-red-400 text-sm px-1">✕</button>
                  )}
                </div>
                <input value={p.timeRange} onChange={e => setPhases(prev => prev.map((x,j)=>j===pi?{...x,timeRange:e.target.value}:x))}
                  placeholder="ช่วงเวลา เช่น ม.ค. – ก.พ." className={INPUT} />
                <DynList items={p.tasks} onChange={tasks => setPhases(prev => prev.map((x,j)=>j===pi?{...x,tasks}:x))}
                  placeholder="งานที่ต้องทำ" addLabel="เพิ่มงาน" />
                <input value={p.budget ?? ''} onChange={e => setPhases(prev => prev.map((x,j)=>j===pi?{...x,budget:e.target.value}:x))}
                  placeholder="งบ (ไม่บังคับ)" className={`${INPUT} text-xs`} />
              </div>
            ))}
            <button type="button" onClick={() => setPhases(prev => [...prev, { name: `Phase ${prev.length+1}`, timeRange: '', tasks: [''], budget: '' }])}
              className="text-xs font-black text-emerald-600 hover:text-emerald-700">+ เพิ่ม Phase</button>
          </div>
        </div>
        <div>
          <label className={LABEL}>Big Rocks</label>
          <p className="text-xs text-neutral-500 mb-2">
            งานใหญ่ที่ถ้าไม่ทำ เป้าหมายจะไม่สำเร็จ — ใส่ deadline กำกับแต่ละงานด้วย
            <span className="block text-neutral-400 mt-0.5">เช่น "ทำ Landing Page ให้เสร็จ" deadline "15 มิ.ย."</span>
          </p>
          <div className="space-y-2">
            {bigRocks.map((r, i) => (
              <div key={i} className="flex gap-2">
                <input value={r.task} onChange={e => setBigRocks(prev => prev.map((x,j)=>j===i?{...x,task:e.target.value}:x))} placeholder="งานสำคัญ" className={INPUT} />
                <input value={r.deadline} onChange={e => setBigRocks(prev => prev.map((x,j)=>j===i?{...x,deadline:e.target.value}:x))} placeholder="Deadline" className={`${INPUT} w-32`} />
                {bigRocks.length > 1 && (
                  <button type="button" onClick={() => setBigRocks(prev => prev.filter((_,j)=>j!==i))} className="text-red-400 text-sm px-1">✕</button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => setBigRocks(prev => [...prev, { task: '', deadline: '' }])}
              className="text-xs font-black text-emerald-600 hover:text-emerald-700">+ เพิ่ม Big Rock</button>
          </div>
        </div>
      </Card>

      <Card title="ขั้นที่ 3 — ติดตามผล" color="bg-amber-50 text-amber-800">
        <div>
          <label className={LABEL}>นิสัยที่ต้องติดตาม</label>
          <DynList items={habits} onChange={setHabits} placeholder="เช่น ทบทวนแผน 15 นาที" addLabel="เพิ่มนิสัย" />
        </div>
        <div>
          <label className={LABEL}>ตัวชี้วัด (KPI)</label>
          <div className="space-y-2">
            {metrics.map((m, i) => (
              <div key={i} className="flex gap-2">
                <input value={m.name} onChange={e => setMetrics(prev => prev.map((x,j)=>j===i?{...x,name:e.target.value}:x))} placeholder="ชื่อ KPI" className={INPUT} />
                <input value={m.target} onChange={e => setMetrics(prev => prev.map((x,j)=>j===i?{...x,target:e.target.value}:x))} placeholder="เป้า" className={INPUT} />
                <select value={m.frequency} onChange={e => setMetrics(prev => prev.map((x,j)=>j===i?{...x,frequency:e.target.value as 'daily'|'weekly'|'monthly'}:x))}
                  className="rounded-lg border border-neutral-200 bg-neutral-50 px-2 text-sm cursor-pointer">
                  <option value="daily">ทุกวัน</option>
                  <option value="weekly">รายสัปดาห์</option>
                  <option value="monthly">รายเดือน</option>
                </select>
                {metrics.length > 1 && (
                  <button type="button" onClick={() => setMetrics(prev => prev.filter((_,j)=>j!==i))} className="text-red-400 text-sm px-1">✕</button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => setMetrics(prev => [...prev, { name: '', target: '', frequency: 'weekly' }])}
              className="text-xs font-black text-amber-600 hover:text-amber-700">+ เพิ่ม Metric</button>
          </div>
        </div>
        <div>
          <label className={LABEL}>รอบทบทวน</label>
          <select value={reviewCycle} onChange={e => setReviewCycle(e.target.value as typeof reviewCycle)} className={SELECT}>
            <option value="daily">ทุกวัน</option>
            <option value="weekly">รายสัปดาห์</option>
            <option value="monthly">รายเดือน</option>
          </select>
        </div>
        <div>
          <label className={LABEL}>คำถามทบทวน</label>
          <DynList items={reviewQuestions} onChange={setReviewQuestions} placeholder="เช่น สิ่งที่ทำได้ดีคืออะไร?" addLabel="เพิ่มคำถาม" />
        </div>
        {adjustmentRules.length > 0 && (
          <div>
            <label className={LABEL}>กฎปรับแผน</label>
            <DynList items={adjustmentRules} onChange={setAdjustmentRules} placeholder="เช่น ถ้าช้า 2 สัปดาห์ ตัด Phase สุดท้าย" addLabel="เพิ่มกฎ" />
          </div>
        )}
        <div className="border-t border-neutral-100 pt-3 space-y-2">
          <label className={LABEL}>หน้าบันทึก</label>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-600">จดบันทึก</span>
              <input type="number" min={0} max={10} value={notesPages} onChange={e => setNotesPages(Number(e.target.value))} className={`${INPUT} w-20`} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-600">บันทึกรายวัน (วัน)</span>
              <input type="number" min={0} max={31} value={diaryDays} onChange={e => setDiaryDays(Number(e.target.value))} className={`${INPUT} w-20`} />
            </div>
          </div>
          <select value={notesStyle} onChange={e => setNotesStyle(e.target.value as typeof notesStyle)} className={SELECT}>
            <option value="lined">เส้นบรรทัด</option>
            <option value="dotgrid">ตารางจุด</option>
            <option value="blank">ว่างเปล่า</option>
          </select>
        </div>
      </Card>
    </div>
  )
}

// ── Pipeline Revise Form V4 ──────────────────────────────────────────────────
function PipelineReviseFormV4({ initial, onChange }: {
  initial: PlannerPipelineDataV4
  onChange: (d: PlannerPipelineDataV4) => void
}) {
  const [displayTitle, setDisplayTitle] = useState(initial.meta.title)
  const [description,  setDescription]  = useState(initial.meta.description)
  const [colorTheme,   setColorTheme]   = useState(initial.meta.colorTheme)
  const [coverPage,    setCoverPage]    = useState(initial.meta.coverPage)

  const [goal,         setGoal]         = useState(initial.s1_goal.goal)
  const [why,          setWhy]          = useState(initial.s1_goal.why)
  const [deadline,     setDeadline]     = useState(initial.s1_goal.deadline)
  const [horizon,      setHorizon]      = useState<PipelineHorizon>(initial.s1_goal.horizon)
  const [horizonValue, setHorizonValue] = useState(initial.s1_goal.horizonValue)

  const [fromMonth,        setFromMonth]        = useState(initial.s2_timeplan.fromMonth ?? 1)
  const [toMonth,          setToMonth]          = useState(initial.s2_timeplan.toMonth ?? 12)
  const [monthlyWeekCount, setMonthlyWeekCount] = useState(initial.s2_timeplan.monthlyWeekCount ?? 4)
  const [s2Summary,        setS2Summary]        = useState(initial.s2_timeplan.summary ?? '')
  const [phases,   setPhases]   = useState<PipelinePhase[]>(initial.s2_timeplan.phases?.length ? initial.s2_timeplan.phases : [{ name: 'Phase 1', timeRange: '', tasks: [''], budget: '' }])
  const [bigRocks, setBigRocks] = useState<PipelineBigRock[]>(initial.s2_timeplan.bigRocks?.length ? initial.s2_timeplan.bigRocks : [{ task: '', deadline: '' }])

  const [weekCount,   setWeekCount]   = useState(initial.s3_weekly?.weekCount ?? 0)
  const [weekLayout,  setWeekLayout]  = useState<PipelineWeeklyLayout>(initial.s3_weekly?.layout ?? '135rule')
  const [startDay,    setStartDay]    = useState(initial.s3_weekly?.startDay ?? 'mon')
  const [dayCount,    setDayCount]    = useState(initial.s4_daily?.dayCount ?? 0)
  const [dayLayout,   setDayLayout]   = useState<PipelineDailyLayout>(initial.s4_daily?.layout ?? 'combined')
  const [reviewCycle, setReviewCycle] = useState(initial.s5_review.reviewCycle)
  const [reviewQs,    setReviewQs]    = useState<string[]>(initial.s5_review.reviewQuestions.length ? initial.s5_review.reviewQuestions : [''])

  // s3_content
  const [monthlyPlans, setMonthlyPlans] = useState<MonthlyPlanItem[]>(initial.s3_content?.monthlyPlans ?? [])
  const [weeklyPlans,  setWeeklyPlans]  = useState<WeeklyTaskItem[]>(initial.s3_content?.weeklyPlans ?? [])
  const [flexItems,    setFlexItems]    = useState<{ label: string; tasks: string[] }[]>(initial.s3_content?.flexItems ?? [{ label: '', tasks: [''] }])

  // s4_content
  const [weeklyTasks,   setWeeklyTasks]   = useState<WeeklyTaskItem[]>(initial.s4_content?.weeklyTasks ?? [{ weekLabel: '', goal: '', main1: '', secondary: ['', '', ''], small: ['', '', '', '', '', ''] }])
  const [dailyRoutines, setDailyRoutines] = useState<DailyRoutineItem[]>(initial.s4_content?.dailyRoutines ?? [{ time: '', activity: '' }])

  useEffect(() => {
    const s2: PlannerPipelineDataV4['s2_timeplan'] = horizon === 'yearly'
      ? { year: horizonValue, fromMonth, toMonth, summary: s2Summary || undefined }
      : horizon === 'monthly'
        ? { month: horizonValue, monthlyWeekCount, summary: s2Summary || undefined }
        : {
            phases: phases.filter(p => p.name.trim()).map(p => ({ ...p, tasks: p.tasks.filter(t => t.trim()) })),
            bigRocks: bigRocks.filter(r => r.task.trim()),
            summary: s2Summary || undefined,
          }

    const s3_content: PlannerPipelineDataV4['s3_content'] | undefined =
      monthlyPlans.length > 0 ? { monthlyPlans } :
      weeklyPlans.length > 0  ? { weeklyPlans } :
      flexItems.some(f => f.label.trim() || f.tasks.some(t => t.trim())) ? { flexItems } :
      undefined

    const s4_content: PlannerPipelineDataV4['s4_content'] | undefined =
      weeklyTasks.some(wt => wt.main1.trim() || wt.weekLabel.trim()) ? { weeklyTasks } :
      dailyRoutines.some(r => r.time.trim() || r.activity.trim()) ? { dailyRoutines } :
      undefined

    onChange({
      meta: { schemaVersion: '4.0', mode: 'pipeline', title: displayTitle, description, colorTheme, coverPage },
      s1_goal: { goal, why, deadline, horizon, horizonValue },
      s2_timeplan: s2,
      ...(weekCount > 0 ? { s3_weekly: { weekCount, layout: weekLayout, startDay } } : {}),
      ...(s3_content ? { s3_content } : {}),
      ...(dayCount > 0 ? { s4_daily: { dayCount, layout: dayLayout } } : {}),
      ...(s4_content ? { s4_content } : {}),
      s5_review: { reviewCycle, reviewQuestions: reviewQs.filter(q => q.trim()) },
    })
  }, [
    displayTitle, description, colorTheme, coverPage,
    goal, why, deadline, horizon, horizonValue,
    fromMonth, toMonth, monthlyWeekCount, s2Summary,
    phases, bigRocks,
    weekCount, weekLayout, startDay, dayCount, dayLayout,
    monthlyPlans, weeklyPlans, flexItems,
    weeklyTasks, dailyRoutines,
    reviewCycle, reviewQs, onChange,
  ])

  return (
    <div className="space-y-3">
      <Card title="ตั้งค่า PDF" color="bg-neutral-100 text-neutral-800">
        <div>
          <label className={LABEL}>ชื่อที่แสดงใน PDF *</label>
          <input value={displayTitle} onChange={e => setDisplayTitle(e.target.value)} className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>คำอธิบาย</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>สีธีม</label>
          <select value={colorTheme} onChange={e => setColorTheme(e.target.value as typeof colorTheme)} className={SELECT}>
            <option value="violet">ม่วง</option>
            <option value="rose">ชมพู</option>
            <option value="emerald">เขียว</option>
            <option value="amber">เหลือง</option>
            <option value="sky">ฟ้า</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm font-bold text-neutral-700 cursor-pointer">
          <input type="checkbox" checked={coverPage} onChange={e => setCoverPage(e.target.checked)} /> หน้าปก
        </label>
      </Card>

      <Card title="แกนที่ 1 — เป้าหมาย" color="bg-violet-50 text-violet-800">
        <div>
          <label className={LABEL}>เป้าหมายหลัก *</label>
          <textarea value={goal} onChange={e => setGoal(e.target.value)} rows={2} className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>ทำไมถึงสำคัญ</label>
          <input value={why} onChange={e => setWhy(e.target.value)} className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>ต้องเสร็จภายใน *</label>
          <input value={deadline} onChange={e => setDeadline(e.target.value)} className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>รูปแบบแผน</label>
          <select value={horizon} onChange={e => setHorizon(e.target.value as PipelineHorizon)} className={SELECT}>
            <option value="yearly">รายปี</option>
            <option value="monthly">รายเดือน</option>
            <option value="project">โปรเจกต์</option>
          </select>
        </div>
        {(horizon === 'yearly' || horizon === 'monthly') && (
          <div>
            <label className={LABEL}>{horizon === 'yearly' ? 'ปี' : 'เดือน + ปี'}</label>
            <input value={horizonValue} onChange={e => setHorizonValue(e.target.value)}
              placeholder={horizon === 'yearly' ? 'เช่น 2026' : 'เช่น พฤษภาคม 2026'} className={INPUT} />
          </div>
        )}
        {horizon === 'yearly' && (() => {
          const MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม']
          return (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>ตั้งแต่เดือน</label>
                <select value={fromMonth} onChange={e => { const v = Number(e.target.value); setFromMonth(v); if (v > toMonth) setToMonth(v) }} className={SELECT}>
                  {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL}>ถึงเดือน</label>
                <select value={toMonth} onChange={e => { const v = Number(e.target.value); setToMonth(v); if (v < fromMonth) setFromMonth(v) }} className={SELECT}>
                  {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
            </div>
          )
        })()}
        {horizon === 'monthly' && (
          <div>
            <label className={LABEL}>จำนวนสัปดาห์</label>
            <select value={monthlyWeekCount} onChange={e => setMonthlyWeekCount(Number(e.target.value))} className={SELECT}>
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} สัปดาห์</option>)}
            </select>
          </div>
        )}
      </Card>

      <Card title="สรุปเทมเพลต (แสดงใน PDF + modal ลูกค้า)" color="bg-amber-50 text-amber-800">
        <div>
          <label className={LABEL}>สรุปเทมเพลตนี้ให้ลูกค้า</label>
          <textarea value={s2Summary} onChange={e => setS2Summary(e.target.value)} rows={3} className={INPUT}
            placeholder="เช่น แพลนเนอร์ครบ 3 เดือน สำหรับเจ้าของร้านที่ต้องการวางแผนเปิดสาขาใหม่..." />
          <p className="mt-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
            ⚡ ข้อความนี้จะแสดงใน PDF หน้า 1 และหน้าตัวอย่างสินค้าที่ลูกค้าเห็นก่อนตัดสินใจซื้อ
          </p>
        </div>
      </Card>

      {horizon === 'project' && (
        <Card title="แกนที่ 2 — แผนดำเนินการ" color="bg-emerald-50 text-emerald-800">
          <div>
            <label className={LABEL}>Phase / ขั้นตอน</label>
            <div className="space-y-3">
              {phases.map((p, pi) => (
                <div key={pi} className="rounded-lg border border-emerald-100 p-3 space-y-2">
                  <div className="flex gap-2">
                    <input value={p.name}
                      onChange={e => setPhases(prev => prev.map((x, j) => j === pi ? { ...x, name: e.target.value } : x))}
                      placeholder={`Phase ${pi + 1}`} className={`${INPUT} font-bold`} />
                    {phases.length > 1 && (
                      <button type="button" onClick={() => setPhases(prev => prev.filter((_, j) => j !== pi))}
                        className="text-red-400 text-sm px-1">✕</button>
                    )}
                  </div>
                  <input value={p.timeRange}
                    onChange={e => setPhases(prev => prev.map((x, j) => j === pi ? { ...x, timeRange: e.target.value } : x))}
                    placeholder="ช่วงเวลา" className={INPUT} />
                  <DynList items={p.tasks}
                    onChange={tasks => setPhases(prev => prev.map((x, j) => j === pi ? { ...x, tasks } : x))}
                    placeholder="งาน" addLabel="เพิ่มงาน" />
                </div>
              ))}
              <button type="button"
                onClick={() => setPhases(prev => [...prev, { name: `Phase ${prev.length + 1}`, timeRange: '', tasks: [''], budget: '' }])}
                className="text-xs font-black text-emerald-600">+ เพิ่ม Phase</button>
            </div>
          </div>
          <div>
            <label className={LABEL}>งานสำคัญ (Big Rocks)</label>
            <div className="space-y-2">
              {bigRocks.map((r, i) => (
                <div key={i} className="flex gap-2">
                  <input value={r.task}
                    onChange={e => setBigRocks(prev => prev.map((x, j) => j === i ? { ...x, task: e.target.value } : x))}
                    placeholder="งานสำคัญ" className={INPUT} />
                  <input value={r.deadline}
                    onChange={e => setBigRocks(prev => prev.map((x, j) => j === i ? { ...x, deadline: e.target.value } : x))}
                    placeholder="Deadline" className={`${INPUT} w-32`} />
                  {bigRocks.length > 1 && (
                    <button type="button" onClick={() => setBigRocks(prev => prev.filter((_, j) => j !== i))}
                      className="text-red-400 text-sm px-1">✕</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => setBigRocks(prev => [...prev, { task: '', deadline: '' }])}
                className="text-xs font-black text-emerald-600">+ เพิ่ม Big Rock</button>
            </div>
          </div>
        </Card>
      )}

      <Card title="แกนที่ 3 — แผนรายสัปดาห์ (legacy blank)" color="bg-sky-50 text-sky-800">
        <p className="text-xs text-neutral-500">ตั้งค่าฟอร์มเปล่า (สำหรับ template เก่า) — ถ้ากรอก Content ด้านล่างจะใช้ Content แทน</p>
        <div className="flex items-center gap-3">
          <label className={LABEL}>จำนวนหน้า</label>
          <input type="number" min={0} max={52} value={weekCount}
            onChange={e => setWeekCount(Math.max(0, Math.min(52, Number(e.target.value))))}
            className={`${INPUT} w-24`} />
        </div>
        <div>
          <label className={LABEL}>รูปแบบ</label>
          <select value={weekLayout} onChange={e => setWeekLayout(e.target.value as PipelineWeeklyLayout)} className={SELECT}>
            <option value="simple">แบบง่าย</option>
            <option value="135rule">กฎ 1-3-5</option>
            <option value="timeblock">Time Block</option>
          </select>
        </div>
        <div>
          <label className={LABEL}>วันเริ่มต้นสัปดาห์</label>
          <select value={startDay} onChange={e => setStartDay(e.target.value as typeof startDay)} className={SELECT}>
            <option value="mon">จันทร์</option>
            <option value="tue">อังคาร</option>
            <option value="wed">พุธ</option>
            <option value="thu">พฤหัส</option>
            <option value="fri">ศุกร์</option>
            <option value="sat">เสาร์</option>
            <option value="sun">อาทิตย์</option>
          </select>
        </div>
      </Card>

      {/* s3_content — content-first */}
      <Card title="แกนที่ 3 — Content แผนรายเดือน (yearly)" color="bg-sky-50 text-sky-800">
        <p className="text-xs text-neutral-500">กรอกเพื่อใช้แทน blank form — เพิ่ม/ลบได้</p>
        {monthlyPlans.map((mp, i) => (
          <div key={i} className="rounded-lg border border-sky-100 p-3 space-y-2">
            <div className="flex gap-2">
              <input value={mp.monthLabel}
                onChange={e => setMonthlyPlans(prev => prev.map((x, j) => j === i ? { ...x, monthLabel: e.target.value } : x))}
                placeholder="เช่น ม.ค." className={`${INPUT} w-20 font-bold`} />
              <input value={mp.goal}
                onChange={e => setMonthlyPlans(prev => prev.map((x, j) => j === i ? { ...x, goal: e.target.value } : x))}
                placeholder="เป้าหมายเดือนนี้" className={INPUT} />
              {monthlyPlans.length > 1 && (
                <button type="button" onClick={() => setMonthlyPlans(prev => prev.filter((_, j) => j !== i))}
                  className="text-red-400 text-sm px-1">✕</button>
              )}
            </div>
            <input value={mp.keyDates}
              onChange={e => setMonthlyPlans(prev => prev.map((x, j) => j === i ? { ...x, keyDates: e.target.value } : x))}
              placeholder="วันสำคัญ / นัดหมาย" className={INPUT} />
            {mp.mainTasks.map((t, ti) => (
              <input key={ti} value={t}
                onChange={e => setMonthlyPlans(prev => prev.map((x, j) => j === i
                  ? { ...x, mainTasks: x.mainTasks.map((m, k) => k === ti ? e.target.value : m) } : x))}
                placeholder={`งานหลัก ${ti + 1}`} className={INPUT} />
            ))}
          </div>
        ))}
        <button type="button"
          onClick={() => setMonthlyPlans(prev => [...prev, { monthLabel: '', goal: '', mainTasks: ['', '', ''], keyDates: '' }])}
          className="text-xs font-black text-sky-600">+ เพิ่มเดือน</button>
      </Card>

      <Card title="แกนที่ 3 — Content แผนรายสัปดาห์ (monthly / 1-3-6)" color="bg-sky-50 text-sky-800">
        {weeklyPlans.map((wp, i) => (
          <div key={i} className="rounded-lg border border-sky-100 p-3 space-y-2">
            <div className="flex gap-2">
              <input value={wp.weekLabel}
                onChange={e => setWeeklyPlans(prev => prev.map((x, j) => j === i ? { ...x, weekLabel: e.target.value } : x))}
                placeholder={`สัปดาห์ที่ ${i + 1}`} className={`${INPUT} font-bold`} />
              {weeklyPlans.length > 1 && (
                <button type="button" onClick={() => setWeeklyPlans(prev => prev.filter((_, j) => j !== i))}
                  className="text-red-400 text-sm px-1">✕</button>
              )}
            </div>
            <input value={wp.goal}
              onChange={e => setWeeklyPlans(prev => prev.map((x, j) => j === i ? { ...x, goal: e.target.value } : x))}
              placeholder="เป้าหมายสัปดาห์นี้" className={INPUT} />
            <input value={wp.main1}
              onChange={e => setWeeklyPlans(prev => prev.map((x, j) => j === i ? { ...x, main1: e.target.value } : x))}
              placeholder="งานหลัก 1 (ต้องทำ)" className={`${INPUT} font-bold`} />
            <div className="grid grid-cols-3 gap-1.5">
              {wp.secondary.map((s, si) => (
                <input key={si} value={s}
                  onChange={e => setWeeklyPlans(prev => prev.map((x, j) => j === i
                    ? { ...x, secondary: x.secondary.map((v, k) => k === si ? e.target.value : v) } : x))}
                  placeholder={`รอง ${si + 1}`} className={INPUT} />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {wp.small.map((s, si) => (
                <input key={si} value={s}
                  onChange={e => setWeeklyPlans(prev => prev.map((x, j) => j === i
                    ? { ...x, small: x.small.map((v, k) => k === si ? e.target.value : v) } : x))}
                  placeholder={`เล็ก ${si + 1}`} className={INPUT} />
              ))}
            </div>
          </div>
        ))}
        <button type="button"
          onClick={() => setWeeklyPlans(prev => [...prev, { weekLabel: '', goal: '', main1: '', secondary: ['', '', ''], small: ['', '', '', '', '', ''] }])}
          className="text-xs font-black text-sky-600">+ เพิ่มสัปดาห์</button>
      </Card>

      <Card title="แกนที่ 4 — แผนรายวัน (legacy blank)" color="bg-amber-50 text-amber-800">
        <p className="text-xs text-neutral-500">ตั้งค่าฟอร์มเปล่า (สำหรับ template เก่า)</p>
        <div className="flex items-center gap-3">
          <label className={LABEL}>จำนวนหน้า</label>
          <input type="number" min={0} max={365} value={dayCount}
            onChange={e => setDayCount(Math.max(0, Math.min(365, Number(e.target.value))))}
            className={`${INPUT} w-24`} />
        </div>
        <div>
          <label className={LABEL}>รูปแบบ</label>
          <select value={dayLayout} onChange={e => setDayLayout(e.target.value as PipelineDailyLayout)} className={SELECT}>
            <option value="todo">To-Do 1-3-5</option>
            <option value="timeblock">Time Block</option>
            <option value="combined">รวม (แนะนำ)</option>
          </select>
        </div>
      </Card>

      {/* s4_content — weekly tasks (yearly) */}
      <Card title="แกนที่ 4 — Content แผนสัปดาห์ (yearly / 1-3-6)" color="bg-amber-50 text-amber-800">
        {weeklyTasks.map((wt, i) => (
          <div key={i} className="rounded-lg border border-amber-100 p-3 space-y-2">
            <div className="flex gap-2">
              <input value={wt.weekLabel}
                onChange={e => setWeeklyTasks(prev => prev.map((x, j) => j === i ? { ...x, weekLabel: e.target.value } : x))}
                placeholder={`สัปดาห์ที่ ${i + 1}`} className={`${INPUT} font-bold`} />
              {weeklyTasks.length > 1 && (
                <button type="button" onClick={() => setWeeklyTasks(prev => prev.filter((_, j) => j !== i))}
                  className="text-red-400 text-sm px-1">✕</button>
              )}
            </div>
            <input value={wt.main1}
              onChange={e => setWeeklyTasks(prev => prev.map((x, j) => j === i ? { ...x, main1: e.target.value } : x))}
              placeholder="งานหลัก 1 (ต้องทำ)" className={`${INPUT} font-bold`} />
            <div className="grid grid-cols-3 gap-1.5">
              {wt.secondary.map((s, si) => (
                <input key={si} value={s}
                  onChange={e => setWeeklyTasks(prev => prev.map((x, j) => j === i
                    ? { ...x, secondary: x.secondary.map((v, k) => k === si ? e.target.value : v) } : x))}
                  placeholder={`รอง ${si + 1}`} className={INPUT} />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {wt.small.map((s, si) => (
                <input key={si} value={s}
                  onChange={e => setWeeklyTasks(prev => prev.map((x, j) => j === i
                    ? { ...x, small: x.small.map((v, k) => k === si ? e.target.value : v) } : x))}
                  placeholder={`เล็ก ${si + 1}`} className={INPUT} />
              ))}
            </div>
          </div>
        ))}
        <button type="button"
          onClick={() => setWeeklyTasks(prev => [...prev, { weekLabel: '', goal: '', main1: '', secondary: ['', '', ''], small: ['', '', '', '', '', ''] }])}
          className="text-xs font-black text-amber-600">+ เพิ่มแผนสัปดาห์</button>
      </Card>

      {/* s4_content — daily routines (monthly/project) */}
      <Card title="แกนที่ 4 — Content ตารางประจำวัน (monthly/project)" color="bg-amber-50 text-amber-800">
        {dailyRoutines.map((dr, i) => (
          <div key={i} className="flex gap-2">
            <input value={dr.time}
              onChange={e => setDailyRoutines(prev => prev.map((x, j) => j === i ? { ...x, time: e.target.value } : x))}
              placeholder="06:00" className={`${INPUT} w-24`} />
            <input value={dr.activity}
              onChange={e => setDailyRoutines(prev => prev.map((x, j) => j === i ? { ...x, activity: e.target.value } : x))}
              placeholder="กิจกรรม" className={INPUT} />
            {dailyRoutines.length > 1 && (
              <button type="button" onClick={() => setDailyRoutines(prev => prev.filter((_, j) => j !== i))}
                className="text-red-400 text-sm px-1">✕</button>
            )}
          </div>
        ))}
        <button type="button" onClick={() => setDailyRoutines(prev => [...prev, { time: '', activity: '' }])}
          className="text-xs font-black text-amber-600">+ เพิ่ม routine</button>
      </Card>

      <Card title="แกนที่ 5 — รีวิว" color="bg-rose-50 text-rose-800">
        <div>
          <label className={LABEL}>รอบทบทวน</label>
          <select value={reviewCycle} onChange={e => setReviewCycle(e.target.value as typeof reviewCycle)} className={SELECT}>
            <option value="daily">ทุกวัน</option>
            <option value="weekly">ทุกสัปดาห์</option>
            <option value="monthly">ทุกเดือน</option>
          </select>
        </div>
        <div>
          <label className={LABEL}>คำถามทบทวน</label>
          <DynList items={reviewQs} onChange={setReviewQs}
            placeholder="เช่น สิ่งที่ทำได้ดีที่สุดคืออะไร?" addLabel="เพิ่มคำถาม" />
        </div>
      </Card>
    </div>
  )
}

function getDefaultSegV2(h: PlanningHorizon): PlannerSegment[] {
  switch (h) {
    case 'year':  return ['Q1 (ม.ค.–มี.ค.)','Q2 (เม.ย.–มิ.ย.)','Q3 (ก.ค.–ก.ย.)','Q4 (ต.ค.–ธ.ค.)'].map(l=>({label:l,theme:'',keyActions:''}))
    case 'month': return ['สัปดาห์ที่ 1','สัปดาห์ที่ 2','สัปดาห์ที่ 3','สัปดาห์ที่ 4'].map(l=>({label:l,theme:'',keyActions:''}))
    case 'week':  return ['จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์','อาทิตย์'].map(l=>({label:l,theme:'',keyActions:''}))
    case 'day':   return ['เช้า (06:00–09:00)','สาย (09:00–12:00)','บ่าย (12:00–15:00)','เย็น (15:00–18:00)','ค่ำ (18:00–21:00)'].map(l=>({label:l,theme:'',keyActions:''}))
  }
}
function getHabitDaysV2(h: PlanningHorizon): number { return h === 'year' || h === 'month' ? 31 : h === 'week' ? 7 : 0 }
function getReviewCycleV2(h: PlanningHorizon): PlannerAxis3['reviewCycle'] { return h === 'year' ? 'monthly' : h === 'month' ? 'weekly' : 'daily' }

// ── Main ReviseClient ────────────────────────────────────────────────────────
interface Props {
  templateId: string
  slug: string
  engineType: 'checklist' | 'planner' | 'pipeline'
  initialData: ChecklistEngineData | PlannerEngineData | PlannerEngineDataV2 | PlannerPipelineData | PlannerPipelineDataV4
  nextRevisionNumber: number
  categoryName?: string
}

type GenState = 'idle' | 'generating' | 'done' | 'error'
type ApproveState = 'idle' | 'loading' | 'done' | 'error'

export function ReviseClient({ templateId, slug, engineType, initialData, nextRevisionNumber, categoryName }: Props) {
  const router = useRouter()
  const [engineData, setEngineData] = useState<ChecklistEngineData | PlannerEngineData | PlannerEngineDataV2 | PlannerPipelineData | PlannerPipelineDataV4>(initialData)
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
        ) : engineType === 'pipeline' && (initialData as PlannerPipelineDataV4).meta?.schemaVersion === '4.0' ? (
          <PipelineReviseFormV4
            initial={initialData as PlannerPipelineDataV4}
            onChange={setEngineData}
          />
        ) : engineType === 'pipeline' ? (
          <PipelineReviseForm
            initial={initialData as PlannerPipelineData}
            onChange={setEngineData}
          />
        ) : (initialData as PlannerEngineDataV2).meta?.schemaVersion === '2.0' ? (
          <PlannerReviseFormV2
            initial={initialData as PlannerEngineDataV2}
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
