// /admin/promo-codes — PROMO-3 Admin Promo Code CRUD
import Link from 'next/link'
import type { Metadata } from 'next'
import { requireAdminSession } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { PromoCodeRow } from './PromoCodeRow'
import { PromoCreateForm } from './PromoCreateForm'

export const metadata: Metadata = {
  title: 'Promo Codes — Admin',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

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

        <PromoCreateForm suggested={suggested} />

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
