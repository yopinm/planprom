'use client'

import { useState } from 'react'
import { updatePromoCodeAction, togglePromoCodeAction, deletePromoCodeAction } from './actions'

type PromoCode = {
  id: string; code: string; label: string
  discount_type: string; discount_value: number
  min_cart_value: number; max_uses: number | null; used_count: number
  starts_at: string; expires_at: string; is_active: boolean
  is_secret: boolean; comeback_text: string | null
}

const INPUT = 'w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs outline-none focus:border-amber-400 focus:bg-white'

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
}

function toDatetimeLocal(d: string) {
  const dt = new Date(d)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`
}

function isExpired(d: string) { return new Date(d) < new Date() }

export function PromoCodeRow({ c }: { c: PromoCode }) {
  const [editing, setEditing] = useState(false)

  const expired  = isExpired(c.expires_at)
  const full     = c.max_uses !== null && c.used_count >= c.max_uses
  const statusOk = c.is_active && !expired && !full

  return (
    <div className={`rounded-2xl border bg-white shadow-sm ${statusOk ? 'border-emerald-200' : 'border-neutral-200 opacity-70'}`}>
      {/* Main row */}
      <div className="flex flex-wrap items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-base font-black text-neutral-900">{c.code}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${statusOk ? 'bg-emerald-100 text-emerald-700' : expired ? 'bg-neutral-100 text-neutral-500' : full ? 'bg-red-100 text-red-600' : 'bg-neutral-100 text-neutral-500'}`}>
              {statusOk ? 'ACTIVE' : expired ? 'หมดอายุ' : full ? 'ใช้ครบ' : 'ปิด'}
            </span>
            <span className="text-xs text-neutral-500">{c.label}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${c.is_secret ? 'bg-rose-50 text-rose-500' : 'bg-sky-50 text-sky-600'}`}>
              {c.is_secret ? '🔒 Secret' : '🌐 Public'}
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
            <span className="font-bold text-neutral-700">
              {c.discount_type === 'fixed' ? `฿${c.discount_value} off` : `${c.discount_value}% off`}
              {c.min_cart_value > 0 && ` · ขั้นต่ำ ฿${c.min_cart_value}`}
            </span>
            <span>ใช้แล้ว {c.used_count}{c.max_uses ? `/${c.max_uses}` : ''} ครั้ง</span>
            <span>{fmtDate(c.starts_at)} – {fmtDate(c.expires_at)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setEditing(e => !e)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-black transition ${editing ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-neutral-300 text-neutral-600 hover:bg-neutral-100'}`}
          >
            {editing ? 'ยกเลิก' : 'แก้ไข'}
          </button>
          <form action={togglePromoCodeAction}>
            <input type="hidden" name="id" value={c.id} />
            <input type="hidden" name="is_active" value={String(c.is_active)} />
            <button type="submit" className={`rounded-lg border px-3 py-1.5 text-xs font-black transition ${c.is_active ? 'border-neutral-300 text-neutral-600 hover:bg-neutral-100' : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'}`}>
              {c.is_active ? 'ปิด' : 'เปิด'}
            </button>
          </form>
          <form action={deletePromoCodeAction} onSubmit={e => { if (!confirm('ลบโค้ดนี้?')) e.preventDefault() }}>
            <input type="hidden" name="id" value={c.id} />
            <button type="submit" className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-black text-red-500 transition hover:bg-red-50">
              ลบ
            </button>
          </form>
        </div>
      </div>

      {/* Inline edit form */}
      {editing && (
        <form
          action={async (fd) => { await updatePromoCodeAction(fd); setEditing(false) }}
          className="border-t border-neutral-100 bg-neutral-50 px-4 py-4 space-y-3 rounded-b-2xl"
        >
          <input type="hidden" name="id" value={c.id} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-neutral-400">Label</p>
              <input name="label" required defaultValue={c.label} className={INPUT} />
            </div>
            <div>
              <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-neutral-400">ประเภท</p>
              <select name="discount_type" defaultValue={c.discount_type} className={INPUT}>
                <option value="fixed">Fixed (฿)</option>
                <option value="percent">Percent (%)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-neutral-400">มูลค่า</p>
              <input name="discount_value" type="number" min="1" step="0.01" required defaultValue={c.discount_value} className={INPUT} />
            </div>
            <div>
              <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-neutral-400">ขั้นต่ำ (฿)</p>
              <input name="min_cart_value" type="number" min="0" step="0.01" defaultValue={c.min_cart_value} className={INPUT} />
            </div>
            <div>
              <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-neutral-400">จำนวนสิทธิ์</p>
              <input name="max_uses" type="number" min="1" defaultValue={c.max_uses ?? ''} placeholder="ไม่จำกัด" className={INPUT} />
            </div>
          </div>
          <div>
            <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-neutral-400">หมดอายุ</p>
            <input name="expires_at" type="datetime-local" required defaultValue={toDatetimeLocal(c.expires_at)} className={`${INPUT} max-w-xs`} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2">
              <input id={`secret-${c.id}`} name="is_secret" type="checkbox" defaultChecked={c.is_secret} className="h-4 w-4 rounded accent-rose-500" />
              <label htmlFor={`secret-${c.id}`} className="text-xs font-bold text-neutral-700 cursor-pointer select-none">🔒 โค้ดลับ (ไม่โผล่เว็บ)</label>
            </div>
            <div>
              <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-neutral-400">กลับมาใหม่ (ข้อความหลังหมดอายุ)</p>
              <input name="comeback_text" defaultValue={c.comeback_text ?? ''} placeholder="เช่น 6.6, 7.7 Flash Sale" className={INPUT} />
            </div>
          </div>
          <button type="submit" className="rounded-xl bg-amber-500 px-5 py-2 text-xs font-black text-white hover:bg-amber-600 transition">
            บันทึก
          </button>
        </form>
      )}
    </div>
  )
}
