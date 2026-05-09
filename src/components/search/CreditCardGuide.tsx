// CreditCardGuide — Bank Promotion Guide Component
// TASK 1.19: แสดง public bank promotions บน Search Result Page
//
// UX Rule: ไม่ให้ user กรอกข้อมูลบัตร
//           ระบบรู้จาก public bank promotions เท่านั้น
//
// No 'use client' — renders on server (pure display)

import type { BankPromotion, Platform } from '@/types'

// ---------------------------------------------------------------------------
// Bank color map
// ---------------------------------------------------------------------------

const BANK_STYLE: Record<string, { bg: string; text: string; accent: string }> = {
  KBank:    { bg: 'bg-green-50',   text: 'text-green-800',  accent: 'bg-green-500' },
  SCB:      { bg: 'bg-purple-50',  text: 'text-purple-800', accent: 'bg-purple-500' },
  KTC:      { bg: 'bg-blue-50',    text: 'text-blue-800',   accent: 'bg-blue-500' },
  AEON:     { bg: 'bg-yellow-50',  text: 'text-yellow-800', accent: 'bg-yellow-500' },
  BBL:      { bg: 'bg-sky-50',     text: 'text-sky-800',    accent: 'bg-sky-500' },
  TTB:      { bg: 'bg-indigo-50',  text: 'text-indigo-800', accent: 'bg-indigo-500' },
  Krungsri: { bg: 'bg-orange-50',  text: 'text-orange-800', accent: 'bg-orange-500' },
}

const DEFAULT_STYLE = { bg: 'bg-neutral-50', text: 'text-neutral-800', accent: 'bg-neutral-500' }

// ---------------------------------------------------------------------------
// Day-of-week label
// ---------------------------------------------------------------------------

const DAY_LABELS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัส', 'ศุกร์', 'เสาร์']

function buildDayLabel(dayOfWeek: number | null): string {
  if (dayOfWeek === null) return 'ทุกวัน'
  return `ทุกวัน${DAY_LABELS[dayOfWeek]}`
}

// ---------------------------------------------------------------------------
// Saving description
// ---------------------------------------------------------------------------

function buildSavingLabel(promo: BankPromotion): string {
  switch (promo.discount_type) {
    case 'cashback':
    case 'percent':
      return `แคชแบ็ก ${promo.discount_value}%${promo.max_discount ? ` สูงสุด ฿${promo.max_discount.toLocaleString('th-TH')}` : ''}`
    case 'fixed':
      return `ลด ฿${promo.discount_value.toLocaleString('th-TH')}`
  }
}

// ---------------------------------------------------------------------------
// Single promo card
// ---------------------------------------------------------------------------

function BankPromoCard({ promo }: { promo: BankPromotion }) {
  const style = BANK_STYLE[promo.bank_name] ?? DEFAULT_STYLE

  return (
    <div className={`rounded-2xl border border-opacity-30 p-4 ${style.bg} border-current`}>
      <div className="flex items-start gap-3">
        {/* Bank badge */}
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${style.accent} text-white text-[10px] font-black leading-tight text-center`}>
          {promo.bank_name.slice(0, 3)}
        </div>

        <div className="min-w-0 flex-1">
          {/* Bank name + day */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-black ${style.text}`}>
              {promo.bank_name}
            </span>
            <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-neutral-600">
              {buildDayLabel(promo.day_of_week)}
            </span>
            {promo.category && (
              <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-neutral-600">
                {promo.category}
              </span>
            )}
          </div>

          {/* Saving label */}
          <p className={`mt-0.5 text-sm font-extrabold ${style.text}`}>
            {buildSavingLabel(promo)}
          </p>

          {/* Min spend */}
          {promo.min_spend > 0 && (
            <p className="mt-0.5 text-[11px] text-neutral-500">
              ขั้นต่ำ ฿{promo.min_spend.toLocaleString('th-TH')}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface CreditCardGuideProps {
  promotions: BankPromotion[]
  platform: Platform | 'all'
}

export function CreditCardGuide({ promotions, platform }: CreditCardGuideProps) {
  if (promotions.length === 0) return null

  const platformLabel = platform === 'all' ? '' : ` บน ${platform === 'shopee' ? 'Shopee' : 'Lazada'}`

  return (
    <section className="mt-4 rounded-4xl border border-orange-200 bg-white p-5 shadow-sm sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="inline-flex rounded-full bg-black px-3 py-1 text-xs font-bold text-white">
            บัตรเครดิต
          </span>
          <h2 className="mt-3 text-lg font-black text-black">
            บัตรที่คุ้มสุดวันนี้{platformLabel}
          </h2>
          <p className="mt-1 text-xs text-neutral-500">
            แคชแบ็กเพิ่มเติมจากธนาคาร — ใช้ได้พร้อมโค้ดส่วนลดแพลตฟอร์ม
          </p>
        </div>
      </div>

      {/* Promo list */}
      <div className="mt-4 flex flex-col gap-3">
        {promotions.map(promo => (
          <BankPromoCard key={promo.id} promo={promo} />
        ))}
      </div>

      {/* Disclaimer */}
      <p className="mt-4 text-[10px] leading-4 text-neutral-400">
        * ข้อมูลโปรโมชันธนาคารเป็นข้อมูลสาธารณะ ไม่จำเป็นต้องกรอกข้อมูลบัตร
        เงื่อนไขอาจเปลี่ยนแปลง — กรุณาตรวจสอบกับธนาคารก่อนใช้งาน
      </p>
    </section>
  )
}
