// DIST-01: Facebook Manual Posting — Template Library
// 5 hook formats, sub-ID builder, caption renderer
// Pure functions — no DB, no HTTP, fully testable

export const HOOK_FORMATS = {
  money_pain: {
    name: 'ปวดราคา',
    desc: 'เน้นว่าปกติแพง → โค้ดนี้ช่วยได้',
    emoji: '💸',
    template: `💸 ซื้อ {name} ราคาปกติ {original} บาท
แต่มีโค้ดนี้ → เหลือแค่ {net} บาท
ประหยัดทันที {save} บาท!

🎟️ โค้ด: {coupon}
👉 {url}

#คูปองคุ้ม #ประหยัด`,
  },
  timing_urgency: {
    name: 'เร่งด่วน',
    desc: 'วันนี้วันเดียว / คูปองใกล้หมด',
    emoji: '⏰',
    template: `⏰ วันนี้วันเดียว!

{name}
ราคาปกติ {original} → เหลือ {net} บาท
โค้ด "{coupon}" ใช้ได้วันนี้เท่านั้น

รีบกดก่อนหมด 👉 {url}

#ลดราคา #คูปองคุ้ม`,
  },
  lazy_buyer: {
    name: 'ซื้อง่าย',
    desc: '3 ขั้นตอนสั้น ไม่ต้องคิดมาก',
    emoji: '✅',
    template: `✅ 3 ขั้นตอนเท่านั้น

{name} ราคาสุทธิ {net} บาท

1️⃣ คัดลอกโค้ด: {coupon}
2️⃣ กดลิงก์: {url}
3️⃣ วางโค้ดก่อนกดจ่าย

จบ! ประหยัด {save} บาท 🎉

#คูปองคุ้ม`,
  },
  social_proof: {
    name: 'โซเชียลพรูฟ',
    desc: 'ยอดขาย + เรตติ้ง = คนเชื่อถือ',
    emoji: '🔥',
    template: `🔥 ขายดี! {name}

⭐ {rating}/5.0
💰 Net Price: {net} บาท (ปกติ {original})
🎟️ โค้ด: {coupon}

ดูรายละเอียด 👉 {url}

#bestseller #คูปองคุ้ม`,
  },
  comparison: {
    name: 'เปรียบราคา',
    desc: 'Net Price รวมคูปอง+ค่าส่งแล้ว',
    emoji: '📊',
    template: `📊 คำนวณแล้ว — {name}

ราคาเต็ม: {original} บาท
ลดด้วย "{coupon}": -{save} บาท
Net Price สุทธิ: {net} บาท ✅

(รวมค่าส่งแล้ว — ถูกสุดใน {platform})
กด → {url}

#netprice #คูปองคุ้ม`,
  },
} as const

export type HookFormatKey = keyof typeof HOOK_FORMATS

export const HOOK_FORMAT_KEYS = Object.keys(HOOK_FORMATS) as HookFormatKey[]

export const SLOTS: Record<1 | 2 | 3, string> = {
  1: '11:00',
  2: '17:00',
  3: '21:00',
}

export interface CaptionVars {
  name: string
  original: string
  net: string
  save: string
  coupon: string
  rating: string
  platform: string
  url: string
}

/** Builds sub_id: fb_manual_YYYYMMDD_slot{1/2/3}_{hook} */
export function buildFbSubId(slot: 1 | 2 | 3, hook: HookFormatKey, nowIct?: Date): string {
  const d = nowIct ?? new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }))
  const yyyymmdd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  return `fb_manual_${yyyymmdd}_slot${slot}_${hook}`
}

/** Replaces {name}, {net}, {save}, {coupon}, {rating}, {platform}, {url} in template */
export function renderCaption(hook: HookFormatKey, vars: CaptionVars): string {
  let text: string = HOOK_FORMATS[hook].template
  for (const [k, v] of Object.entries(vars)) {
    text = text.replaceAll(`{${k}}`, v)
  }
  return text
}

/** Builds the couponkum.com/go/ URL with sub_id */
export function buildCouponkumUrl(productId: string, subId: string, siteUrl?: string): string {
  const base = siteUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'https://couponkum.com'
  return `${base}/go/${productId}?sub_id=${encodeURIComponent(subId)}`
}

/** Formats a price number as Thai string (e.g. 12,990) */
export function fmtPrice(value: number): string {
  return Math.round(value).toLocaleString('th-TH')
}
