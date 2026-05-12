'use client'
import { useState, useEffect } from 'react'
import type { PlannerPipelineDataV4, PipelineHorizon, PipelinePhase, PipelineBigRock, MonthlyPlanItem, WeeklyTaskItem, DailyRoutineItem } from '@/lib/engine-types'

const INPUT = 'w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:bg-white transition'
const LABEL = 'block text-[11px] font-black uppercase tracking-widest text-neutral-600 mb-1.5'

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

interface Props { onChange: (data: PlannerPipelineDataV4) => void }

const STAGE_LABELS = ['เป้าหมาย', 'ภาพรวม', 'รายสัปดาห์', 'รายวัน', 'รีวิว']
const STAGE_COLORS = [
  { active: 'bg-violet-600 text-white', can: 'bg-violet-100 text-violet-700 hover:bg-violet-200', off: 'bg-neutral-100 text-neutral-400' },
  { active: 'bg-emerald-600 text-white', can: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200', off: 'bg-neutral-100 text-neutral-400' },
  { active: 'bg-sky-600 text-white', can: 'bg-sky-100 text-sky-700 hover:bg-sky-200', off: 'bg-neutral-100 text-neutral-400' },
  { active: 'bg-amber-600 text-white', can: 'bg-amber-100 text-amber-700 hover:bg-amber-200', off: 'bg-neutral-100 text-neutral-400' },
  { active: 'bg-rose-600 text-white', can: 'bg-rose-100 text-rose-700 hover:bg-rose-200', off: 'bg-neutral-100 text-neutral-400' },
]

export function PipelinePlannerForm({ onChange }: Props) {
  const [stage, setStage] = useState(1)

  // META
  const [displayTitle, setDisplayTitle] = useState('')
  const [description,  setDescription]  = useState('')
  const [colorTheme,   setColorTheme]   = useState<PlannerPipelineDataV4['meta']['colorTheme']>('violet')
  const [coverPage,    setCoverPage]    = useState(true)

  // Stage 1
  const [goal,         setGoal]         = useState('')
  const [why,          setWhy]          = useState('')
  const [deadline,     setDeadline]     = useState('')
  const [horizon,      setHorizon]      = useState<PipelineHorizon>('yearly')
  const [horizonValue, setHorizonValue] = useState('')

  // Stage 2 — yearly month range
  const [fromMonth, setFromMonth] = useState(1)
  const [toMonth,   setToMonth]   = useState(12)
  // Stage 2 — monthly week count
  const [monthlyWeekCount, setMonthlyWeekCount] = useState(4)
  // Stage 2 — summary (แสดงใน modal preview ลูกค้า)
  const [s2Summary, setS2Summary] = useState('')
  // Stage 2 — project mode only
  const [phases,   setPhases]   = useState<PipelinePhase[]>([{ name: 'Phase 1', timeRange: '', tasks: [''], budget: '' }])
  const [bigRocks, setBigRocks] = useState<PipelineBigRock[]>([{ task: '', deadline: '' }])

  // Stage 3 — content-first (auto-synced from stage 2)
  const [monthlyPlans, setMonthlyPlans] = useState<MonthlyPlanItem[]>([])
  const [weeklyPlans,  setWeeklyPlans]  = useState<WeeklyTaskItem[]>([])
  const [flexItems,    setFlexItems]    = useState<{ label: string; tasks: string[] }[]>([{ label: '', tasks: [''] }])

  // Stage 4 — content-first
  const [weeklyTasks,   setWeeklyTasks]   = useState<WeeklyTaskItem[]>([{ weekLabel: '', goal: '', main1: '', secondary: ['', '', ''], small: ['', '', '', '', '', ''] }])
  const [dailyRoutines, setDailyRoutines] = useState<DailyRoutineItem[]>([{ time: '', activity: '' }])

  // Stage 5
  const [reviewCycle, setReviewCycle] = useState<'daily' | 'weekly' | 'monthly'>('weekly')
  const [reviewQs,    setReviewQs]    = useState(['ทำสำเร็จอะไรบ้างในรอบนี้?', 'สิ่งที่ยังติดขัดคืออะไร?', 'จะปรับแผนอย่างไรในรอบหน้า?'])

  const MONTH_ABBR = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']

  // Sync monthlyPlans to month range (yearly) — keyed by label to preserve typed content
  useEffect(() => {
    if (horizon !== 'yearly') return
    const count = Math.max(1, toMonth - fromMonth + 1)
    setMonthlyPlans(prev => {
      const byLabel = new Map(prev.map(mp => [mp.monthLabel, mp]))
      return Array.from({ length: count }, (_, i) => {
        const label = MONTH_ABBR[fromMonth - 1 + i] ?? `เดือน ${i + 1}`
        return byLabel.get(label) ?? { monthLabel: label, goal: '', mainTasks: ['', '', ''], keyDates: '' }
      })
    })
  }, [horizon, fromMonth, toMonth]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync weeklyPlans length to monthlyWeekCount (monthly)
  useEffect(() => {
    if (horizon !== 'monthly') return
    setWeeklyPlans(prev => Array.from({ length: monthlyWeekCount }, (_, i) =>
      prev[i] ?? { weekLabel: `สัปดาห์ที่ ${i + 1}`, goal: '', main1: '', secondary: ['', '', ''], small: ['', '', '', '', '', ''] }
    ))
  }, [horizon, monthlyWeekCount]) // eslint-disable-line react-hooks/exhaustive-deps

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

    const s3_content: PlannerPipelineDataV4['s3_content'] = horizon === 'yearly'
      ? { monthlyPlans }
      : horizon === 'monthly'
        ? { weeklyPlans }
        : { flexItems: flexItems.filter(f => f.label.trim() || f.tasks.some(t => t.trim())) }

    const s4_content: PlannerPipelineDataV4['s4_content'] = horizon === 'yearly'
      ? { weeklyTasks }
      : { dailyRoutines: dailyRoutines.filter(r => r.time.trim() || r.activity.trim()) }

    onChange({
      meta: { schemaVersion: '4.0', mode: 'pipeline', title: displayTitle, description, colorTheme, coverPage },
      s1_goal: { goal, why, deadline, horizon, horizonValue },
      s2_timeplan: s2,
      s3_content,
      s4_content,
      s5_review: { reviewCycle, reviewQuestions: reviewQs.filter(q => q.trim()) },
    })
  }, [
    displayTitle, description, colorTheme, coverPage,
    goal, why, deadline, horizon, horizonValue,
    fromMonth, toMonth, monthlyWeekCount, s2Summary,
    phases, bigRocks,
    monthlyPlans, weeklyPlans, flexItems,
    weeklyTasks, dailyRoutines,
    reviewCycle, reviewQs,
    onChange,
  ])

  const stage1Valid = !!goal.trim() && !!deadline.trim()
  const stage2Valid = horizon === 'project'
    ? phases.some(p => p.name.trim())
    : true

  function canGoTo(n: number) {
    if (n <= stage) return true
    if (n === 2) return stage1Valid
    if (n === 3) return stage1Valid && stage2Valid
    if (n === 4) return stage1Valid && stage2Valid
    if (n === 5) return stage1Valid && stage2Valid
    return false
  }

  const THEME_OPTS: { v: PlannerPipelineDataV4['meta']['colorTheme']; l: string; color: string }[] = [
    { v: 'violet',  l: 'ม่วง',   color: 'bg-violet-500'  },
    { v: 'rose',    l: 'ชมพู',   color: 'bg-rose-500'    },
    { v: 'emerald', l: 'เขียว',  color: 'bg-emerald-500' },
    { v: 'amber',   l: 'เหลือง', color: 'bg-amber-500'   },
    { v: 'sky',     l: 'ฟ้า',    color: 'bg-sky-500'     },
  ]

  return (
    <div className="space-y-4">

      {/* Stage indicator */}
      <div className="flex gap-1">
        {STAGE_LABELS.map((label, idx) => {
          const n = idx + 1
          const ok = canGoTo(n)
          const col = STAGE_COLORS[idx]
          return (
            <button key={n} type="button"
              onClick={() => { if (ok) setStage(n) }}
              className={`flex-1 rounded-lg py-2 text-[11px] font-black transition ${
                stage === n ? col.active : ok ? col.can : col.off
              } ${!ok ? 'cursor-not-allowed' : ''}`}>
              {n}. {label}
            </button>
          )
        })}
      </div>

      {/* Summary bars */}
      {stage > 1 && stage1Valid && (
        <div className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs">
          <p className="font-black text-violet-800 truncate">{goal}</p>
          <p className="text-violet-600">ถึง: {deadline}{horizon !== 'project' && horizonValue ? ` · ${horizonValue}` : ''}</p>
        </div>
      )}

      {/* META — always visible */}
      <div className="rounded-xl border-2 border-neutral-200 overflow-hidden">
        <div className="px-4 py-2.5 bg-neutral-100 text-neutral-700 text-[11px] font-black uppercase tracking-widest">ตั้งค่า PDF</div>
        <div className="px-4 py-4 space-y-3">
          <div>
            <label className={LABEL}>ชื่อที่แสดงใน PDF *</label>
            <input value={displayTitle} onChange={e => setDisplayTitle(e.target.value)}
              placeholder="เช่น Pipeline Planner 2026" className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>คำอธิบาย (ใช้ในร้านค้า)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              placeholder="เช่น แพลนเนอร์ครบ 5 แกน — ตั้งเป้า ภาพรวม สัปดาห์ วัน รีวิว"
              className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>สีธีม PDF</label>
            <div className="flex gap-2 flex-wrap">
              {THEME_OPTS.map(({ v, l, color }) => (
                <button key={v} type="button" onClick={() => setColorTheme(v)}
                  className={`flex items-center gap-1.5 rounded-lg border-2 px-2.5 py-1.5 text-xs font-bold transition
                    ${colorTheme === v ? 'border-neutral-900 shadow-sm' : 'border-neutral-200 hover:border-neutral-400'}`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${color}`}></span>{l}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-neutral-700">
            <input type="checkbox" checked={coverPage} onChange={e => setCoverPage(e.target.checked)} className="rounded" />
            หน้าปก
          </label>
        </div>
      </div>

      {/* ── STAGE 1: เป้าหมาย ── */}
      {stage === 1 && (
        <div className="rounded-xl border-2 border-violet-300 overflow-hidden">
          <div className="px-4 py-3 bg-violet-50 text-violet-800 flex items-center gap-2">
            <span className="text-xs font-black bg-violet-200 rounded-full px-2 py-0.5">1</span>
            <span className="font-black text-sm">เป้าหมาย</span>
          </div>
          <div className="px-4 py-4 space-y-4">
            <div>
              <label className={LABEL}>เป้าหมายหลัก *</label>
              <textarea value={goal} onChange={e => setGoal(e.target.value)} rows={2}
                placeholder="เช่น เปิดตัวสินค้าใหม่และมียอดขาย ฿100,000 ภายใน 3 เดือน"
                className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>ทำไมถึงสำคัญ?</label>
              <input value={why} onChange={e => setWhy(e.target.value)}
                placeholder="เช่น เป็น stepping stone สู่เป้าหมายการเงินระยะยาว" className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>ต้องเสร็จภายใน (Deadline) *</label>
              <input value={deadline} onChange={e => setDeadline(e.target.value)}
                placeholder="เช่น 31 สิงหาคม 2026" className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>รูปแบบแผน (Planning Horizon)</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { v: 'yearly',  l: 'รายปี',    desc: 'เลือกช่วงเดือนเอง' },
                  { v: 'monthly', l: 'รายเดือน',  desc: 'เลือกจำนวนสัปดาห์' },
                  { v: 'project', l: 'โปรเจกต์',  desc: 'กำหนด phases เอง' },
                ] as { v: PipelineHorizon; l: string; desc: string }[]).map(({ v, l, desc }) => (
                  <button key={v} type="button" onClick={() => setHorizon(v)}
                    className={`rounded-xl border-2 px-3 py-3 text-left transition ${
                      horizon === v ? 'border-violet-600 bg-violet-50' : 'border-neutral-200 hover:border-violet-300'
                    }`}>
                    <p className={`text-sm font-black ${horizon === v ? 'text-violet-800' : 'text-neutral-700'}`}>{l}</p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">{desc}</p>
                  </button>
                ))}
              </div>
            </div>
            {horizon === 'yearly' && (
              <div>
                <label className={LABEL}>ปี</label>
                <input value={horizonValue} onChange={e => setHorizonValue(e.target.value)}
                  placeholder="เช่น 2026" className={INPUT} />
              </div>
            )}
            {horizon === 'monthly' && (
              <div>
                <label className={LABEL}>เดือน + ปี</label>
                <input value={horizonValue} onChange={e => setHorizonValue(e.target.value)}
                  placeholder="เช่น พฤษภาคม 2026" className={INPUT} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── STAGE 2: ภาพรวม ── */}
      {stage === 2 && (
        <div className="rounded-xl border-2 border-emerald-300 overflow-hidden">
          <div className="px-4 py-3 bg-emerald-50 text-emerald-800 flex items-center gap-2">
            <span className="text-xs font-black bg-emerald-200 rounded-full px-2 py-0.5">2</span>
            <span className="font-black text-sm">ภาพรวม</span>
          </div>

          {/* Summary — แสดงใน PDF หน้า 1 และ modal preview */}
          <div className="px-4 pt-4 pb-2">
            <label className={LABEL}>สรุปเทมเพลตนี้ให้ลูกค้า *</label>
            <textarea value={s2Summary} onChange={e => setS2Summary(e.target.value)} rows={3}
              placeholder="เช่น แพลนเนอร์ครบ 3 เดือน (ต.ค.–ธ.ค. 2026) สำหรับเจ้าของร้านที่ต้องการวางแผนเปิดสาขาใหม่ ประกอบด้วย: แผนรายเดือน 3 หน้า + แผนสัปดาห์ 1-3-6 + ตารางทบทวน"
              className={INPUT} />
            <p className="mt-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 leading-relaxed">
              ⚡ ข้อความนี้จะแสดงใน PDF หน้า 1 และหน้าตัวอย่างสินค้าที่ลูกค้าเห็นก่อนตัดสินใจซื้อ — กรอกให้ครบและน่าสนใจที่สุด
            </p>
          </div>

          {horizon === 'yearly' && (() => {
            const MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม']
            const count = Math.max(0, toMonth - fromMonth + 1)
            return (
              <div className="px-4 py-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL}>ตั้งแต่เดือน</label>
                    <select value={fromMonth} onChange={e => { const v = Number(e.target.value); setFromMonth(v); if (v > toMonth) setToMonth(v) }}
                      className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm">
                      {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={LABEL}>ถึงเดือน</label>
                    <select value={toMonth} onChange={e => { const v = Number(e.target.value); setToMonth(v); if (v < fromMonth) setFromMonth(v) }}
                      className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm">
                      {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                    </select>
                  </div>
                </div>
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm text-emerald-800">
                  จะสร้าง <strong>{count} หน้า</strong> ({MONTHS[fromMonth - 1]} – {MONTHS[toMonth - 1]}{horizonValue ? ` ${horizonValue}` : ''}) · แต่ละหน้ามีช่อง: เป้าเดือน / วันสำคัญ / งานหลัก 3 อย่าง
                </div>
              </div>
            )
          })()}

          {horizon === 'monthly' && (
            <div className="px-4 py-4 space-y-3">
              <div>
                <label className={LABEL}>จำนวนสัปดาห์</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} type="button" onClick={() => setMonthlyWeekCount(n)}
                      className={`w-10 h-10 rounded-lg border-2 text-sm font-black transition ${
                        monthlyWeekCount === n ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-neutral-200 text-neutral-600 hover:border-emerald-400'
                      }`}>{n}</button>
                  ))}
                </div>
              </div>
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm text-emerald-800">
                จะสร้าง <strong>{monthlyWeekCount} หน้า</strong>{horizonValue ? ` สำหรับ ${horizonValue}` : ''} · แต่ละหน้ามีช่อง: เป้าสัปดาห์ / งานที่ต้องทำ
              </div>
            </div>
          )}

          {horizon === 'project' && (
            <div className="px-4 py-4 space-y-5">
              <div>
                <label className={LABEL}>Phase / ขั้นตอน</label>
                <div className="space-y-3">
                  {phases.map((p, pi) => (
                    <div key={pi} className="rounded-lg border border-emerald-100 p-3 space-y-2">
                      <div className="flex gap-2">
                        <input value={p.name}
                          onChange={e => setPhases(prev => prev.map((x, j) => j === pi ? { ...x, name: e.target.value } : x))}
                          placeholder={`Phase ${pi + 1} — ชื่อ`} className={`${INPUT} font-bold`} />
                        {phases.length > 1 && (
                          <button type="button" onClick={() => setPhases(prev => prev.filter((_, j) => j !== pi))}
                            className="text-red-400 text-sm px-1">✕</button>
                        )}
                      </div>
                      <input value={p.timeRange}
                        onChange={e => setPhases(prev => prev.map((x, j) => j === pi ? { ...x, timeRange: e.target.value } : x))}
                        placeholder="ช่วงเวลา เช่น ม.ค. – ก.พ. 2026" className={INPUT} />
                      <DynList items={p.tasks}
                        onChange={tasks => setPhases(prev => prev.map((x, j) => j === pi ? { ...x, tasks } : x))}
                        placeholder="งานที่ต้องทำใน Phase นี้" addLabel="เพิ่มงาน" />
                    </div>
                  ))}
                  <button type="button"
                    onClick={() => setPhases(prev => [...prev, { name: `Phase ${prev.length + 1}`, timeRange: '', tasks: [''], budget: '' }])}
                    className="text-xs font-black text-emerald-600 hover:text-emerald-700">
                    + เพิ่ม Phase
                  </button>
                </div>
              </div>
              <div>
                <label className={LABEL}>งานสำคัญ (Big Rocks)</label>
                <p className="text-xs text-neutral-500 mb-2">งานใหญ่ที่ถ้าไม่ทำ เป้าหมายจะไม่สำเร็จ</p>
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
                    className="text-xs font-black text-emerald-600 hover:text-emerald-700">
                    + เพิ่ม Big Rock
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── STAGE 3: แผนรายเดือน / รายสัปดาห์ / งาน ── */}
      {stage === 3 && (
        <div className="rounded-xl border-2 border-sky-300 overflow-hidden">
          <div className="px-4 py-3 bg-sky-50 text-sky-800 flex items-center gap-2">
            <span className="text-xs font-black bg-sky-200 rounded-full px-2 py-0.5">3</span>
            <span className="font-black text-sm">
              {horizon === 'yearly' ? 'แผนรายเดือน' : horizon === 'monthly' ? 'แผนรายสัปดาห์ (1-3-6)' : 'แผนงาน'}
            </span>
          </div>

          {/* Yearly: monthly plan forms (auto-generated from range) */}
          {horizon === 'yearly' && (
            <div className="px-4 py-4 space-y-4">
              <p className="text-xs text-neutral-500">กรอกแผนสำหรับแต่ละเดือนตามช่วงที่เลือกใน Stage 2</p>
              {monthlyPlans.map((mp, i) => (
                <div key={i} className="rounded-lg border border-sky-100 p-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black bg-sky-600 text-white rounded-full px-2.5 py-0.5">{mp.monthLabel}</span>
                  </div>
                  <div>
                    <label className={LABEL}>เป้าหมายเดือนนี้</label>
                    <input value={mp.goal}
                      onChange={e => setMonthlyPlans(prev => prev.map((x, j) => j === i ? { ...x, goal: e.target.value } : x))}
                      placeholder="เช่น เตรียมเปิดตัวสินค้าและทำ 3 content" className={INPUT} />
                  </div>
                  <div>
                    <label className={LABEL}>วันสำคัญ / นัดหมาย</label>
                    <input value={mp.keyDates}
                      onChange={e => setMonthlyPlans(prev => prev.map((x, j) => j === i ? { ...x, keyDates: e.target.value } : x))}
                      placeholder="เช่น 15 มิ.ย. — นัดลูกค้า, 28 มิ.ย. — ส่งงาน" className={INPUT} />
                  </div>
                  <div>
                    <label className={LABEL}>งานหลัก 3 อย่าง</label>
                    {mp.mainTasks.map((t, ti) => (
                      <input key={ti} value={t}
                        onChange={e => setMonthlyPlans(prev => prev.map((x, j) => j === i
                          ? { ...x, mainTasks: x.mainTasks.map((m, k) => k === ti ? e.target.value : m) } : x))}
                        placeholder={`งานที่ ${ti + 1}`} className={`${INPUT} mt-1`} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Monthly: weekly plan forms (1-3-6) */}
          {horizon === 'monthly' && (
            <div className="px-4 py-4 space-y-4">
              <p className="text-xs text-neutral-500">กรอกแผน 1-3-6 สำหรับแต่ละสัปดาห์</p>
              {weeklyPlans.map((wp, i) => (
                <div key={i} className="rounded-lg border border-sky-100 p-3 space-y-3">
                  <div>
                    <label className={LABEL}>ชื่อสัปดาห์</label>
                    <input value={wp.weekLabel}
                      onChange={e => setWeeklyPlans(prev => prev.map((x, j) => j === i ? { ...x, weekLabel: e.target.value } : x))}
                      className={INPUT} />
                  </div>
                  <div>
                    <label className={LABEL}>เป้าหมายสัปดาห์นี้</label>
                    <input value={wp.goal}
                      onChange={e => setWeeklyPlans(prev => prev.map((x, j) => j === i ? { ...x, goal: e.target.value } : x))}
                      placeholder="เช่น ทำ Prototype ให้เสร็จ" className={INPUT} />
                  </div>
                  <div>
                    <label className={LABEL}>งานหลัก 1 อย่าง (ต้องทำ)</label>
                    <input value={wp.main1}
                      onChange={e => setWeeklyPlans(prev => prev.map((x, j) => j === i ? { ...x, main1: e.target.value } : x))}
                      placeholder="งานที่สำคัญที่สุด ถ้าทำได้แค่อย่างเดียวในสัปดาห์นี้" className={`${INPUT} font-bold`} />
                  </div>
                  <div>
                    <label className={LABEL}>งานรอง 3 อย่าง (พยายามทำ)</label>
                    {wp.secondary.map((s, si) => (
                      <input key={si} value={s}
                        onChange={e => setWeeklyPlans(prev => prev.map((x, j) => j === i
                          ? { ...x, secondary: x.secondary.map((v, k) => k === si ? e.target.value : v) } : x))}
                        placeholder={`งานรอง ${si + 1}`} className={`${INPUT} mt-1`} />
                    ))}
                  </div>
                  <div>
                    <label className={LABEL}>งานเล็ก 6 อย่าง (อย่างน้อยถ้ามีเวลา)</label>
                    <div className="space-y-1.5 mt-1">
                      {wp.small.map((s, si) => (
                        <div key={si} className="flex gap-2">
                          <input value={s}
                            onChange={e => setWeeklyPlans(prev => prev.map((x, j) => j === i
                              ? { ...x, small: x.small.map((v, k) => k === si ? e.target.value : v) } : x))}
                            placeholder={`งานเล็ก ${si + 1}`} className={INPUT} />
                          {wp.small.length > 1 && (
                            <button type="button" onClick={() => setWeeklyPlans(prev => prev.map((x, j) => j === i
                              ? { ...x, small: x.small.filter((_, k) => k !== si) } : x))}
                              className="px-2 text-red-400 hover:text-red-600 text-sm">✕</button>
                          )}
                        </div>
                      ))}
                      <button type="button" onClick={() => setWeeklyPlans(prev => prev.map((x, j) => j === i
                        ? { ...x, small: [...x.small, ''] } : x))}
                        className="text-xs font-black text-sky-600 hover:text-sky-700">+ เพิ่มงานเล็ก</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Project: flexible task items */}
          {horizon === 'project' && (
            <div className="px-4 py-4 space-y-4">
              <p className="text-xs text-neutral-500">กรอกแผนงานแต่ละช่วง — เพิ่มช่วงได้ไม่จำกัด</p>
              {flexItems.map((fi, i) => (
                <div key={i} className="rounded-lg border border-sky-100 p-3 space-y-2">
                  <div className="flex gap-2">
                    <input value={fi.label}
                      onChange={e => setFlexItems(prev => prev.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                      placeholder={`ช่วงที่ ${i + 1} — ชื่อช่วง`} className={`${INPUT} font-bold`} />
                    {flexItems.length > 1 && (
                      <button type="button" onClick={() => setFlexItems(prev => prev.filter((_, j) => j !== i))}
                        className="text-red-400 text-sm px-1">✕</button>
                    )}
                  </div>
                  <DynList items={fi.tasks}
                    onChange={tasks => setFlexItems(prev => prev.map((x, j) => j === i ? { ...x, tasks } : x))}
                    placeholder="งานที่ต้องทำ" addLabel="เพิ่มงาน" />
                </div>
              ))}
              <button type="button" onClick={() => setFlexItems(prev => [...prev, { label: '', tasks: [''] }])}
                className="text-xs font-black text-sky-600 hover:text-sky-700">+ เพิ่มช่วง</button>
            </div>
          )}
        </div>
      )}

      {/* ── STAGE 4: แผนสัปดาห์ (yearly) / ตารางประจำวัน (monthly/project) ── */}
      {stage === 4 && (
        <div className="rounded-xl border-2 border-amber-300 overflow-hidden">
          <div className="px-4 py-3 bg-amber-50 text-amber-800 flex items-center gap-2">
            <span className="text-xs font-black bg-amber-200 rounded-full px-2 py-0.5">4</span>
            <span className="font-black text-sm">
              {horizon === 'yearly' ? 'แผนรายสัปดาห์ (1-3-6)' : 'ตารางประจำวัน'}
            </span>
          </div>

          {/* Yearly: dynamic weekly task blocks (1-3-6) */}
          {horizon === 'yearly' && (
            <div className="px-4 py-4 space-y-4">
              <p className="text-xs text-neutral-500">ระบุชื่อสัปดาห์เองได้ — กรอกงาน 1-3-6 เพิ่มได้ไม่จำกัด</p>
              {weeklyTasks.map((wt, i) => (
                <div key={i} className="rounded-lg border border-amber-100 p-3 space-y-3">
                  <div className="flex gap-2">
                    <input value={wt.weekLabel}
                      onChange={e => setWeeklyTasks(prev => prev.map((x, j) => j === i ? { ...x, weekLabel: e.target.value } : x))}
                      placeholder={`สัปดาห์ที่ ${i + 1} (ระบุชื่อเอง)`} className={`${INPUT} font-bold`} />
                    {weeklyTasks.length > 1 && (
                      <button type="button" onClick={() => setWeeklyTasks(prev => prev.filter((_, j) => j !== i))}
                        className="text-red-400 text-sm px-1">✕</button>
                    )}
                  </div>
                  <div>
                    <label className={LABEL}>งานหลัก 1 อย่าง (ต้องทำ)</label>
                    <input value={wt.main1}
                      onChange={e => setWeeklyTasks(prev => prev.map((x, j) => j === i ? { ...x, main1: e.target.value } : x))}
                      placeholder="งานที่สำคัญที่สุดสัปดาห์นี้" className={INPUT} />
                  </div>
                  <div>
                    <label className={LABEL}>งานรอง 3 อย่าง (พยายามทำ)</label>
                    {wt.secondary.map((s, si) => (
                      <input key={si} value={s}
                        onChange={e => setWeeklyTasks(prev => prev.map((x, j) => j === i
                          ? { ...x, secondary: x.secondary.map((v, k) => k === si ? e.target.value : v) } : x))}
                        placeholder={`งานรอง ${si + 1}`} className={`${INPUT} mt-1`} />
                    ))}
                  </div>
                  <div>
                    <label className={LABEL}>งานเล็ก 6 อย่าง (อย่างน้อยถ้ามีเวลา)</label>
                    <div className="space-y-1.5 mt-1">
                      {wt.small.map((s, si) => (
                        <div key={si} className="flex gap-2">
                          <input value={s}
                            onChange={e => setWeeklyTasks(prev => prev.map((x, j) => j === i
                              ? { ...x, small: x.small.map((v, k) => k === si ? e.target.value : v) } : x))}
                            placeholder={`งานเล็ก ${si + 1}`} className={INPUT} />
                          {wt.small.length > 1 && (
                            <button type="button" onClick={() => setWeeklyTasks(prev => prev.map((x, j) => j === i
                              ? { ...x, small: x.small.filter((_, k) => k !== si) } : x))}
                              className="px-2 text-red-400 hover:text-red-600 text-sm">✕</button>
                          )}
                        </div>
                      ))}
                      <button type="button" onClick={() => setWeeklyTasks(prev => prev.map((x, j) => j === i
                        ? { ...x, small: [...x.small, ''] } : x))}
                        className="text-xs font-black text-amber-600 hover:text-amber-700">+ เพิ่มงานเล็ก</button>
                    </div>
                  </div>
                </div>
              ))}
              <button type="button"
                onClick={() => setWeeklyTasks(prev => [...prev, { weekLabel: '', goal: '', main1: '', secondary: ['', '', ''], small: ['', '', '', '', '', ''] }])}
                className="text-xs font-black text-amber-600 hover:text-amber-700">+ เพิ่มแผนสัปดาห์</button>
            </div>
          )}

          {/* Monthly / Project: daily routine rows */}
          {(horizon === 'monthly' || horizon === 'project') && (
            <div className="px-4 py-4 space-y-3">
              <p className="text-xs text-neutral-500">กรอกตารางประจำวันที่แนะนำ — เพิ่มช่วงเวลาได้ไม่จำกัด</p>
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
                className="text-xs font-black text-amber-600 hover:text-amber-700">+ เพิ่ม routine</button>
            </div>
          )}
        </div>
      )}

      {/* ── STAGE 5: รีวิว ── */}
      {stage === 5 && (
        <div className="rounded-xl border-2 border-rose-300 overflow-hidden">
          <div className="px-4 py-3 bg-rose-50 text-rose-800 flex items-center gap-2">
            <span className="text-xs font-black bg-rose-200 rounded-full px-2 py-0.5">5</span>
            <span className="font-black text-sm">รีวิว</span>
          </div>
          <div className="px-4 py-4 space-y-4">
            <div>
              <label className={LABEL}>รอบทบทวน</label>
              <div className="flex gap-3 flex-wrap">
                {(['daily', 'weekly', 'monthly'] as const).map(v => (
                  <label key={v}
                    className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 cursor-pointer text-sm font-bold transition
                      ${reviewCycle === v ? 'border-rose-500 bg-rose-50 text-rose-800' : 'border-neutral-200 text-neutral-500 hover:border-rose-300'}`}>
                    <input type="radio" checked={reviewCycle === v} onChange={() => setReviewCycle(v)} className="hidden" />
                    {reviewCycle === v ? '✓ ' : ''}{v === 'daily' ? 'ทุกวัน' : v === 'weekly' ? 'ทุกสัปดาห์' : 'ทุกเดือน'}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className={LABEL}>คำถามทบทวน</label>
              <p className="text-xs text-neutral-500 mb-2">คำถามเหล่านี้จะพิมพ์ลงใน PDF พร้อมช่องว่างให้ลูกค้ากรอก</p>
              <DynList items={reviewQs} onChange={setReviewQs}
                placeholder="เช่น สิ่งที่ทำได้ดีที่สุดในรอบนี้คืออะไร?" addLabel="เพิ่มคำถาม" />
            </div>
            <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700">
              ระบบจะเพิ่มช่อง "ทำไปแล้ว ___%" + "สิ่งที่ติดขัด" + "แผนครั้งถัดไป" ให้อัตโนมัติ
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-2">
        {stage > 1 && (
          <button type="button" onClick={() => setStage(s => s - 1)}
            className="flex-1 rounded-lg border border-neutral-200 py-2.5 text-sm font-black text-neutral-600 hover:border-neutral-400">
            ← ย้อนกลับ
          </button>
        )}
        {stage < 5 && (
          <button type="button"
            disabled={stage === 1 ? !stage1Valid : stage === 2 ? !stage2Valid : false}
            onClick={() => setStage(s => s + 1)}
            className="flex-1 rounded-lg bg-violet-600 py-2.5 text-sm font-black text-white transition hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed">
            ถัดไป →
          </button>
        )}
      </div>

    </div>
  )
}
