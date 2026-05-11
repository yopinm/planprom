// /admin/promo-codes — PROMO-3 Admin Promo Code CRUD
import Link from 'next/link'
import type { Metadata } from 'next'
import { requireAdminSession } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { createPromoCodeAction } from './actions'
import { PromoCodeRow } from './PromoCodeRow'

export const metadata: Metadata = {
  title: 'Promo Codes — Admin',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

const INPUT = 'w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm outline-none transition focus:border-amber-400 focus:bg-white'
const LABEL = 'mb-1 block text-[11px] font-black uppercase tracking-widest text-neutral-400'

type PromoCode = {
  id: string; code: string; label: string
  discount_type: string; discount_value: number
  min_cart_value: number; max_uses: number | null; used_count: number
  starts_at: string; expires_at: string; is_active: boolean; created_at: string
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}


export default async function PromoCodesPage() {
  await requireAdminSession('/admin/login')

  const codes = await db<PromoCode[]>`
    SELECT * FROM promo_codes ORDER BY created_at DESC
  `.catch(() => [] as PromoCode[])

  const suggested = generateCode()

  return (
    <main className="min-h-screen bg-neutral-50 pb-20">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link href="/admin" className="text-xs font-bold text-neutral-400 hover:text-black">← Admin</Link>
        <h1 className="mt-2 text-2xl font-black text-black">Promo Codes</h1>
        <p className="mt-0.5 text-sm text-neutral-500">สร้างและจัดการโค้ดส่วนลด · โผล่ที่หน้าโฮมอัตโนมัติเมื่อ active</p>

        {/* Create form */}
        <form action={createPromoCodeAction} className="mt-6 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
          <p className="text-sm font-black text-neutral-700">สร้างโค้ดใหม่</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Code *</label>
              <input
                name="code" required
                defaultValue={suggested}
                className={`${INPUT} font-mono uppercase`}
                placeholder="เช่น PLAN55"
              />
              <p className="mt-1 text-[11px] text-neutral-400">ตัวพิมพ์ใหญ่อัตโนมัติ · Suggested: <span className="font-mono font-bold">{suggested}</span></p>
            </div>
            <div>
              <label className={LABEL}>Label *</label>
              <input name="label" required className={INPUT} placeholder="เช่น 5.5 Sale 2026" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={LABEL}>ประเภทส่วนลด *</label>
              <select name="discount_type" required className={INPUT}>
                <option value="fixed">Fixed (฿)</option>
                <option value="percent">Percent (%)</option>
              </select>
            </div>
            <div>
              <label className={LABEL}>มูลค่า *</label>
              <input name="discount_value" type="number" min="1" step="0.01" required className={INPUT} placeholder="10" />
            </div>
            <div>
              <label className={LABEL}>ยอดขั้นต่ำ (฿)</label>
              <input name="min_cart_value" type="number" min="0" step="0.01" defaultValue="0" className={INPUT} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={LABEL}>จำนวนสิทธิ์ (blank=ไม่จำกัด)</label>
              <input name="max_uses" type="number" min="1" className={INPUT} placeholder="ไม่จำกัด" />
            </div>
            <div>
              <label className={LABEL}>เริ่มใช้งาน *</label>
              <input name="starts_at" type="datetime-local" required className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>หมดอายุ *</label>
              <input name="expires_at" type="datetime-local" required className={INPUT} />
            </div>
          </div>

          <div className="pt-1">
            <button type="submit" className="rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-black text-white transition hover:bg-amber-600">
              + สร้างโค้ด
            </button>
          </div>
        </form>

        {/* List */}
        <div className="mt-8 space-y-3">
          {codes.length === 0 && (
            <div className="rounded-2xl border border-dashed border-neutral-200 py-12 text-center text-sm text-neutral-400">
              ยังไม่มีโค้ด — สร้างอันแรกด้านบน
            </div>
          )}
          {codes.map(c => <PromoCodeRow key={c.id} c={c} />)}
        </div>
      </div>
    </main>
  )
}
