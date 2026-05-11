'use client'
import { useState, useEffect } from 'react'
import type { PlannerPipelineData, PipelinePhase, PipelineBigRock, PipelineMetric } from '@/lib/engine-types'

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

interface Props { onChange: (data: PlannerPipelineData) => void }

export function PipelinePlannerForm({ onChange }: Props) {
  const [stage, setStage] = useState(1)

  // META
  const [displayTitle, setDisplayTitle] = useState('')
  const [description, setDescription]   = useState('')
  const [colorTheme,  setColorTheme]    = useState<PlannerPipelineData['meta']['colorTheme']>('violet')
  const [coverPage,   setCoverPage]     = useState(true)

  // Stage 1
  const [bigGoal,          setBigGoal]          = useState('')
  const [deadline,         setDeadline]         = useState('')
  const [why,              setWhy]              = useState('')
  const [successCriteria,  setSuccessCriteria]  = useState([''])
  const [budget,           setBudget]           = useState('')
  const [timeLimit,        setTimeLimit]        = useState('')
  const [others,           setOthers]           = useState<string[]>([])

  // Stage 2
  const [phases,    setPhases]    = useState<PipelinePhase[]>([
    { name: 'Phase 1', timeRange: '', tasks: [''], budget: '' },
  ])
  const [bigRocks,  setBigRocks]  = useState<PipelineBigRock[]>([{ task: '', deadline: '' }])

  // Stage 3
  const [habits,           setHabits]           = useState([''])
  const [metrics,          setMetrics]          = useState<PipelineMetric[]>([
    { name: '', target: '', frequency: 'weekly' },
  ])
  const [reviewCycle,      setReviewCycle]      = useState<'daily' | 'weekly' | 'monthly'>('weekly')
  const [reviewQuestions,  setReviewQuestions]  = useState([''])
  const [adjustmentRules,  setAdjustmentRules]  = useState<string[]>([])

  // Notes
  const [notesStyle, setNotesStyle] = useState<'lined' | 'dotgrid' | 'blank'>('lined')
  const [notesPages, setNotesPages] = useState(1)
  const [diaryDays,  setDiaryDays]  = useState(0)

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
    })
  }, [
    displayTitle, description, colorTheme, coverPage,
    bigGoal, deadline, why, successCriteria, budget, timeLimit, others,
    phases, bigRocks,
    habits, metrics, reviewCycle, reviewQuestions, adjustmentRules,
    notesStyle, notesPages, diaryDays,
    onChange,
  ])

  const stage1Valid = !!bigGoal.trim() && !!deadline.trim()
  const stage2Valid = phases.some(p => p.name.trim())

  const THEME_OPTS: { v: PlannerPipelineData['meta']['colorTheme']; l: string; color: string }[] = [
    { v: 'violet',  l: 'ม่วง',   color: 'bg-violet-500'  },
    { v: 'rose',    l: 'ชมพู',   color: 'bg-rose-500'    },
    { v: 'emerald', l: 'เขียว',  color: 'bg-emerald-500' },
    { v: 'amber',   l: 'เหลือง', color: 'bg-amber-500'   },
    { v: 'sky',     l: 'ฟ้า',    color: 'bg-sky-500'     },
  ]

  return (
    <div className="space-y-4">

      {/* Stage indicator */}
      <div className="flex gap-1.5">
        {([1, 2, 3] as const).map(n => {
          const canClick = n < stage || (n === 2 && stage1Valid) || (n === 3 && stage1Valid && stage2Valid)
          return (
            <button key={n} type="button"
              onClick={() => { if (canClick) setStage(n) }}
              className={`flex-1 rounded-lg py-2 text-xs font-black transition ${
                stage === n
                  ? 'bg-violet-600 text-white shadow-sm'
                  : canClick
                    ? 'bg-violet-100 text-violet-700 hover:bg-violet-200'
                    : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
              }`}>
              {n === 1 ? 'ขั้นที่ 1 — ตั้งเป้า' : n === 2 ? 'ขั้นที่ 2 — แผน' : 'ขั้นที่ 3 — ติดตาม'}
            </button>
          )
        })}
      </div>

      {/* Summary bars for completed stages */}
      {stage > 1 && stage1Valid && (
        <div className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs">
          <p className="font-black text-violet-800">{bigGoal}</p>
          <p className="text-violet-600">ถึง: {deadline}{why ? ` · ${why}` : ''}</p>
        </div>
      )}
      {stage > 2 && stage2Valid && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs">
          <p className="font-black text-emerald-800">
            {phases.filter(p => p.name.trim()).length} phase
            {' · '}
            {bigRocks.filter(r => r.task.trim()).length} big rock
          </p>
        </div>
      )}

      {/* META — always visible */}
      <div className="rounded-xl border-2 border-neutral-200 overflow-hidden">
        <div className="px-4 py-2.5 bg-neutral-100 text-neutral-700 text-[11px] font-black uppercase tracking-widest">ตั้งค่า PDF</div>
        <div className="px-4 py-4 space-y-3">
          <div>
            <label className={LABEL}>ชื่อที่แสดงใน PDF *</label>
            <input value={displayTitle} onChange={e => setDisplayTitle(e.target.value)}
              placeholder="เช่น Pipeline แผนเปิดตัวสินค้า 2026" className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>คำอธิบาย (ใช้ในร้านค้า)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              placeholder="เช่น Pipeline Planner สำหรับวางแผนโปรเจกต์ 3 ขั้นตอน ครบจบในฉบับเดียว"
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

      {/* ── STAGE 1 ── */}
      {stage === 1 && (
        <div className="rounded-xl border-2 border-violet-300 overflow-hidden">
          <div className="px-4 py-3 bg-violet-50 text-violet-800 flex items-center gap-2">
            <span className="text-xs font-black bg-violet-200 rounded-full px-2 py-0.5">ขั้นที่ 1</span>
            <span className="font-black text-sm">ตั้งเป้าหมาย</span>
          </div>
          <div className="px-4 py-4 space-y-4">
            <div>
              <label className={LABEL}>เป้าหมายใหญ่ที่ต้องการทำให้สำเร็จ *</label>
              <textarea value={bigGoal} onChange={e => setBigGoal(e.target.value)} rows={2}
                placeholder="เช่น เปิดตัวสินค้าใหม่และมียอดขาย ฿100,000 ภายใน 3 เดือน"
                className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Deadline *</label>
              <input value={deadline} onChange={e => setDeadline(e.target.value)}
                placeholder="เช่น 31 สิงหาคม 2026" className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>ทำไมเป้าหมายนี้ถึงสำคัญ?</label>
              <input value={why} onChange={e => setWhy(e.target.value)}
                placeholder="เช่น เป็น stepping stone สู่เป้าหมายการเงินระยะยาว" className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>เกณฑ์ความสำเร็จ (วัดผลอย่างไร?)</label>
              <DynList items={successCriteria} onChange={setSuccessCriteria}
                placeholder="เช่น ยอดขายถึง ฿100,000" addLabel="เพิ่มเกณฑ์" />
            </div>
            <div className="space-y-2">
              <label className={LABEL}>ข้อจำกัด (ไม่บังคับ)</label>
              <input value={budget} onChange={e => setBudget(e.target.value)}
                placeholder="งบ เช่น ฿50,000" className={INPUT} />
              <input value={timeLimit} onChange={e => setTimeLimit(e.target.value)}
                placeholder="เวลา เช่น ทำได้วันละ 2 ชั่วโมง" className={INPUT} />
              {others.length > 0
                ? <DynList items={others} onChange={setOthers} placeholder="อื่นๆ เช่น ต้องทำคนเดียว" addLabel="เพิ่มรายการ" />
                : <button type="button" onClick={() => setOthers([''])}
                    className="text-xs font-black text-neutral-500 hover:text-neutral-700">
                    + อื่นๆ
                  </button>
              }
            </div>
          </div>
        </div>
      )}

      {/* ── STAGE 2 ── */}
      {stage === 2 && (
        <div className="rounded-xl border-2 border-emerald-300 overflow-hidden">
          <div className="px-4 py-3 bg-emerald-50 text-emerald-800 flex items-center gap-2">
            <span className="text-xs font-black bg-emerald-200 rounded-full px-2 py-0.5">ขั้นที่ 2</span>
            <span className="font-black text-sm">วางแผนลงมือทำ</span>
          </div>
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
                    <input value={p.budget ?? ''}
                      onChange={e => setPhases(prev => prev.map((x, j) => j === pi ? { ...x, budget: e.target.value } : x))}
                      placeholder="งบ Phase นี้ (ไม่บังคับ)" className={`${INPUT} text-xs`} />
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
              <label className={LABEL}>Big Rocks</label>
              <p className="text-xs text-neutral-500 mb-2">
                งานใหญ่ที่ถ้าไม่ทำ เป้าหมายจะไม่สำเร็จ — ใส่ deadline กำกับแต่ละงานด้วย
                <span className="block text-neutral-400 mt-0.5">เช่น "ทำ Landing Page ให้เสร็จ" deadline "15 มิ.ย."</span>
              </p>
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
        </div>
      )}

      {/* ── STAGE 3 ── */}
      {stage === 3 && (
        <div className="rounded-xl border-2 border-amber-300 overflow-hidden">
          <div className="px-4 py-3 bg-amber-50 text-amber-800 flex items-center gap-2">
            <span className="text-xs font-black bg-amber-200 rounded-full px-2 py-0.5">ขั้นที่ 3</span>
            <span className="font-black text-sm">ติดตามผล</span>
          </div>
          <div className="px-4 py-4 space-y-5">
            <div>
              <label className={LABEL}>นิสัยที่ต้องติดตาม</label>
              <DynList items={habits} onChange={setHabits}
                placeholder="เช่น ทบทวนแผน 15 นาที / โพสต์ content รายวัน"
                addLabel="เพิ่มนิสัย" />
            </div>
            <div>
              <label className={LABEL}>ตัวชี้วัด (KPI / Metric)</label>
              <div className="space-y-2">
                {metrics.map((m, i) => (
                  <div key={i} className="flex gap-2">
                    <input value={m.name}
                      onChange={e => setMetrics(prev => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                      placeholder="ชื่อ KPI เช่น ยอดขาย" className={INPUT} />
                    <input value={m.target}
                      onChange={e => setMetrics(prev => prev.map((x, j) => j === i ? { ...x, target: e.target.value } : x))}
                      placeholder="เป้าหมาย เช่น ฿10,000/สัปดาห์" className={INPUT} />
                    <select value={m.frequency}
                      onChange={e => setMetrics(prev => prev.map((x, j) => j === i ? { ...x, frequency: e.target.value as 'daily'|'weekly'|'monthly' } : x))}
                      className="rounded-lg border border-neutral-200 bg-neutral-50 px-2 text-sm cursor-pointer">
                      <option value="daily">ทุกวัน</option>
                      <option value="weekly">รายสัปดาห์</option>
                      <option value="monthly">รายเดือน</option>
                    </select>
                    {metrics.length > 1 && (
                      <button type="button" onClick={() => setMetrics(prev => prev.filter((_, j) => j !== i))}
                        className="text-red-400 text-sm px-1">✕</button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => setMetrics(prev => [...prev, { name: '', target: '', frequency: 'weekly' }])}
                  className="text-xs font-black text-amber-600 hover:text-amber-700">
                  + เพิ่ม Metric
                </button>
              </div>
            </div>
            <div>
              <label className={LABEL}>รอบทบทวน</label>
              <div className="flex gap-3 flex-wrap">
                {(['daily', 'weekly', 'monthly'] as const).map(v => (
                  <label key={v}
                    className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 cursor-pointer text-sm font-bold transition
                      ${reviewCycle === v ? 'border-amber-500 bg-amber-50 text-amber-800' : 'border-neutral-200 text-neutral-500 hover:border-amber-300'}`}>
                    <input type="radio" checked={reviewCycle === v} onChange={() => setReviewCycle(v)} className="hidden" />
                    {reviewCycle === v ? '✓ ' : ''}{v === 'daily' ? 'ทุกวัน' : v === 'weekly' ? 'รายสัปดาห์' : 'รายเดือน'}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className={LABEL}>คำถามทบทวน</label>
              <DynList items={reviewQuestions} onChange={setReviewQuestions}
                placeholder="เช่น สิ่งที่ทำได้ดีคืออะไร?" addLabel="เพิ่มคำถาม" />
            </div>
            <div>
              <label className={LABEL}>กฎปรับแผน (ไม่บังคับ)</label>
              {adjustmentRules.length > 0
                ? <DynList items={adjustmentRules} onChange={setAdjustmentRules}
                    placeholder="เช่น ถ้าช้ากว่าแผน 2 สัปดาห์ ให้ตัด Phase สุดท้าย"
                    addLabel="เพิ่มกฎ" />
                : <button type="button" onClick={() => setAdjustmentRules([''])}
                    className="text-xs font-black text-neutral-500 hover:text-neutral-700">
                    + เพิ่มกฎปรับแผน
                  </button>
              }
            </div>

            {/* Notes */}
            <div className="border-t border-neutral-100 pt-4 space-y-3">
              <p className="text-[11px] font-black uppercase tracking-widest text-neutral-400">หน้าบันทึกเพิ่มเติม</p>
              <div className="flex gap-3 flex-wrap">
                {([['lined','เส้นบรรทัด'],['dotgrid','ตารางจุด'],['blank','ว่างเปล่า']] as const).map(([v,l]) => (
                  <label key={v}
                    className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 cursor-pointer text-sm font-bold transition
                      ${notesStyle === v ? 'border-violet-500 bg-violet-50 text-violet-800' : 'border-neutral-200 text-neutral-500 hover:border-violet-300'}`}>
                    <input type="radio" checked={notesStyle === v} onChange={() => setNotesStyle(v)} className="hidden" />
                    {notesStyle === v ? '✓ ' : ''}{l}
                  </label>
                ))}
              </div>
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-bold text-neutral-600">หน้าจดบันทึก</label>
                  <input type="number" min={0} max={10} value={notesPages}
                    onChange={e => setNotesPages(Math.min(10, Math.max(0, Number(e.target.value))))}
                    className="w-20 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-bold text-neutral-600">บันทึกรายวัน (วัน)</label>
                  <input type="number" min={0} max={31} value={diaryDays}
                    onChange={e => setDiaryDays(Math.min(31, Math.max(0, Number(e.target.value))))}
                    className="w-20 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stage navigation */}
      <div className="flex gap-2">
        {stage > 1 && (
          <button type="button" onClick={() => setStage(s => s - 1)}
            className="flex-1 rounded-lg border border-neutral-200 py-2.5 text-sm font-black text-neutral-600 hover:border-neutral-400">
            ← ขั้นก่อนหน้า
          </button>
        )}
        {stage < 3 && (
          <button type="button"
            disabled={stage === 1 ? !stage1Valid : !stage2Valid}
            onClick={() => setStage(s => s + 1)}
            className="flex-1 rounded-lg bg-violet-600 py-2.5 text-sm font-black text-white transition hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed">
            ขั้นถัดไป →
          </button>
        )}
      </div>

    </div>
  )
}
