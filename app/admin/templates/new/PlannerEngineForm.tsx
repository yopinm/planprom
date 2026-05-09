'use client'
import { useState, useEffect } from 'react'
import type { PlannerEngineData, QuarterlyTheme } from '@/lib/engine-types'

const INPUT = 'w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:bg-white transition'
const LABEL = 'block text-[11px] font-black uppercase tracking-widest text-neutral-400 mb-1.5'
const SELECT = `${INPUT} cursor-pointer`

function DynList({ items, onChange, placeholder, addLabel }: {
  items: string[]; onChange: (v: string[]) => void
  placeholder?: string; addLabel?: string
}) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input value={item} onChange={e=>{const n=[...items];n[i]=e.target.value;onChange(n)}}
            placeholder={placeholder ?? 'กรอก...'} className={INPUT} />
          {items.length > 1 && (
            <button type="button" onClick={()=>onChange(items.filter((_,j)=>j!==i))}
              className="px-2 text-red-400 hover:text-red-600 text-sm">✕</button>
          )}
        </div>
      ))}
      <button type="button" onClick={()=>onChange([...items,''])}
        className="text-xs font-black text-violet-600 hover:text-violet-700">
        + {addLabel ?? 'เพิ่มรายการ'}
      </button>
    </div>
  )
}

function PillarCard({ num, title, color, children }: {
  num: string; title: string; color: string; children: React.ReactNode
}) {
  const [open, setOpen] = useState(num === '1')
  return (
    <div className="rounded-xl border border-neutral-200 overflow-hidden">
      <button type="button" onClick={()=>setOpen(o=>!o)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left ${color}`}>
        <span className="text-xs font-black bg-white/40 rounded-full px-2 py-0.5">แกนที่ {num}</span>
        <span className="font-black text-sm flex-1">{title}</span>
        <span className="text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-4 py-4 space-y-4 bg-white">{children}</div>}
    </div>
  )
}

interface Props { onChange: (data: PlannerEngineData) => void }

export function PlannerEngineForm({ onChange }: Props) {
  // P1
  const [title, setTitle]   = useState('')
  const [desc, setDesc]     = useState('')
  const [period, setPeriod] = useState<'yearly'|'quarterly'|'monthly'|'weekly'>('yearly')
  const [fw, setFw]         = useState<'SMART'|'OKR'|'both'|'none'>('OKR')
  const [goals, setGoals]   = useState(['',''])
  const [themes, setThemes] = useState<QuarterlyTheme[]>([
    { quarter:'Q1', theme:'', keyActions:'' },
    { quarter:'Q2', theme:'', keyActions:'' },
  ])
  const [rocks, setRocks]   = useState([''])

  // P2
  const [views, setViews]     = useState<('monthly'|'weekly'|'daily')[]>(['weekly','daily'])
  const [dpp, setDpp]         = useState(7)
  const [focusAreas, setFocusAreas] = useState([''])
  const [eisenhower, setEisenhower] = useState(false)

  // P3
  const [habits, setHabits]     = useState(['','',''])
  const [mood, setMood]         = useState(false)
  const [finance, setFinance]   = useState(['รายรับ','รายจ่าย'])
  const [reviewCycle, setReviewCycle] = useState<'weekly'|'monthly'|'both'>('weekly')
  const [reviewQs, setReviewQs] = useState(['สิ่งที่ทำได้ดีในสัปดาห์นี้คืออะไร?','สิ่งที่ต้องปรับปรุงคืออะไร?'])

  // P4
  const [projects, setProjects]     = useState([''])
  const [gratitude, setGratitude]   = useState(true)
  const [gratitudePs, setGratitudePs] = useState(['วันนี้ขอบคุณสำหรับ...','วันนี้ฉันรู้สึกดีที่...'])
  const [notesStyle, setNotesStyle] = useState<'lined'|'dotgrid'|'blank'>('lined')
  const [brainPages, setBrainPages] = useState(1)

  function toggleView(v: 'monthly'|'weekly'|'daily') {
    setViews(prev => prev.includes(v) ? prev.filter(x=>x!==v) : [...prev,v])
  }
  function updateTheme(i: number, field: keyof QuarterlyTheme, val: string) {
    setThemes(prev => prev.map((t,j) => j===i ? {...t,[field]:val} : t))
  }
  function addTheme() { setThemes(prev=>[...prev,{quarter:'',theme:'',keyActions:''}]) }
  function removeTheme(i: number) { setThemes(prev=>prev.filter((_,j)=>j!==i)) }

  useEffect(() => {
    onChange({
      p1: { plannerTitle:title, description:desc, period, framework:fw,
            yearlyGoals:goals.filter(g=>g.trim()),
            quarterlyThemes:themes.filter(t=>t.quarter.trim()||t.theme.trim()),
            bigRocks:rocks.filter(r=>r.trim()) },
      p2: { views, daysPerPage:dpp, focusAreas:focusAreas.filter(a=>a.trim()), includeEisenhower:eisenhower },
      p3: { habitNames:habits.filter(h=>h.trim()), includeMoodTracker:mood,
            financeCategories:finance.filter(c=>c.trim()),
            reviewCycle, reviewQuestions:reviewQs.filter(q=>q.trim()) },
      p4: { projectAreas:projects.filter(a=>a.trim()), includeGratitudeJournal:gratitude,
            gratitudePrompts:gratitudePs.filter(p=>p.trim()),
            notesStyle, brainDumpPages:brainPages },
    })
  }, [title,desc,period,fw,goals,themes,rocks,views,dpp,focusAreas,eisenhower,
      habits,mood,finance,reviewCycle,reviewQs,projects,gratitude,gratitudePs,notesStyle,brainPages,onChange])

  return (
    <div className="space-y-3">
      {/* P1 */}
      <PillarCard num="1" title="เป้าหมายและวิสัยทัศน์ (Goal & Vision)" color="bg-violet-50 text-violet-800">
        <div>
          <label className={LABEL}>ชื่อ Planner *</label>
          <input value={title} onChange={e=>setTitle(e.target.value)}
            placeholder="เช่น Planner 2026 — เส้นทางสู่ความสำเร็จ" className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>คำอธิบาย (แสดงใน preview หน้าร้าน) *</label>
          <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={2}
            placeholder="เช่น Planner ช่วยวางแผนชีวิตและธุรกิจตลอดปี 2026 ตามกรอบ OKR"
            className={INPUT} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>ช่วงเวลา</label>
            <select value={period} onChange={e=>setPeriod(e.target.value as typeof period)} className={SELECT}>
              <option value="yearly">รายปี (Yearly)</option>
              <option value="quarterly">รายไตรมาส (Quarterly)</option>
              <option value="monthly">รายเดือน (Monthly)</option>
              <option value="weekly">รายสัปดาห์ (Weekly)</option>
            </select>
          </div>
          <div>
            <label className={LABEL}>Framework</label>
            <select value={fw} onChange={e=>setFw(e.target.value as typeof fw)} className={SELECT}>
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
            placeholder="เช่น เพิ่มยอดขาย 30% ภายใน Q4"
            addLabel="เพิ่มเป้าหมาย" />
        </div>

        <div>
          <label className={LABEL}>ภาพรวมรายไตรมาส (Quarterly Themes)</label>
          <div className="space-y-3">
            {themes.map((t,i) => (
              <div key={i} className="rounded-lg border border-violet-100 p-3 space-y-2">
                <div className="flex gap-2 items-center">
                  <input value={t.quarter} onChange={e=>updateTheme(i,'quarter',e.target.value)}
                    placeholder="Q1" className={`${INPUT} w-20`} />
                  <input value={t.theme} onChange={e=>updateTheme(i,'theme',e.target.value)}
                    placeholder="Theme หลักของไตรมาส..." className={INPUT} />
                  {themes.length > 1 && (
                    <button type="button" onClick={()=>removeTheme(i)} className="text-red-400 text-sm px-1">✕</button>
                  )}
                </div>
                <textarea value={t.keyActions} onChange={e=>updateTheme(i,'keyActions',e.target.value)}
                  rows={2} placeholder="Key actions (1 บรรทัด = 1 action)" className={`${INPUT} text-xs`} />
              </div>
            ))}
            <button type="button" onClick={addTheme}
              className="text-xs font-black text-violet-600 hover:text-violet-700">
              + เพิ่มไตรมาส
            </button>
          </div>
        </div>

        <div>
          <label className={LABEL}>Big Rocks — งานสำคัญที่สุดของปี</label>
          <DynList items={rocks} onChange={setRocks}
            placeholder="เช่น เปิดตัวสินค้าใหม่ในตลาด"
            addLabel="เพิ่ม Big Rock" />
        </div>
      </PillarCard>

      {/* P2 */}
      <PillarCard num="2" title="การบริหารเวลาและภารกิจ (Execution)" color="bg-amber-50 text-amber-800">
        <div>
          <label className={LABEL}>มุมมองที่ต้องการ (เลือกได้หลายแบบ)</label>
          <div className="flex gap-3 flex-wrap">
            {([['monthly','📅 รายเดือน'],['weekly','🗓 รายสัปดาห์'],['daily','📋 รายวัน']] as const).map(([v,l]) => (
              <label key={v} className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 cursor-pointer transition text-sm font-bold
                ${views.includes(v) ? 'border-amber-500 bg-amber-50 text-amber-800' : 'border-neutral-200 text-neutral-500 hover:border-amber-300'}`}>
                <input type="checkbox" checked={views.includes(v)} onChange={()=>toggleView(v)} className="hidden" />
                {views.includes(v) ? '✓ ' : ''}{l}
              </label>
            ))}
          </div>
        </div>

        {views.includes('daily') && (
          <div>
            <label className={LABEL}>จำนวนวันต่อหน้า (Option C)</label>
            <input type="number" min={1} max={31} value={dpp}
              onChange={e=>setDpp(Math.min(31,Math.max(1,Number(e.target.value))))}
              className={`${INPUT} w-28`} />
            <p className="mt-1 text-[11px] text-neutral-400">ค่าที่แนะนำ: 7 (1 สัปดาห์/หน้า) หรือ 1 (1 วัน/หน้า)</p>
          </div>
        )}

        <div>
          <label className={LABEL}>Focus Areas (แสดงใน daily layout)</label>
          <DynList items={focusAreas} onChange={setFocusAreas}
            placeholder="เช่น งาน / สุขภาพ / การเงิน"
            addLabel="เพิ่ม Focus Area" />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={eisenhower} onChange={e=>setEisenhower(e.target.checked)}
            className="rounded" />
          <span className="text-sm font-bold text-neutral-700">รวม Eisenhower Matrix สำหรับจัดลำดับงาน</span>
        </label>
      </PillarCard>

      {/* P3 */}
      <PillarCard num="3" title="ติดตามพฤติกรรมและดูแลตัวเอง (Tracking & Self-care)" color="bg-emerald-50 text-emerald-800">
        <div>
          <label className={LABEL}>Habit Tracker — ชื่อนิสัยที่ต้องการสร้าง</label>
          <DynList items={habits} onChange={setHabits}
            placeholder="เช่น ออกกำลังกาย / อ่านหนังสือ / ดื่มน้ำ 8 แก้ว"
            addLabel="เพิ่ม Habit" />
          <p className="mt-1 text-[11px] text-neutral-400">ระบบจะสร้าง grid 31 ช่องต่อ habit ให้อัตโนมัติ</p>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={mood} onChange={e=>setMood(e.target.checked)} className="rounded" />
          <span className="text-sm font-bold text-neutral-700">รวม Mood Tracker (😊 ดีมาก → 😞 แย่)</span>
        </label>

        <div>
          <label className={LABEL}>Finance Tracker — หมวดหมู่การเงิน</label>
          <DynList items={finance} onChange={setFinance}
            placeholder="เช่น รายรับ / ค่าอาหาร / ค่าเดินทาง"
            addLabel="เพิ่มหมวดหมู่" />
        </div>

        <div>
          <label className={LABEL}>Review & Reflection</label>
          <select value={reviewCycle} onChange={e=>setReviewCycle(e.target.value as typeof reviewCycle)} className={SELECT}>
            <option value="weekly">รายสัปดาห์</option>
            <option value="monthly">รายเดือน</option>
            <option value="both">ทั้งสัปดาห์และเดือน</option>
          </select>
        </div>

        <div>
          <label className={LABEL}>คำถาม Review</label>
          <DynList items={reviewQs} onChange={setReviewQs}
            placeholder="เช่น สิ่งที่ทำได้ดีคืออะไร?"
            addLabel="เพิ่มคำถาม" />
        </div>
      </PillarCard>

      {/* P4 */}
      <PillarCard num="4" title="บันทึกความคิดและทรัพยากร (Idea & Resource)" color="bg-rose-50 text-rose-800">
        <div>
          <label className={LABEL}>Project Planning — โปรเจกต์/พื้นที่ที่ต้องวางแผน</label>
          <DynList items={projects} onChange={setProjects}
            placeholder="เช่น งานหลัก / Side Project / การเงิน"
            addLabel="เพิ่มโปรเจกต์" />
        </div>

        <div>
          <label className="flex items-center gap-2 cursor-pointer mb-2">
            <input type="checkbox" checked={gratitude} onChange={e=>setGratitude(e.target.checked)} className="rounded" />
            <span className="text-sm font-bold text-neutral-700">รวม Gratitude Journal</span>
          </label>
          {gratitude && (
            <DynList items={gratitudePs} onChange={setGratitudePs}
              placeholder="เช่น วันนี้ขอบคุณสำหรับ..."
              addLabel="เพิ่ม prompt" />
          )}
        </div>

        <div>
          <label className={LABEL}>Brain Dump / Notes Style</label>
          <div className="flex gap-3 flex-wrap">
            {([['lined','เส้นบรรทัด'],['dotgrid','Dot Grid'],['blank','ว่างเปล่า']] as const).map(([v,l]) => (
              <label key={v} className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 cursor-pointer transition text-sm font-bold
                ${notesStyle===v ? 'border-rose-500 bg-rose-50 text-rose-800' : 'border-neutral-200 text-neutral-500 hover:border-rose-300'}`}>
                <input type="radio" checked={notesStyle===v} onChange={()=>setNotesStyle(v)} className="hidden" />
                {notesStyle===v ? '✓ ' : ''}{l}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className={LABEL}>จำนวนหน้า Brain Dump</label>
          <input type="number" min={1} max={10} value={brainPages}
            onChange={e=>setBrainPages(Math.min(10,Math.max(1,Number(e.target.value))))}
            className={`${INPUT} w-24`} />
        </div>
      </PillarCard>
    </div>
  )
}
