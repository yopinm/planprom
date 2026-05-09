// Programmatic SEO Generator — TASK 3.7
//
// Content model + generator for all 5 SEO page types.
// Pure functions — no DB, no side effects — safe to call at build time.
//
// 5 Page Types:
//   1. platform_coupon  — /coupon/[platform]
//   2. category_deals   — /deals/[platform]/[category]
//   3. comparison       — /compare
//   4. product_detail   — /product/[slug]
//   5. campaign         — /deals/payday
//
// Each generator returns: { h1, intro, faqs, relatedLinks }
// FAQs are schema.org/FAQPage compatible (question + answer pairs).

import { KEYWORD_CLUSTERS, PRODUCT_CATEGORIES, type KeywordCluster } from '@/lib/seo-keywords'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FaqItem {
  question: string
  answer:   string
}

export interface PseoContent {
  h1:           string
  intro:        string
  faqs:         FaqItem[]
  relatedLinks: Array<{ label: string; href: string }>
}

export type PseoPageType =
  | 'platform_coupon'
  | 'category_deals'
  | 'comparison'
  | 'product_detail'
  | 'campaign'

// ---------------------------------------------------------------------------
// Static params for generateStaticParams() in Next.js
// ---------------------------------------------------------------------------

/** /coupon/[platform] */
export const COUPON_STATIC_PARAMS = [
  { platform: 'shopee' },
  { platform: 'lazada' },
]

/** /deals/[platform]/[category] — full platform × category matrix */
export const DEALS_STATIC_PARAMS: Array<{ platform: string; category: string }> =
  (['shopee', 'lazada'] as const).flatMap(platform =>
    PRODUCT_CATEGORIES.map(category => ({ platform, category })),
  )

/** /deals/[platform]/[brand-slug] — brand-level pSEO pages (POSTLIVE-10) */
export const BRAND_STATIC_PARAMS: Array<{ platform: string; category: string }> =
  KEYWORD_CLUSTERS
    .filter(c => c.brand != null)
    .map(c => {
      const parts = c.targetUrlPattern.split('/')
      return { platform: parts[2], category: parts[3] }
    })

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

const PLATFORM_TH: Record<string, string> = {
  shopee: 'Shopee',
  lazada: 'Lazada',
  both:   'Shopee และ Lazada',
}

function platformTh(p: string): string {
  return PLATFORM_TH[p] ?? p
}

function clusterForDeals(platform: string, category: string): KeywordCluster | undefined {
  const path = `/deals/${platform}/${category}`
  return KEYWORD_CLUSTERS.find(c => c.targetUrlPattern === path)
}

// ---------------------------------------------------------------------------
// Generator: platform_coupon
// ---------------------------------------------------------------------------

export function generatePlatformCouponContent(platform: string): PseoContent {
  const platTh  = platformTh(platform)
  const rival   = platform === 'shopee' ? 'Lazada' : 'Shopee'
  const rivalSlug = rival.toLowerCase()

  return {
    h1: `คูปอง ${platTh} วันนี้ — โค้ดส่วนลดล่าสุดที่ใช้ได้จริง`,
    intro: `รวมโค้ดส่วนลด ${platTh} ทุกประเภท ทั้ง Platform Voucher, Shop Voucher, โค้ดส่งฟรี และโปรโมชั่นธนาคาร
อัปเดตทุกวัน คำนวณโค้ดซ้อนกันให้อัตโนมัติ เพื่อให้คุณจ่ายน้อยที่สุดในทุกออเดอร์`,
    faqs: [
      {
        question: `คูปอง ${platTh} วันนี้มีอะไรบ้าง?`,
        answer: `คูปอง ${platTh} มี 4 ประเภทหลัก ได้แก่ Platform Voucher (ส่วนลดทั้งแพลตฟอร์ม), Shop Voucher (ส่วนลดร้านค้า), โค้ดส่งฟรี และโปรโมชั่นธนาคาร ระบบคูปองคุ้มจะหักให้อัตโนมัติเพื่อให้คุณได้ราคาต่ำสุด`,
      },
      {
        question: `ใช้คูปอง ${platTh} ซ้อนกันได้ไหม?`,
        answer: `ได้ในหลายกรณี ${platTh} อนุญาตให้ใช้ Platform Voucher + Shop Voucher + โค้ดส่งฟรี พร้อมกันในออเดอร์เดียว ระบบคูปองคุ้มจะคำนวณชุดโค้ดที่ประหยัดสูงสุดให้คุณทันที`,
      },
      {
        question: `${platTh} กับ ${rival} แพลตฟอร์มไหนถูกกว่า?`,
        answer: `ขึ้นอยู่กับสินค้าและโปรโมชั่นในช่วงนั้น บางครั้ง ${platTh} ถูกกว่า บางครั้ง ${rival} ถูกกว่า ใช้คูปองคุ้มเปรียบราคาอัตโนมัติที่ /compare เพื่อรู้คำตอบในทุกการค้นหา`,
      },
      {
        question: `คูปอง ${platTh} หมดอายุเมื่อไหร่?`,
        answer: `คูปอง ${platTh} มีอายุแตกต่างกัน ตั้งแต่ 1 วันถึงหลายสัปดาห์ ระบบคูปองคุ้มแสดงสถานะหมดอายุให้เห็นชัดเจน และแจ้งเตือนเมื่อคูปองใกล้หมด`,
      },
    ],
    relatedLinks: [
      { label: `คูปอง ${rival}`,              href: `/coupon/${rivalSlug}` },
      { label: 'เปรียบราคา Shopee vs Lazada', href: '/compare' },
      { label: 'ดีลมือถือ',                   href: `/deals/${platform}/มือถือ` },
    ],
  }
}

// ---------------------------------------------------------------------------
// Generator: category_deals
// ---------------------------------------------------------------------------

export function generateCategoryDealsContent(platform: string, category: string): PseoContent {
  const platTh    = platformTh(platform)
  const cluster   = clusterForDeals(platform, category)
  const topKeyword = cluster?.keywords[0] ?? `${category} ${platTh}`

  return {
    h1: `${category} ราคาถูกสุด + คูปองส่วนลด จาก ${platTh}`,
    intro: `เปรียบราคา ${category} จาก ${platTh} พร้อมหักคูปองให้อัตโนมัติ
ระบบแสดงราคาสุทธิจริงหลังหักส่วนลดทุกชั้น เพื่อให้คุณตัดสินใจได้ทันทีโดยไม่ต้องคำนวณเอง`,
    faqs: [
      {
        question: `${category} ที่ไหนถูกกว่า — Shopee หรือ Lazada?`,
        answer: `ราคา ${category} แตกต่างกันตามช่วงเวลาและโปรโมชั่น ใช้คูปองคุ้มค้นหา "${topKeyword}" เพื่อดูราคาสุทธิจากทั้ง 2 แพลตฟอร์มแบบ real-time`,
      },
      {
        question: `มีคูปองสำหรับ ${category} ไหม?`,
        answer: `มี คูปอง ${category} มักได้แก่ Platform Voucher ส่วนลด % ของ ${platTh}, Shop Voucher จากร้านค้าเฉพาะ และโปรธนาคารเพิ่มเติม ระบบคูปองคุ้มจะเลือกชุดที่คุ้มสุดให้อัตโนมัติ`,
      },
      {
        question: `ช่วงไหนซื้อ ${category} คุ้มสุด?`,
        answer: `ช่วงแคมเปญ 11.11, 12.12, Payday (25-28 ของเดือน), Double Date (1.1, 2.2 ฯลฯ) มักมีส่วนลดสูงสุด ระบบจะแสดงป้าย "คูปองหมดเร็ว" เมื่อโปรใกล้สิ้นสุด`,
      },
    ],
    relatedLinks: [
      { label: `คูปอง ${platTh === 'Shopee' ? 'Shopee' : 'Lazada'}`, href: `/coupon/${platform === 'both' ? 'shopee' : platform}` },
      { label: 'เปรียบราคา Shopee vs Lazada', href: '/compare' },
      ...PRODUCT_CATEGORIES
        .filter(c => c !== category)
        .slice(0, 2)
        .map(c => ({ label: `ดีล ${c}`, href: `/deals/both/${c}` })),
    ],
  }
}

// ---------------------------------------------------------------------------
// Generator: brand_deals (POSTLIVE-10)
// ---------------------------------------------------------------------------

export function generateBrandDealsContent(platform: string, brandName: string): PseoContent {
  const platTh = platformTh(platform)
  const rival  = platform === 'shopee' ? 'Lazada' : 'Shopee'

  return {
    h1: `สินค้า ${brandName} บน ${platTh} — ราคาดีสุด + คูปองส่วนลด`,
    intro: `รวมสินค้า ${brandName} จาก ${platTh} พร้อมคูปองส่วนลดที่ใช้ได้จริง
ระบบหักคูปองทุกชั้นให้อัตโนมัติ เพื่อให้คุณเห็นราคาสุทธิที่ถูกสุดก่อนตัดสินใจซื้อ`,
    faqs: [
      {
        question: `สินค้า ${brandName} บน ${platTh} ราคาเท่าไหร่?`,
        answer: `ราคาสินค้า ${brandName} บน ${platTh} แตกต่างกันตามรุ่นและช่วงเวลา ดูราคาสุทธิล่าสุดพร้อมคูปองที่คุ้มสุดได้ในหน้านี้ ระบบอัปเดตทุกวัน`,
      },
      {
        question: `มีคูปองสำหรับสินค้า ${brandName} บน ${platTh} ไหม?`,
        answer: `มี คูปองสำหรับ ${brandName} ${platTh} มีทั้ง Platform Voucher, Shop Voucher ร้านค้า Official และโปรโมชั่นธนาคาร ระบบคูปองคุ้มจะเลือกชุดที่คุ้มสุดให้อัตโนมัติ`,
      },
      {
        question: `${brandName} ${platTh} หรือ ${rival} ถูกกว่า?`,
        answer: `ขึ้นอยู่กับรุ่นสินค้าและโปรโมชั่นในช่วงนั้น ใช้คูปองคุ้มค้นหา "${brandName}" แล้วกรองตามแพลตฟอร์ม เพื่อดูราคาสุทธิเปรียบเทียบได้ทันที`,
      },
      {
        question: `ช่วงไหนซื้อ ${brandName} คุ้มสุด?`,
        answer: `ช่วงแคมเปญ 11.11, 12.12, Payday (25–30 ของเดือน) และ Double Date มักมีส่วนลดสูงสุดสำหรับสินค้าแบรนด์ดัง คูปองคุ้มจะแจ้งเตือนเมื่อพบดีลพิเศษ`,
      },
    ],
    relatedLinks: [
      { label: `คูปอง ${platTh}`,               href: `/coupon/${platform}` },
      { label: `สินค้า ${brandName} ทั้งหมด`,   href: `/search?q=${encodeURIComponent(brandName)}` },
      { label: `${brandName} บน ${rival}`,       href: `/deals/${rival.toLowerCase()}/${brandName.toLowerCase()}` },
      { label: 'เปรียบราคา Shopee vs Lazada',   href: '/compare' },
    ],
  }
}

// ---------------------------------------------------------------------------
// Generator: comparison
// ---------------------------------------------------------------------------

export function generateComparisonContent(): PseoContent {
  return {
    h1: 'เปรียบราคา Shopee vs Lazada — หาที่ถูกสุดก่อนซื้อทุกครั้ง',
    intro: `คูปองคุ้มเปรียบราคาจาก Shopee และ Lazada พร้อมหักคูปองทุกชั้นให้อัตโนมัติ
คุณเห็นราคาสุทธิจริงทั้ง 2 แพลตฟอร์มแบบ side-by-side ไม่ต้องเปิดหลายแท็บ`,
    faqs: [
      {
        question: 'Shopee หรือ Lazada ถูกกว่า?',
        answer: 'ไม่มีคำตอบตายตัว ราคาแตกต่างกันตามสินค้า ร้านค้า และโปรโมชั่นในช่วงนั้น ใช้คูปองคุ้มค้นหาสินค้าที่ต้องการเพื่อดูเปรียบเทียบราคาสุทธิแบบ real-time',
      },
      {
        question: 'คูปองซ้อนกันได้กี่ชั้น?',
        answer: 'โดยทั่วไปสูงสุด 4 ชั้น คือ Platform Voucher + Shop Voucher + โค้ดส่งฟรี + โปรธนาคาร ระบบคูปองคุ้มคำนวณชุดที่ประหยัดสูงสุดให้อัตโนมัติ',
      },
      {
        question: 'คูปองคุ้มคิดราคาสุทธิยังไง?',
        answer: 'ระบบใช้ Combination Solver ทดสอบทุกชุดโค้ดที่ใช้ร่วมกันได้ แล้วเลือกชุดที่ทำให้ราคาสุทธิต่ำสุด รวมค่าส่ง แคชแบ็ก และเงื่อนไขขั้นต่ำทุกข้อ',
      },
      {
        question: 'ราคาที่แสดงอัปเดตบ่อยแค่ไหน?',
        answer: 'ราคาหลักอัปเดตทุกวัน คูปองใหม่เพิ่มทุกวัน และระบบจะแจ้งเตือนเมื่อราคาลดหรือคูปองใกล้หมด',
      },
    ],
    relatedLinks: [
      { label: 'คูปอง Shopee', href: '/coupon/shopee' },
      { label: 'คูปอง Lazada', href: '/coupon/lazada' },
      { label: 'ดีลมือถือ',    href: '/deals/both/มือถือ' },
    ],
  }
}

// ---------------------------------------------------------------------------
// Generator: product_detail
// ---------------------------------------------------------------------------

export function generateProductDetailContent(productName: string, platform: string): PseoContent {
  const platTh = platformTh(platform)

  return {
    h1: `${productName} ราคาดีที่สุด + คูปองส่วนลด`,
    intro: `เปรียบราคา ${productName} จาก ${platTh} พร้อมคูปองส่วนลดที่ใช้ได้จริง
ระบบคำนวณราคาสุทธิหลังหักโค้ดทุกชั้นให้อัตโนมัติ`,
    faqs: [
      {
        question: `${productName} ราคาเท่าไหร่?`,
        answer: `ราคา ${productName} แตกต่างกันตามร้านค้าและโปรโมชั่น ดูราคาสุทธิล่าสุดพร้อมคูปองที่คุ้มสุดได้ในหน้านี้`,
      },
      {
        question: `มีคูปองสำหรับ ${productName} ไหม?`,
        answer: `ใช่ ระบบคูปองคุ้มจะดึงคูปองที่ใช้ได้กับ ${productName} โดยอัตโนมัติ รวมถึง Platform Voucher, Shop Voucher และโปรโมชั่นธนาคาร`,
      },
    ],
    relatedLinks: [
      { label: `คูปอง ${platTh}`, href: `/coupon/${platform}` },
      { label: 'เปรียบราคา',      href: '/compare' },
    ],
  }
}

// ---------------------------------------------------------------------------
// Generator: campaign (payday)
// ---------------------------------------------------------------------------

export function generateCampaignContent(campaignType: 'payday' | 'double_date' = 'payday'): PseoContent {
  const isPayday = campaignType === 'payday'
  const label    = isPayday ? 'วันเงินเดือนออก' : 'Double Date'
  const desc     = isPayday
    ? 'ช่วงสิ้นเดือน (25–30) ทั้ง Shopee และ Lazada มักปล่อยโปรโมชั่นพิเศษ'
    : 'วันที่วันซ้ำเดือน เช่น 1.1, 2.2, 3.3 แพลตฟอร์มมักจัดดีลใหญ่'

  return {
    h1: `ดีล${label} — รวมโปรโมชั่น Shopee & Lazada คุ้มสุด`,
    intro: `${desc} ระบบคูปองคุ้มรวบรวมดีลที่คุ้มสุดในแต่ละช่วง
พร้อมคำนวณโค้ดซ้อนให้อัตโนมัติ เพื่อให้คุณไม่พลาดส่วนลดสูงสุด`,
    faqs: [
      {
        question: `${label} Shopee และ Lazada มีอะไรพิเศษ?`,
        answer: `${label} มักมี Flash Sale ราคาพิเศษ, แจก Voucher เพิ่ม, โปรธนาคาร cashback สูงกว่าปกติ และ Free Shipping เงื่อนไขผ่อนปรน`,
      },
      {
        question: `ควรเตรียมตัวอย่างไรก่อน${label}?`,
        answer: `เพิ่มสินค้าลงตะกร้าล่วงหน้า รวบรวมคูปองให้ครบ และเช็กราคาสุทธิก่อนกดซื้อ คูปองคุ้มจะแสดงราคาสุทธิหลังหักทุกโค้ดให้ทันที`,
      },
      {
        question: 'ราคา Flash Sale คุ้มจริงไหม?',
        answer: 'บางครั้งคุ้ม บางครั้งราคาปกติพร้อมคูปองซ้อนอาจถูกกว่า ใช้คูปองคุ้มเปรียบให้ชัวร์ก่อนกดซื้อทุกครั้ง',
      },
    ],
    relatedLinks: [
      { label: 'คูปอง Shopee', href: '/coupon/shopee' },
      { label: 'คูปอง Lazada', href: '/coupon/lazada' },
      { label: 'เปรียบราคา',   href: '/compare' },
    ],
  }
}

// ---------------------------------------------------------------------------
// DIST-02: Sub-page static params + generators
// ---------------------------------------------------------------------------

/** English slug → Thai category (for /coupon/[platform]/[slug] category sub-pages) */
export const CATEGORY_SLUG_MAP: Record<string, string> = {
  'beauty':  'ความงามและสกินแคร์',
  'fashion': 'เสื้อผ้าและแฟชั่น',
  'mobile':  'มือถือ',
  'tech':    'อิเล็กทรอนิกส์',
  'home':    'บ้านและเครื่องใช้ไฟฟ้า',
}

const MONTH_EN_TH: Record<string, string> = {
  january: 'มกราคม', february: 'กุมภาพันธ์', march: 'มีนาคม',
  april: 'เมษายน', may: 'พฤษภาคม', june: 'มิถุนายน',
  july: 'กรกฎาคม', august: 'สิงหาคม', september: 'กันยายน',
  october: 'ตุลาคม', november: 'พฤศจิกายน', december: 'ธันวาคม',
}

/** Parse 'payday-may-2026' → { monthTh, year } or null */
export function parsePaydaySlug(slug: string): { monthTh: string; year: string } | null {
  const m = slug.match(/^payday-([a-z]+)-(\d{4})$/)
  if (!m) return null
  const monthTh = MONTH_EN_TH[m[1]]
  if (!monthTh) return null
  return { monthTh, year: m[2] }
}

/** /coupon/[platform]/[slug] — 6 payday + 10 category coupon sub-pages */
export const COUPON_SUBPAGE_STATIC_PARAMS: Array<{ platform: string; slug: string }> = [
  ...(['shopee', 'lazada'] as const).flatMap(platform =>
    ['payday-may-2026', 'payday-june-2026', 'payday-july-2026'].map(slug => ({ platform, slug }))
  ),
  ...(['shopee', 'lazada'] as const).flatMap(platform =>
    Object.keys(CATEGORY_SLUG_MAP).map(slug => ({ platform, slug }))
  ),
]

/** /compare/shopee-vs-lazada/[category] — one per product category */
export const COMPARE_CATEGORY_STATIC_PARAMS: Array<{ category: string }> =
  PRODUCT_CATEGORIES.map(category => ({ category }))

export function generatePaydayCouponContent(platform: string, monthTh: string, year: string): PseoContent {
  const platTh = platformTh(platform)
  const rival  = platform === 'shopee' ? 'Lazada' : 'Shopee'
  return {
    h1:    `คูปอง ${platTh} Payday ${monthTh} ${year} — โปรสิ้นเดือนใช้ได้จริง`,
    intro: `รวมโค้ดส่วนลด ${platTh} ช่วงวันเงินเดือนออก ${monthTh} ${year}
ทั้ง Platform Voucher, Shop Voucher และโปรธนาคาร คำนวณซ้อนให้อัตโนมัติ`,
    faqs: [
      {
        question: `${platTh} Payday ${monthTh} มีส่วนลดอะไรบ้าง?`,
        answer:   `Payday ${platTh} มักมี Platform Voucher พิเศษ, Flash Sale 30–70%, โปรธนาคาร cashback เพิ่ม และโค้ดส่งฟรีเงื่อนไขพิเศษ คูปองคุ้มรวบรวมทุกโค้ดและคำนวณชุดที่คุ้มสุดให้`,
      },
      {
        question: `ควรซื้ออะไรช่วง ${platTh} Payday?`,
        answer:   `สินค้าราคาสูงที่ได้ส่วนลดมากที่สุด เช่น มือถือ แล็ปท็อป เครื่องใช้ไฟฟ้า และสกินแคร์แบรนด์ดัง ใช้คูปองคุ้มเปรียบราคาก่อนซื้อทุกครั้ง`,
      },
      {
        question: `คูปอง Payday ${platTh} ซ้อนกับโค้ดอื่นได้ไหม?`,
        answer:   `ได้ สามารถซ้อน Platform Voucher + Shop Voucher + โค้ดส่งฟรี + โปรธนาคาร ในออเดอร์เดียว ระบบคูปองคุ้มเลือกชุดที่ประหยัดสูงสุดให้อัตโนมัติ`,
      },
    ],
    relatedLinks: [
      { label: `คูปอง ${platTh} ทั้งหมด`,         href: `/coupon/${platform}` },
      { label: `คูปอง ${rival}`,                   href: `/coupon/${rival.toLowerCase()}` },
      { label: 'ดีลวันเงินเดือนออก',               href: '/deals/payday' },
      { label: 'เปรียบราคา Shopee vs Lazada',      href: '/compare' },
    ],
  }
}

export function generateCategoryCouponSubPageContent(platform: string, category: string): PseoContent {
  const platTh = platformTh(platform)
  return {
    h1:    `คูปอง ${category} ${platTh} — โค้ดส่วนลดล่าสุด`,
    intro: `รวมโค้ดส่วนลดสำหรับ ${category} จาก ${platTh} โดยเฉพาะ อัปเดตทุกวัน
ระบบคำนวณราคาสุทธิหลังหักโค้ดทุกชั้น Platform Voucher, Shop Voucher, โค้ดส่งฟรี`,
    faqs: [
      {
        question: `คูปอง ${category} ${platTh} มีอะไรบ้าง?`,
        answer:   `คูปอง ${category} ${platTh} มีทั้ง Platform Voucher ส่วนลด % เฉพาะหมวด ${category}, Shop Voucher จากร้าน Official Store และโปรโมชั่นธนาคาร ระบบคูปองคุ้มเลือกชุดที่คุ้มสุดให้อัตโนมัติ`,
      },
      {
        question: `${category} ${platTh} ราคาสุทธิเท่าไหร่?`,
        answer:   `ราคาสุทธิ ${category} ขึ้นอยู่กับโปรโมชั่นในช่วงนั้น ดูราคาสุทธิล่าสุดพร้อมคูปองซ้อนได้ในหน้านี้ — ระบบคำนวณทุกชั้นให้อัตโนมัติ`,
      },
      {
        question: `ช่วงไหนซื้อ ${category} ถูกที่สุดใน ${platTh}?`,
        answer:   `ช่วง Payday (25–30 ของเดือน), Double Date (11.11, 12.12) และ Flash Sale รายวันมักมีส่วนลดสูงสุด คูปองคุ้มจะแสดงป้าย "ดีลเด็ด" เมื่อพบโปรที่คุ้มกว่าปกติ`,
      },
    ],
    relatedLinks: [
      { label: `คูปอง ${platTh} ทั้งหมด`,        href: `/coupon/${platform}` },
      { label: `ดีล ${category} ทั้งแพลตฟอร์ม`, href: `/deals/both/${category}` },
      { label: 'เปรียบราคา Shopee vs Lazada',    href: '/compare' },
    ],
  }
}

export function generateCategoryComparisonContent(category: string): PseoContent {
  return {
    h1:    `${category} Shopee vs Lazada — เปรียบราคาสุทธิพร้อมคูปอง`,
    intro: `เปรียบราคา ${category} จาก Shopee และ Lazada พร้อมหักคูปองทุกชั้นอัตโนมัติ
เห็นราคาสุทธิจริงทั้ง 2 แพลตฟอร์มแบบ side-by-side ไม่ต้องเปิดหลายแท็บ`,
    faqs: [
      {
        question: `${category} Shopee หรือ Lazada ถูกกว่า?`,
        answer:   `ไม่มีคำตอบตายตัว ราคา ${category} แตกต่างกันตามร้านค้าและโปรโมชั่น ใช้คูปองคุ้มค้นหา "${category}" เพื่อดูราคาสุทธิจากทั้ง 2 แพลตฟอร์มแบบ real-time`,
      },
      {
        question: `${category} มีคูปองส่วนลดจากไหนบ้าง?`,
        answer:   `คูปอง ${category} มีทั้งจาก Shopee และ Lazada ในรูปแบบ Platform Voucher, Shop Voucher, โค้ดส่งฟรี และโปรธนาคาร คูปองคุ้มคำนวณชุดที่คุ้มสุดจากทุกแหล่งให้อัตโนมัติ`,
      },
      {
        question: `ราคา ${category} อัปเดตบ่อยแค่ไหน?`,
        answer:   `ราคา ${category} ที่แสดงในหน้านี้อัปเดตทุกวัน คูปองใหม่เพิ่มทุกวัน และมีแจ้งเตือนเมื่อราคาลดหรือโปรพิเศษเริ่มต้น`,
      },
    ],
    relatedLinks: [
      { label: `ดีล ${category} Shopee`,          href: `/deals/shopee/${category}` },
      { label: `ดีล ${category} Lazada`,          href: `/deals/lazada/${category}` },
      { label: 'เปรียบราคา Shopee vs Lazada',     href: '/compare' },
    ],
  }
}

// ---------------------------------------------------------------------------
// FAQ JSON-LD builder (schema.org/FAQPage)
// ---------------------------------------------------------------------------

export function buildFaqJsonLd(faqs: FaqItem[]): object {
  return {
    '@context':   'https://schema.org',
    '@type':      'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type':          'Question',
      name:             faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text:    faq.answer,
      },
    })),
  }
}
