'use client'
import { useState, useEffect, useRef } from 'react'
import type { ChecklistEngineData } from '@/lib/engine-types'

const INPUT = 'w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:bg-white transition'
const LABEL = 'block text-[11px] font-black uppercase tracking-widest text-neutral-400 mb-1.5'

function DynList({ items, onChange, placeholder, addLabel }: {
  items: string[]; onChange: (v: string[]) => void
  placeholder?: string; addLabel?: string
}) {
  const dragIdx = useRef<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  function move(from: number, to: number) {
    const n = [...items]
    const [moved] = n.splice(from, 1)
    n.splice(to, 0, moved)
    onChange(n)
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div
          key={i}
          draggable
          onDragStart={() => { dragIdx.current = i }}
          onDragOver={e => { e.preventDefault(); setDragOver(i) }}
          onDragLeave={() => setDragOver(null)}
          onDrop={() => {
            setDragOver(null)
            if (dragIdx.current !== null && dragIdx.current !== i) move(dragIdx.current, i)
            dragIdx.current = null
          }}
          onDragEnd={() => { dragIdx.current = null; setDragOver(null) }}
          className={`flex gap-2 items-center rounded-lg transition-colors ${dragOver === i ? 'bg-emerald-50 ring-1 ring-emerald-300' : ''}`}
        >
          <span
            className="cursor-grab active:cursor-grabbing text-neutral-300 hover:text-neutral-500 select-none px-1 text-base"
            title="ลากเพื่อเรียงลำดับ"
          >⠿</span>
          <input
            value={item}
            onChange={e => { const n=[...items]; n[i]=e.target.value; onChange(n) }}
            placeholder={placeholder ?? 'กรอก...'}
            className={INPUT}
          />
          {items.length > 1 && (
            <button type="button" onClick={() => onChange(items.filter((_,j)=>j!==i))}
              className="px-2 text-red-400 hover:text-red-600 text-sm">✕</button>
          )}
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items,''])}
        className="text-xs font-black text-emerald-600 hover:text-emerald-700 pl-6">
        + {addLabel ?? 'เพิ่มรายการ'}
      </button>
    </div>
  )
}

function SectionCard({ num, title, color, children }: {
  num: string; title: string; color: string; children: React.ReactNode
}) {
  const [open, setOpen] = useState(num === '1')
  return (
    <div className="rounded-xl border border-neutral-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o=>!o)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left ${color}`}
      >
        <span className="text-xs font-black bg-white/40 rounded-full px-2 py-0.5">ส่วนที่ {num}</span>
        <span className="font-black text-sm flex-1">{title}</span>
        <span className="text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-4 py-4 space-y-4 bg-white">{children}</div>}
    </div>
  )
}

interface Props { onChange: (data: ChecklistEngineData) => void }

export function ChecklistEngineForm({ onChange }: Props) {
  // Section 1
  const [s1title,   setS1title]   = useState('')
  const [s1date,    setS1date]    = useState(new Date().toISOString().slice(0,10))
  const [s1author,  setS1author]  = useState('')
  // Section 2
  const [s2purpose, setS2purpose] = useState('')
  const [s2ctx,     setS2ctx]     = useState('')
  const [s2pre,     setS2pre]     = useState('')
  // Section 3
  const [items, setItems] = useState(['','',''])
  // Section 4
  const [s4remarks, setS4remarks] = useState('')
  // Section 5
  const [exec, setExec] = useState('ผู้ปฏิบัติงาน')
  const [review, setReview] = useState('ผู้ตรวจสอบ / หัวหน้างาน')

  useEffect(() => {
    onChange({
      s1: { title:s1title, docCode:'', version:'1.0', createdDate:s1date, author:s1author },
      s2: { purpose:s2purpose, context:s2ctx, prerequisites:s2pre },
      s3: { items: items.filter(i=>i.trim()) },
      s4: { remarks: s4remarks },
      s5: { executorRole:exec, reviewerRole:review },
    })
  }, [s1title,s1date,s1author,s2purpose,s2ctx,s2pre,items,s4remarks,exec,review,onChange])

  return (
    <div className="space-y-3">
      {/* S1 */}
      <SectionCard num="1" title="ส่วนหัวและข้อมูลพื้นฐาน (Header & Metadata)" color="bg-emerald-50 text-emerald-800">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={LABEL}>ชื่อเช็คลิสต์ *</label>
            <input value={s1title} onChange={e=>setS1title(e.target.value)} placeholder="เช่น เช็คลิสต์ตรวจรับบ้าน" className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>รหัสเอกสาร</label>
            <div className="w-full rounded-lg border border-dashed border-neutral-300 bg-neutral-100 px-3 py-2.5 text-sm text-neutral-400 italic">
              Auto-generate เช่น CK-20260509-0001
            </div>
          </div>
          <div>
            <label className={LABEL}>วันที่จัดทำ</label>
            <input type="date" value={s1date} onChange={e=>setS1date(e.target.value)} className={INPUT} />
          </div>
          <div className="col-span-2">
            <label className={LABEL}>ผู้จัดทำ / ผู้รับผิดชอบ</label>
            <input value={s1author} onChange={e=>setS1author(e.target.value)}
              placeholder="ปล่อยว่าง — ลูกค้ากรอกเองในเอกสาร" className={INPUT} />
          </div>
        </div>
      </SectionCard>

      {/* S2 */}
      <SectionCard num="2" title="วัตถุประสงค์และข้อมูลทั่วไป (Purpose & General Info)" color="bg-blue-50 text-blue-800">
        <div>
          <label className={LABEL}>วัตถุประสงค์ *</label>
          <textarea value={s2purpose} onChange={e=>setS2purpose(e.target.value)} rows={3}
            placeholder="เช่น เพื่อตรวจสอบความปลอดภัยของระบบไฟฟ้าก่อนเปิดใช้งาน"
            className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>บริบทการใช้งาน (โครงการ / หน่วยงาน / สถานที่)</label>
          <textarea value={s2ctx} onChange={e=>setS2ctx(e.target.value)} rows={2}
            placeholder="เช่น โครงการ ABC · แผนกวิศวกรรม · อาคาร B ชั้น 3"
            className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>เงื่อนไข / อุปกรณ์ที่ต้องเตรียมก่อนเริ่ม</label>
          <textarea value={s2pre} onChange={e=>setS2pre(e.target.value)} rows={2}
            placeholder="เช่น สวมอุปกรณ์ป้องกัน PPE · ปิดวงจรไฟฟ้าก่อน"
            className={INPUT} />
        </div>
      </SectionCard>

      {/* S3 */}
      <SectionCard num="3" title="รายการตรวจสอบ (Checklist Items)" color="bg-amber-50 text-amber-800">
        <p className="text-xs text-neutral-500">แต่ละรายการจะมีช่อง ผ่าน / ไม่ผ่าน / N/A ในเอกสาร PDF</p>
        <DynList
          items={items}
          onChange={setItems}
          placeholder="เช่น ตรวจสอบสายดิน"
          addLabel="เพิ่มรายการตรวจสอบ"
        />
      </SectionCard>

      {/* S4 */}
      <SectionCard num="4" title="หมายเหตุและข้อสังเกต (Remarks)" color="bg-neutral-50 text-neutral-600">
        <div>
          <label className={LABEL}>หมายเหตุทั่วไป (ไม่บังคับ)</label>
          <textarea value={s4remarks} onChange={e=>setS4remarks(e.target.value)} rows={3}
            placeholder="เช่น ใช้สำหรับโครงการก่อสร้างเฟส 2 เท่านั้น"
            className={INPUT} />
        </div>
        <p className="text-xs text-neutral-400">
          ระบบจะแสดงหมายเหตุข้างต้น (ถ้ามี) แล้วตามด้วยช่องว่าง 8 บรรทัดสำหรับจดบันทึกเพิ่มเติมในเอกสาร PDF
        </p>
      </SectionCard>

      {/* S5 */}
      <SectionCard num="5" title="การยืนยันและอนุมัติ (Verification & Sign-off)" color="bg-violet-50 text-violet-800">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>ชื่อ / ตำแหน่งผู้ปฏิบัติงาน</label>
            <input value={exec} onChange={e=>setExec(e.target.value)} className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>ชื่อ / ตำแหน่งผู้ตรวจสอบ</label>
            <input value={review} onChange={e=>setReview(e.target.value)} className={INPUT} />
          </div>
        </div>
        <p className="text-xs text-neutral-400">ระบบจะสร้างช่องลายเซ็น วันที่ และสรุปผล Pass/Fail/Revision ให้อัตโนมัติ</p>
      </SectionCard>
    </div>
  )
}
