// TT-CONTENT-1: TikTok Hook Template Library
// 20 hooks organized by type; usable by content team and script generator.

export type HookCategory =
  | 'price_shock'
  | 'secret_tip'
  | 'urgency'
  | 'social_proof'
  | 'myth_bust'
  | 'how_to'

export interface HookTemplate {
  id: number
  category: HookCategory
  category_th: string
  hook: string
  tip: string
}

export const TIKTOK_HOOKS: HookTemplate[] = [
  // ── price_shock ──────────────────────────────────────────────────────────
  {
    id: 1,
    category: 'price_shock',
    category_th: 'ช็อคราคา',
    hook: 'ใครกำลังจะซื้อ {{product}} อย่าเพิ่งกดนะ!',
    tip: 'หยุดคนก่อนสไลด์ผ่าน — ให้ระบุชื่อสินค้าชัดเจน',
  },
  {
    id: 2,
    category: 'price_shock',
    category_th: 'ช็อคราคา',
    hook: '{{product}} ราคา {{price}} บาท ได้มายังไง?',
    tip: 'ตั้งคำถามทันที — คนอยากรู้คำตอบ',
  },
  {
    id: 3,
    category: 'price_shock',
    category_th: 'ช็อคราคา',
    hook: 'ปกติ {{product}} {{original_price}} บาท แต่ตอนนี้เหลือ {{price}} เองนะ',
    tip: 'เปรียบราคาก่อน-หลัง ยิ่งต่างมากยิ่งดี',
  },
  {
    id: 4,
    category: 'price_shock',
    category_th: 'ช็อคราคา',
    hook: 'ประหยัดไปได้ {{saving}} บาท! นี่ไม่ใช่ flash sale ธรรมดานะ',
    tip: 'บอกตัวเลขที่ประหยัดได้ชัดๆ',
  },
  // ── secret_tip ───────────────────────────────────────────────────────────
  {
    id: 5,
    category: 'secret_tip',
    category_th: 'เทคนิคลับ',
    hook: 'คนส่วนใหญ่ไม่รู้ว่า {{product}} ลดเพิ่มได้อีกถ้ากดคูปองซ้อน',
    tip: 'ใช้คำว่า "ส่วนใหญ่ไม่รู้" สร้าง FOMO',
  },
  {
    id: 6,
    category: 'secret_tip',
    category_th: 'เทคนิคลับ',
    hook: 'เทคนิคกดคูปอง {{platform}} ที่แอดมินไม่บอก',
    tip: 'สร้างความรู้สึก exclusive',
  },
  {
    id: 7,
    category: 'secret_tip',
    category_th: 'เทคนิคลับ',
    hook: 'ซื้อ {{product}} อย่าลืม stack {{count}} คูปองก่อนกดสั่ง',
    tip: 'บอกตัวเลขคูปองที่ซ้อนได้จริง',
  },
  {
    id: 8,
    category: 'secret_tip',
    category_th: 'เทคนิคลับ',
    hook: 'สิ่งที่ร้านค้าไม่อยากให้รู้ — คูปองซ้อน {{product}} ทำงานยังไง',
    tip: '"ร้านค้าไม่อยากให้รู้" กระตุ้น curiosity',
  },
  // ── urgency ──────────────────────────────────────────────────────────────
  {
    id: 9,
    category: 'urgency',
    category_th: 'ความเร่งด่วน',
    hook: 'คูปอง {{product}} หมดอายุ {{expire}} นี้ ยังไม่ใช้ถือว่าเสียเงินฟรี',
    tip: 'ระบุวันหมดอายุจริง ไม่โกหก',
  },
  {
    id: 10,
    category: 'urgency',
    category_th: 'ความเร่งด่วน',
    hook: 'เหลือ {{stock}} ชิ้นสุดท้าย {{product}} ราคา {{price}}',
    tip: 'ใช้ได้เฉพาะเมื่อ stock จริงๆ น้อย',
  },
  {
    id: 11,
    category: 'urgency',
    category_th: 'ความเร่งด่วน',
    hook: 'Flash sale {{product}} วันนี้วันเดียว ราคา {{price}} พรุ่งนี้ขึ้นแล้ว',
    tip: 'ต้องเป็น flash sale จริง อย่าโกหก',
  },
  {
    id: 12,
    category: 'urgency',
    category_th: 'ความเร่งด่วน',
    hook: 'รีบ! โค้ด {{code}} ใช้ได้แค่ {{hours}} ชั่วโมงนี้เท่านั้น',
    tip: 'บอก countdown ชัดเจน',
  },
  // ── social_proof ─────────────────────────────────────────────────────────
  {
    id: 13,
    category: 'social_proof',
    category_th: 'Social Proof',
    hook: 'คนซื้อ {{product}} ไปแล้ว {{count}} คน ยังไม่รู้จักคูปองนี้อยู่อีกเหรอ?',
    tip: 'ใช้ตัวเลขจริงจาก platform',
  },
  {
    id: 14,
    category: 'social_proof',
    category_th: 'Social Proof',
    hook: 'รีวิวจริง: ซื้อ {{product}} ราคา {{price}} คุ้มมากกว่าที่คิด',
    tip: 'ต้องรีวิวจริง ไม่แต่งเรื่อง',
  },
  {
    id: 15,
    category: 'social_proof',
    category_th: 'Social Proof',
    hook: 'เพื่อนแนะนำให้ซื้อ {{product}} แต่ราคาที่เพื่อนได้ถูกกว่านี้อีก',
    tip: 'relatable story hook',
  },
  // ── myth_bust ────────────────────────────────────────────────────────────
  {
    id: 16,
    category: 'myth_bust',
    category_th: 'Mythbust',
    hook: 'TikTok บอก {{product}} {{viral_price}} บาท จริงๆ ต้องกดคูปองก่อน ไม่งั้นเสียเงินเกิน',
    tip: 'เปรียบราคา viral vs ราคาจริง',
  },
  {
    id: 17,
    category: 'myth_bust',
    category_th: 'Mythbust',
    hook: 'ราคาที่เห็นใน TikTok ≠ ราคาที่จ่ายจริง — {{product}} ตัวอย่างจริง',
    tip: 'บอกความจริงที่คนไม่รู้ = credibility',
  },
  {
    id: 18,
    category: 'myth_bust',
    category_th: 'Mythbust',
    hook: 'อย่าเชื่อราคา {{product}} ที่เห็น ราคาสุทธิจริงคือ {{net_price}} หลังคูปอง',
    tip: 'แสดงราคาสุทธิหลังคูปองซ้อน',
  },
  // ── how_to ───────────────────────────────────────────────────────────────
  {
    id: 19,
    category: 'how_to',
    category_th: 'How-To',
    hook: '3 ขั้นตอนกดคูปอง {{product}} ให้ถูกที่สุด',
    tip: 'ตัวเลข 3 ขั้นตอน ดีกว่าบอกทั้งหมด',
  },
  {
    id: 20,
    category: 'how_to',
    category_th: 'How-To',
    hook: 'วิธีซื้อ {{product}} ราคา {{price}} บาท ใน {{platform}} ทำตามนี้เลย',
    tip: 'บอก platform ชัดเจน ลด friction',
  },
]

export const HOOK_CATEGORIES: { value: HookCategory; label: string }[] = [
  { value: 'price_shock',  label: 'ช็อคราคา' },
  { value: 'secret_tip',  label: 'เทคนิคลับ' },
  { value: 'urgency',     label: 'ความเร่งด่วน' },
  { value: 'social_proof', label: 'Social Proof' },
  { value: 'myth_bust',   label: 'Mythbust' },
  { value: 'how_to',      label: 'How-To' },
]

export function getHooksByCategory(category: HookCategory): HookTemplate[] {
  return TIKTOK_HOOKS.filter(h => h.category === category)
}

/**
 * Fill placeholders in a hook template.
 * {{product}} → params.product, etc.
 */
export function fillHook(hook: string, params: Record<string, string>): string {
  return hook.replace(/\{\{(\w+)\}\}/g, (_, key) => params[key] ?? `[${key}]`)
}

/**
 * แนะนำ Hook Category อัตโนมัติ (Rule-based) อิงจากข้อมูลสินค้าและส่วนลด
 * สามารถนำไปต่อยอดใช้กับ AI Prompt Generator ได้
 */
export function recommendHookCategory(
  product: { sold: number; price: number; original_price: number },
  mythbustSaving?: number
): HookCategory {
  // 1. ถ้ามีส่วนต่างจากราคา Viral ให้โจมตีด้วย Mythbust
  if (mythbustSaving && mythbustSaving > 0) return 'myth_bust'
  
  // 2. ถ้ายอดขายสูงมาก ให้เน้น Social Proof กระตุ้นความมั่นใจ
  if (product.sold > 5000) return 'social_proof'
  
  // 3. ถ้าส่วนลดเยอะมากๆ ให้ใช้ Price Shock
  const discountPercent = ((product.original_price - product.price) / product.original_price) * 100
  if (discountPercent > 40) return 'price_shock'
  
  // 4. กรณีทั่วไป ให้ใช้ความลับหรือ How-to
  return 'secret_tip'
}
