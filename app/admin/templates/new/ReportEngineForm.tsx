'use client'
import { useState, useEffect } from 'react'
import type { ReportEngineData, ReportTableData, ReportTextBlock } from '@/lib/engine-report-types'

type ConfLevel = ReportEngineData['s1']['confidentialLevel']

const INPUT = 'w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none focus:border-sky-400 focus:bg-white transition'
const LABEL = 'block text-[11px] font-black uppercase tracking-widest text-neutral-400 mb-1.5'
const TA = `${INPUT} resize-none`

function SectionCard({ num, title, color, children, defaultOpen = false }: {
  num: string; title: string; color: string; children: React.ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-xl border border-neutral-200 overflow-hidden">
      <button type="button" onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left ${color}`}>
        <span className="text-xs font-black bg-white/40 rounded-full px-2 py-0.5">ส่วนที่ {num}</span>
        <span className="font-black text-sm flex-1">{title}</span>
        <span className="text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-4 py-4 space-y-4 bg-white">{children}</div>}
    </div>
  )
}


function BulletEditor({ items, onChange, placeholder }: {
  items: string[]; onChange: (v: string[]) => void; placeholder?: string
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
        className="text-xs font-black text-sky-600 hover:text-sky-700">+ เพิ่มรายการ</button>
    </div>
  )
}

function TableEditor({ tables, onChange }: { tables: ReportTableData[]; onChange: (v: ReportTableData[]) => void }) {
  const addTable = () => onChange([...tables, { title: '', headers: ['', ''], rows: [['', '']] }])
  const removeTable = (i: number) => onChange(tables.filter((_, j) => j !== i))
  const updateTable = (i: number, t: ReportTableData) => { const n = [...tables]; n[i] = t; onChange(n) }

  return (
    <div className="space-y-4">
      {tables.map((t, i) => (
        <div key={i} className="rounded-lg border border-neutral-200 p-3 space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-xs font-black text-sky-600">ตาราง {i + 1}</p>
            <button type="button" onClick={() => removeTable(i)} className="text-xs text-red-400 hover:text-red-600">ลบ</button>
          </div>
          <input value={t.title} onChange={e => updateTable(i, { ...t, title: e.target.value })}
            placeholder="ชื่อตาราง" className={INPUT} />
          <div>
            <label className={LABEL}>หัวคอลัมน์ (คั่นด้วย Enter)</label>
            <textarea value={t.headers.join('\n')}
              onChange={e => updateTable(i, { ...t, headers: e.target.value.split('\n') })}
              rows={3} placeholder={'คอลัมน์ 1\nคอลัมน์ 2\nคอลัมน์ 3'} className={TA} />
          </div>
          <div>
            <label className={LABEL}>ข้อมูลแถว (แต่ละแถวคั่นด้วย Enter · แต่ละช่องคั่นด้วย | )</label>
            <textarea
              value={t.rows.map(r => r.join(' | ')).join('\n')}
              onChange={e => updateTable(i, {
                ...t,
                rows: e.target.value.split('\n').map(row => row.split(' | ').map(c => c.trim()))
              })}
              rows={5} placeholder={'ข้อมูล A | ข้อมูล B | ข้อมูล C\nข้อมูล D | ข้อมูล E | ข้อมูล F'} className={TA} />
          </div>
        </div>
      ))}
      <button type="button" onClick={addTable}
        className="text-xs font-black text-sky-600 hover:text-sky-700">+ เพิ่มตาราง</button>
    </div>
  )
}

function TextBlockEditor({ blocks, onChange }: { blocks: ReportTextBlock[]; onChange: (v: ReportTextBlock[]) => void }) {
  const add = () => onChange([...blocks, { title: '', body: '' }])
  const remove = (i: number) => onChange(blocks.filter((_, j) => j !== i))
  const update = (i: number, b: ReportTextBlock) => { const n = [...blocks]; n[i] = b; onChange(n) }

  return (
    <div className="space-y-4">
      {blocks.map((b, i) => (
        <div key={i} className="rounded-lg border border-neutral-200 p-3 space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-xs font-black text-sky-600">บล็อกข้อความ {i + 1}</p>
            <button type="button" onClick={() => remove(i)} className="text-xs text-red-400 hover:text-red-600">ลบ</button>
          </div>
          <input value={b.title} onChange={e => update(i, { ...b, title: e.target.value })}
            placeholder="หัวข้อ (ถ้ามี)" className={INPUT} />
          <textarea value={b.body} onChange={e => update(i, { ...b, body: e.target.value })}
            rows={4} placeholder="เนื้อหาการวิเคราะห์..." className={TA} />
        </div>
      ))}
      <button type="button" onClick={add}
        className="text-xs font-black text-sky-600 hover:text-sky-700">+ เพิ่มบล็อกข้อความ</button>
    </div>
  )
}

interface Props { onChange: (data: ReportEngineData) => void }

export function ReportEngineForm({ onChange }: Props) {
  // S1
  const [s1Title,   setS1Title]   = useState('')
  const [s1Sub,     setS1Sub]     = useState('')
  const [s1Org,     setS1Org]     = useState('')
  const [s1Conf,    setS1Conf]    = useState<ConfLevel>('confidential')
  // S3
  const [s3Summary, setS3Summary] = useState('')
  const [s3Findings, setS3Findings] = useState(['', '', ''])
  const [s3Urgent,  setS3Urgent]  = useState('')
  // S4
  const [s4Obj,     setS4Obj]     = useState('')
  const [s4Scope,   setS4Scope]   = useState('')
  const [s4Source,  setS4Source]  = useState('')
  const [s4Period,  setS4Period]  = useState('')
  const [s4Method,  setS4Method]  = useState('')
  const [s4Limit,   setS4Limit]   = useState('')
  // S5
  const [tables,    setTables]    = useState<ReportTableData[]>([])
  const [textBlocks,setTextBlocks]= useState<ReportTextBlock[]>([{ title: '', body: '' }])
  // S6
  const [s6Concl,   setS6Concl]   = useState('')
  const [s6Find,    setS6Find]    = useState(['', '', ''])
  const [s6Reco,    setS6Reco]    = useState('')
  const [s6Risk,    setS6Risk]    = useState('')
  const [s6Fore,    setS6Fore]    = useState('')
  const [s6Score,   setS6Score]   = useState('')
  // S7
  const [s7Raw,     setS7Raw]     = useState('')
  const [s7Ref,     setS7Ref]     = useState('')
  const [s7Glos,    setS7Glos]    = useState('')
  const [s7Profile, setS7Profile] = useState('')
  // S8
  const [s8Name,    setS8Name]    = useState('')
  const [s8Title,   setS8Title]   = useState('')
  const [s8Discl,   setS8Discl]   = useState('')
  const [s8Company, setS8Company] = useState('')
  const [s8Email,   setS8Email]   = useState('')
  const [s8Phone,   setS8Phone]   = useState('')
  const [s8Web,     setS8Web]     = useState('')

  useEffect(() => {
    onChange({
      s1: { reportTitle: s1Title, subtitle: s1Sub, organization: s1Org, confidentialLevel: s1Conf, validityMonths: 12 },
      s3: { kpis: [], summaryText: s3Summary, keyFindings: s3Findings.filter(f => f.trim()), urgentRecommendations: s3Urgent },
      s4: { objective: s4Obj, scope: s4Scope, dataSource: s4Source, dataPeriod: s4Period, methodology: s4Method, limitations: s4Limit },
      s5: { tables, textBlocks },
      s6: { conclusion: s6Concl, findings: s6Find.filter(f => f.trim()), recommendations: s6Reco, risks: s6Risk, forecast: s6Fore, scoreRating: s6Score },
      s7: { rawData: s7Raw, references: s7Ref, glossary: s7Glos, analystProfile: s7Profile },
      s8: { analystName: s8Name, analystTitle: s8Title, disclaimer: s8Discl, companyName: s8Company, contactEmail: s8Email, contactPhone: s8Phone, contactWebsite: s8Web },
    })
  }, [s1Title,s1Sub,s1Org,s1Conf,s3Summary,s3Findings,s3Urgent,s4Obj,s4Scope,s4Source,s4Period,s4Method,s4Limit,tables,textBlocks,s6Concl,s6Find,s6Reco,s6Risk,s6Fore,s6Score,s7Raw,s7Ref,s7Glos,s7Profile,s8Name,s8Title,s8Discl,s8Company,s8Email,s8Phone,s8Web,onChange])

  return (
    <div className="space-y-3">

      {/* S1 — Cover */}
      <SectionCard num="1" title="Cover Page — ข้อมูลหน้าปก" color="bg-sky-50 text-sky-800" defaultOpen>
        <div>
          <label className={LABEL}>ชื่อ Report *</label>
          <input value={s1Title} onChange={e => setS1Title(e.target.value)}
            placeholder="เช่น รายงานวิเคราะห์ตลาดอสังหาริมทรัพย์ Q1/2568" className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>หัวข้อย่อย / Subtitle</label>
          <input value={s1Sub} onChange={e => setS1Sub(e.target.value)}
            placeholder="เช่น ภาคกรุงเทพมหานครและปริมณฑล" className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>จัดทำโดย (ชื่อองค์กร / บริษัท)</label>
          <input value={s1Org} onChange={e => setS1Org(e.target.value)}
            placeholder="เช่น บริษัท วิเคราะห์ดี จำกัด" className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>ระดับความลับ</label>
          <select value={s1Conf} onChange={e => setS1Conf(e.target.value as ConfLevel)} className={INPUT}>
            <option value="public">🌐 ทั่วไป — เปิดเผยได้</option>
            <option value="internal">🏢 ภายใน — ใช้ภายในองค์กร</option>
            <option value="confidential">🔒 ลับ — เฉพาะผู้รับที่ระบุ</option>
            <option value="strictly_confidential">🔴 ลับสุดยอด — ผู้บริหารเท่านั้น</option>
          </select>
        </div>
      </SectionCard>

      {/* S2 — TOC: auto-gen, no input */}
      <div className="rounded-xl border border-dashed border-neutral-200 px-4 py-3 bg-neutral-50">
        <p className="text-xs font-black text-neutral-400 uppercase tracking-widest">ส่วนที่ 2 — สารบัญ (TOC)</p>
        <p className="text-xs text-neutral-400 mt-1">Auto-generate จาก section ทั้งหมด พร้อม Clickable Link ข้ามหน้า</p>
      </div>

      {/* S3 — Executive Summary */}
      <SectionCard num="3" title="Executive Summary — สรุปผู้บริหาร" color="bg-blue-50 text-blue-800">
        <div>
          <label className={LABEL}>สรุปย่อ (3-5 บรรทัด)</label>
          <textarea value={s3Summary} onChange={e => setS3Summary(e.target.value)} rows={4}
            placeholder="สรุปภาพรวมของรายงาน..." className={TA} />
        </div>
        <div>
          <label className={LABEL}>ข้อค้นพบสำคัญ (3-5 ข้อ)</label>
          <BulletEditor items={s3Findings} onChange={setS3Findings} placeholder="เช่น ตลาดเติบโต 12% YoY" />
        </div>
        <div>
          <label className={LABEL}>ข้อเสนอแนะเร่งด่วน</label>
          <textarea value={s3Urgent} onChange={e => setS3Urgent(e.target.value)} rows={2}
            placeholder="สิ่งที่ควรทำทันที..." className={TA} />
        </div>
      </SectionCard>

      {/* S4 — Introduction */}
      <SectionCard num="4" title="Introduction & Scope — บทนำและขอบเขต" color="bg-indigo-50 text-indigo-800">
        {([
          { label: 'วัตถุประสงค์ *', val: s4Obj, set: setS4Obj, ph: 'เป้าหมายของรายงานนี้คืออะไร' },
          { label: 'ขอบเขตข้อมูล', val: s4Scope, set: setS4Scope, ph: 'ครอบคลุมอะไรบ้าง' },
          { label: 'แหล่งข้อมูล', val: s4Source, set: setS4Source, ph: 'ข้อมูลมาจากแหล่งใด' },
          { label: 'ช่วงเวลาข้อมูล', val: s4Period, set: setS4Period, ph: 'เช่น ม.ค. 2568 — มี.ค. 2568' },
          { label: 'วิธีการวิเคราะห์ (Methodology)', val: s4Method, set: setS4Method, ph: 'เช่น Quantitative Analysis, Survey' },
          { label: 'ข้อจำกัด', val: s4Limit, set: setS4Limit, ph: 'สิ่งที่ไม่ครอบคลุมในรายงานนี้' },
        ] as { label: string; val: string; set: (v: string) => void; ph: string }[]).map(f => (
          <div key={f.label}>
            <label className={LABEL}>{f.label}</label>
            <textarea value={f.val} onChange={e => f.set(e.target.value)} rows={2} placeholder={f.ph} className={TA} />
          </div>
        ))}
      </SectionCard>

      {/* S5 — Core Content */}
      <SectionCard num="5" title="Core Content & Analysis — เนื้อหาหลัก" color="bg-violet-50 text-violet-800">
        <div>
          <label className={LABEL}>ตารางข้อมูล (Module C)</label>
          <TableEditor tables={tables} onChange={setTables} />
        </div>
        <div>
          <label className={LABEL}>บล็อกข้อความ / การวิเคราะห์ (Module F)</label>
          <TextBlockEditor blocks={textBlocks} onChange={setTextBlocks} />
        </div>
      </SectionCard>

      {/* S6 — Conclusion */}
      <SectionCard num="6" title="Conclusion & Recommendations — บทสรุป" color="bg-emerald-50 text-emerald-800">
        {([
          { label: 'บทสรุป', val: s6Concl, set: setS6Concl, ph: 'ผลลัพธ์ที่ได้จากการวิเคราะห์' },
          { label: 'ข้อเสนอแนะ (Next Steps)', val: s6Reco, set: setS6Reco, ph: 'สิ่งที่ควรทำต่อ' },
          { label: 'ความเสี่ยงที่ต้องระวัง', val: s6Risk, set: setS6Risk, ph: 'Risk factors' },
          { label: 'การคาดการณ์แนวโน้ม', val: s6Fore, set: setS6Fore, ph: 'Forecast / Outlook' },
          { label: 'คะแนนสรุป / Rating (ถ้ามี)', val: s6Score, set: setS6Score, ph: 'เช่น 8.5/10 · ระดับ A · Positive' },
        ] as { label: string; val: string; set: (v: string) => void; ph: string }[]).map(f => (
          <div key={f.label}>
            <label className={LABEL}>{f.label}</label>
            <textarea value={f.val} onChange={e => f.set(e.target.value)} rows={2} placeholder={f.ph} className={TA} />
          </div>
        ))}
        <div>
          <label className={LABEL}>ข้อค้นพบ (3-5 ข้อ)</label>
          <BulletEditor items={s6Find} onChange={setS6Find} placeholder="เช่น พบว่าต้นทุนสูงกว่าเป้าหมาย 15%" />
        </div>
      </SectionCard>

      {/* S7 — Appendix */}
      <SectionCard num="7" title="Appendix & References — ภาคผนวก" color="bg-amber-50 text-amber-800">
        {([
          { label: 'ข้อมูลดิบ / Raw Data', val: s7Raw, set: setS7Raw, ph: 'สรุปข้อมูลดิบหรือตารางเพิ่มเติม' },
          { label: 'แหล่งอ้างอิง (References)', val: s7Ref, set: setS7Ref, ph: 'เช่น สำนักงานสถิติแห่งชาติ 2568' },
          { label: 'คำนิยาม (Glossary)', val: s7Glos, set: setS7Glos, ph: 'คำศัพท์และความหมายที่ใช้ในรายงาน' },
          { label: 'ประวัติผู้จัดทำ / Analyst Profile', val: s7Profile, set: setS7Profile, ph: 'ประสบการณ์ ความเชี่ยวชาญ' },
        ] as { label: string; val: string; set: (v: string) => void; ph: string }[]).map(f => (
          <div key={f.label}>
            <label className={LABEL}>{f.label}</label>
            <textarea value={f.val} onChange={e => f.set(e.target.value)} rows={2} placeholder={f.ph} className={TA} />
          </div>
        ))}
      </SectionCard>

      {/* S8 — Back Page */}
      <SectionCard num="8" title="Back Page — ลายเซ็นและข้อมูลผู้จัดทำ" color="bg-slate-50 text-slate-800">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL}>ชื่อนักวิเคราะห์ / Analyst</label>
            <input value={s8Name} onChange={e => setS8Name(e.target.value)} placeholder="ชื่อ-นามสกุล" className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>ตำแหน่ง</label>
            <input value={s8Title} onChange={e => setS8Title(e.target.value)} placeholder="เช่น Senior Analyst" className={INPUT} />
          </div>
        </div>
        <div>
          <label className={LABEL}>ชื่อบริษัท / Copyright</label>
          <input value={s8Company} onChange={e => setS8Company(e.target.value)} placeholder="เช่น บริษัท วิเคราะห์ดี จำกัด" className={INPUT} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={LABEL}>Email</label>
            <input value={s8Email} onChange={e => setS8Email(e.target.value)} placeholder="contact@company.com" className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>โทรศัพท์</label>
            <input value={s8Phone} onChange={e => setS8Phone(e.target.value)} placeholder="02-XXX-XXXX" className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>เว็บไซต์</label>
            <input value={s8Web} onChange={e => setS8Web(e.target.value)} placeholder="www.company.com" className={INPUT} />
          </div>
        </div>
        <div>
          <label className={LABEL}>Disclaimer (ถ้ามี — ไม่กรอก = ใช้ default)</label>
          <textarea value={s8Discl} onChange={e => setS8Discl(e.target.value)} rows={2}
            placeholder="ข้อจำกัดความรับผิดชอบ..." className={TA} />
        </div>
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-600">
          <strong>Auto:</strong> QR Code placeholder · Report ID · © Year
        </div>
      </SectionCard>

    </div>
  )
}
