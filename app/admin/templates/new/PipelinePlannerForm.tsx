'use client'
import { useState, useEffect } from 'react'
import type { PlannerPipelineDataV4, PipelineHorizon, PipelineWeeklyLayout, PipelineDailyLayout, PipelinePhase, PipelineBigRock } from '@/lib/engine-types'

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

  // Stage 2 — project mode only
  const [phases,   setPhases]   = useState<PipelinePhase[]>([{ name: 'Phase 1', timeRange: '', tasks: [''], budget: '' }])
  const [bigRocks, setBigRocks] = useState<PipelineBigRock[]>([{ task: '', deadline: '' }])

  // Stage 3
  const [weekCount,   setWeekCount]   = useState(4)
  const [weekLayout,  setWeekLayout]  = useState<PipelineWeeklyLayout>('135rule')

  // Stage 4
  const [dayCount,    setDayCount]    = useState(7)
  const [dayLayout,   setDayLayout]   = useState<PipelineDailyLayout>('combined')

  // Stage 5
  const [reviewCycle, setReviewCycle] = useState<'daily' | 'weekly' | 'monthly'>('weekly')
  const [reviewQs,    setReviewQs]    = useState(['ทำสำเร็จอะไรบ้างในรอบนี้?', 'สิ่งที่ยังติดขัดคืออะไร?', 'จะปรับแผนอย่างไรในรอบหน้า?'])

  useEffect(() => {
    const s2: PlannerPipelineDataV4['s2_timeplan'] = horizon === 'yearly'
      ? { year: horizonValue }
      : horizon === 'monthly'
        ? { month: horizonValue }
        : {
            phases: phases.filter(p => p.name.trim()).map(p => ({ ...p, tasks: p.tasks.filter(t => t.trim()) })),
            bigRocks: bigRocks.filter(r => r.task.trim()),
          }

    onChange({
      meta: { schemaVersion: '4.0', mode: 'pipeline', title: displayTitle, description, colorTheme, coverPage },
      s1_goal: { goal, why, deadline, horizon, horizonValue },
      s2_timeplan: s2,
      s3_weekly: { weekCount, layout: weekLayout },
      s4_daily:  { dayCount,  layout: dayLayout  },
      s5_review: { reviewCycle, reviewQuestions: reviewQs.filter(q => q.trim()) },
    })
  }, [
    displayTitle, description, colorTheme, coverPage,
    goal, why, deadline, horizon, horizonValue,
    phases, bigRocks,
    weekCount, weekLayout,
    dayCount, dayLayout,
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
                  { v: 'yearly',  l: 'รายปี',    desc: 'ภาพรวม 12 เดือน' },
                  { v: 'monthly', l: 'รายเดือน',  desc: 'ภาพรวม 4 สัปดาห์' },
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

          {horizon === 'yearly' && (
            <div className="px-4 py-4">
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
                ระบบจะสร้าง <strong>12 หน้า</strong> (ม.ค.–ธ.ค.) ให้อัตโนมัติ
                {horizonValue ? ` สำหรับปี ${horizonValue}` : ''} แต่ละหน้ามีช่องกรอก: เป้าเดือน / วันสำคัญ / งานหลัก 3 อย่าง
              </div>
            </div>
          )}

          {horizon === 'monthly' && (
            <div className="px-4 py-4">
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
                ระบบจะสร้าง <strong>4 หน้า</strong> (สัปดาห์ที่ 1–4) ให้อัตโนมัติ
                {horizonValue ? ` สำหรับ ${horizonValue}` : ''} แต่ละหน้ามีช่อง: เป้าสัปดาห์ / งานที่ต้องทำ
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

      {/* ── STAGE 3: รายสัปดาห์ ── */}
      {stage === 3 && (
        <div className="rounded-xl border-2 border-sky-300 overflow-hidden">
          <div className="px-4 py-3 bg-sky-50 text-sky-800 flex items-center gap-2">
            <span className="text-xs font-black bg-sky-200 rounded-full px-2 py-0.5">3</span>
            <span className="font-black text-sm">แผนรายสัปดาห์</span>
          </div>
          <div className="px-4 py-4 space-y-4">
            <div>
              <label className={LABEL}>จำนวนหน้าสัปดาห์</label>
              <div className="flex items-center gap-3">
                <input type="number" min={0} max={52} value={weekCount}
                  onChange={e => setWeekCount(Math.max(0, Math.min(52, Number(e.target.value))))}
                  className="w-24 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm" />
                <span className="text-sm text-neutral-500">หน้า</span>
              </div>
            </div>
            <div>
              <label className={LABEL}>รูปแบบหน้าสัปดาห์</label>
              <div className="space-y-2">
                {([
                  { v: 'simple',   l: 'แบบง่าย',        desc: 'เป้าสัปดาห์ + ช่องงาน 5 บรรทัด' },
                  { v: '135rule',  l: 'กฎ 1-3-5',        desc: '1 งานหลัก + 3 งานรอง + 5 งานเล็ก' },
                  { v: 'timeblock', l: 'Time Block',      desc: 'ตาราง จ.–อา. × เช้า/กลางวัน/เย็น' },
                ] as { v: PipelineWeeklyLayout; l: string; desc: string }[]).map(({ v, l, desc }) => (
                  <label key={v}
                    className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 cursor-pointer transition
                      ${weekLayout === v ? 'border-sky-500 bg-sky-50' : 'border-neutral-200 hover:border-sky-300'}`}>
                    <input type="radio" checked={weekLayout === v} onChange={() => setWeekLayout(v)} className="hidden" />
                    <div>
                      <p className={`text-sm font-black ${weekLayout === v ? 'text-sky-800' : 'text-neutral-700'}`}>{weekLayout === v ? '✓ ' : ''}{l}</p>
                      <p className="text-[11px] text-neutral-500">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STAGE 4: รายวัน ── */}
      {stage === 4 && (
        <div className="rounded-xl border-2 border-amber-300 overflow-hidden">
          <div className="px-4 py-3 bg-amber-50 text-amber-800 flex items-center gap-2">
            <span className="text-xs font-black bg-amber-200 rounded-full px-2 py-0.5">4</span>
            <span className="font-black text-sm">แผนรายวัน</span>
          </div>
          <div className="px-4 py-4 space-y-4">
            <div>
              <label className={LABEL}>จำนวนหน้าวัน</label>
              <div className="flex items-center gap-3">
                <input type="number" min={0} max={365} value={dayCount}
                  onChange={e => setDayCount(Math.max(0, Math.min(365, Number(e.target.value))))}
                  className="w-24 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm" />
                <span className="text-sm text-neutral-500">หน้า</span>
              </div>
            </div>
            <div>
              <label className={LABEL}>รูปแบบหน้าวัน</label>
              <div className="space-y-2">
                {([
                  { v: 'todo',       l: 'To-Do 1-3-5',    desc: '1 ต้องทำ + 3 ควรทำ + 5 ถ้ามีเวลา + โน้ต' },
                  { v: 'timeblock',  l: 'Time Block',      desc: 'ตาราง 06:00–22:00 รายชั่วโมง' },
                  { v: 'combined',   l: 'รวม (แนะนำ)',     desc: 'Time Block ซ้าย + To-Do ขวา' },
                ] as { v: PipelineDailyLayout; l: string; desc: string }[]).map(({ v, l, desc }) => (
                  <label key={v}
                    className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 cursor-pointer transition
                      ${dayLayout === v ? 'border-amber-500 bg-amber-50' : 'border-neutral-200 hover:border-amber-300'}`}>
                    <input type="radio" checked={dayLayout === v} onChange={() => setDayLayout(v)} className="hidden" />
                    <div>
                      <p className={`text-sm font-black ${dayLayout === v ? 'text-amber-800' : 'text-neutral-700'}`}>{dayLayout === v ? '✓ ' : ''}{l}</p>
                      <p className="text-[11px] text-neutral-500">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
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
