'use client'

import { useEffect, useState } from 'react'
import { createPromoCodeAction } from './actions'
import type { PrefillData } from './PromoEngineCards'

const INPUT = 'w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm outline-none transition focus:border-amber-400 focus:bg-white'
const LABEL = 'mb-1 block text-[11px] font-black uppercase tracking-widest text-neutral-400'

function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function calcMinCart(type: string, value: number): string {
  if (!value || value <= 0) return ''
  if (type === 'fixed') {
    return `ลูกค้าต้องมียอดในตะกร้า ≥ ฿${value + 20} ถึงจะใช้โค้ดนี้ได้`
  }
  if (type === 'percent') {
    if (value >= 100) return 'ส่วนลด 100% — ลูกค้าจะได้สินค้าฟรี'
    const min = Math.ceil(20 / (1 - value / 100))
    return `ลูกค้าต้องมียอดในตะกร้า ≥ ฿${min} ถึงจะใช้โค้ดนี้ได้`
  }
  return ''
}

export function PromoCreateForm({ suggested, prefill }: { suggested: string; prefill?: PrefillData | null }) {
  const [code,          setCode]          = useState(suggested)
  const [label,         setLabel]         = useState('')
  const [discountType,  setDiscountType]  = useState('fixed')
  const [discountValue, setDiscountValue] = useState('')
  const [minCartValue,  setMinCartValue]  = useState('0')
  const [startsAt,      setStartsAt]      = useState('')
  const [expiresAt,     setExpiresAt]     = useState('')

  // Sync when engine card generates a prefill
  useEffect(() => {
    if (!prefill) return
    setCode(prefill.code)
    setLabel(prefill.label)
    setDiscountType(prefill.discount_type)
    setDiscountValue(String(prefill.discount_value))
    setMinCartValue(String(prefill.min_cart_value))
    setStartsAt(prefill.starts_at)
    setExpiresAt(prefill.expires_at)
  }, [prefill])

  const hint = calcMinCart(discountType, parseFloat(discountValue))

  return (
    <form action={createPromoCodeAction} className="mt-4 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
      <p className="text-sm font-black text-neutral-700">สร้างโค้ดใหม่</p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Code *</label>
          <div className="flex gap-2">
            <input
              name="code" required
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              className={`${INPUT} flex-1 font-mono uppercase`}
              placeholder="เช่น PLAN55"
            />
            <button
              type="button"
              onClick={() => setCode(genCode())}
              className="shrink-0 rounded-xl border border-neutral-200 px-3 text-xs font-black text-neutral-500 hover:border-neutral-400 transition"
              title="สุ่มโค้ดใหม่"
            >
              🎲
            </button>
          </div>
          <p className="mt-1 text-[11px] text-neutral-400">ตัวพิมพ์ใหญ่อัตโนมัติ</p>
        </div>
        <div>
          <label className={LABEL}>Label *</label>
          <input
            name="label" required
            value={label}
            onChange={e => setLabel(e.target.value)}
            className={INPUT}
            placeholder="เช่น 5.5 Sale 2026"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={LABEL}>ประเภทส่วนลด *</label>
          <select
            name="discount_type" required
            value={discountType}
            onChange={e => setDiscountType(e.target.value)}
            className={INPUT}
          >
            <option value="fixed">Fixed (฿)</option>
            <option value="percent">Percent (%)</option>
          </select>
        </div>
        <div>
          <label className={LABEL}>มูลค่า *</label>
          <input
            name="discount_value"
            type="number" min="1" step="0.01" required
            value={discountValue}
            onChange={e => setDiscountValue(e.target.value)}
            className={INPUT}
            placeholder={discountType === 'fixed' ? '10' : '20'}
          />
        </div>
        <div>
          <label className={LABEL}>ยอดขั้นต่ำ (฿)</label>
          <input
            name="min_cart_value"
            type="number" min="0" step="0.01"
            value={minCartValue}
            onChange={e => setMinCartValue(e.target.value)}
            className={INPUT}
          />
        </div>
      </div>

      {hint && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-700">
          ⚠️ {hint}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={LABEL}>จำนวนสิทธิ์ (blank=ไม่จำกัด)</label>
          <input name="max_uses" type="number" min="1" className={INPUT} placeholder="ไม่จำกัด" />
        </div>
        <div>
          <label className={LABEL}>เริ่มใช้งาน *</label>
          <input
            name="starts_at" type="datetime-local" required
            value={startsAt}
            onChange={e => setStartsAt(e.target.value)}
            className={INPUT}
          />
        </div>
        <div>
          <label className={LABEL}>หมดอายุ *</label>
          <input
            name="expires_at" type="datetime-local" required
            value={expiresAt}
            onChange={e => setExpiresAt(e.target.value)}
            className={INPUT}
          />
        </div>
      </div>

      {prefill && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs text-emerald-700 font-semibold">
          ✅ pre-filled จาก engine — ตรวจสอบแล้วกด สร้างโค้ด
        </div>
      )}

      <div className="pt-1">
        <button type="submit" className="rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-black text-white transition hover:bg-amber-600">
          + สร้างโค้ด
        </button>
      </div>
    </form>
  )
}
