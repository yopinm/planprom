// SEO Keyword Strategy — TASK 3.5
//
// Single source of truth for couponkum.com keyword clusters.
// Used by:
//   TASK 3.6 — Landing Page SEO Architecture  (URL structure + page types)
//   TASK 3.7 — Programmatic SEO               (generator logic + content model)
//
// Strategy: ยึดทั้ง Thai + English variants เพื่อ capture mixed-language queries
// ที่ users ไทยใช้จริง (เช่น "shopee คูปอง", "lazada coupon code")

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type KeywordIntent =
  | 'transactional'   // ตั้งใจซื้อ / ตั้งใจใช้คูปอง
  | 'informational'   // ค้นหาข้อมูล ราคา เปรียบเทียบ
  | 'navigational'    // หาเว็บ / แบรนด์โดยตรง

export type KeywordTier = 1 | 2 | 3
// Tier 1 = volume สูง + intent ชัด (ปิด conversion ง่าย)
// Tier 2 = volume กลาง + category/platform specific
// Tier 3 = volume ต่ำ แต่ long-tail + conversion สูง

export type KeywordVolume = 'high' | 'medium' | 'low'

export type SeoPlatform = 'shopee' | 'lazada' | 'both'

export interface KeywordCluster {
  id:                 string
  name:               string           // cluster label สำหรับ dev reference
  intent:             KeywordIntent
  tier:               KeywordTier
  volume:             KeywordVolume
  platform:           SeoPlatform
  category:           string | null    // product category หรือ null = ทุก category
  /** Brand name for brand-level pSEO pages (POSTLIVE-10). When set, page fetches
   *  by shop_name/product name instead of category. */
  brand?:             string
  keywords:           string[]         // primary keywords (Thai + English mix)
  targetUrlPattern:   string           // URL pattern สำหรับ TASK 3.6/3.7
  metaTitleTemplate:  string           // template สำหรับ <title>
  metaDescTemplate:   string           // template สำหรับ <description>
}

// ---------------------------------------------------------------------------
// Product Categories (ใช้ตรงกับ DB column `category`)
// ---------------------------------------------------------------------------

export const PRODUCT_CATEGORIES = [
  'มือถือ',
  'อิเล็กทรอนิกส์',
  'คอมพิวเตอร์และแล็ปท็อป',
  'กล้องและอุปกรณ์ถ่ายภาพ',
  'เสื้อผ้าและแฟชั่น',
  'ความงามและสกินแคร์',
  'อาหารและเครื่องดื่ม',
  'กีฬาและฟิตเนส',
  'บ้านและเครื่องใช้ไฟฟ้า',
  'ของเล่นและแม่และเด็ก',
] as const

export type ProductCategory = typeof PRODUCT_CATEGORIES[number]

// ---------------------------------------------------------------------------
// Keyword Clusters
// ---------------------------------------------------------------------------

export const KEYWORD_CLUSTERS: KeywordCluster[] = [

  // ── Tier 1: Brand + Coupon ────────────────────────────────────────────────

  {
    id:               'shopee-coupon',
    name:             'Shopee Coupon',
    intent:           'transactional',
    tier:             1,
    volume:           'high',
    platform:         'shopee',
    category:         null,
    keywords: [
      'shopee คูปอง',
      'โค้ดส่วนลด shopee',
      'คูปอง shopee วันนี้',
      'shopee coupon code',
      'shopee ส่วนลด',
      'shopee โค้ด',
      'รหัสส่วนลด shopee',
    ],
    targetUrlPattern:   '/coupon/shopee',
    metaTitleTemplate:  'คูปอง Shopee วันนี้ — ส่วนลดสูงสุด {pct}% | คูปองคุ้ม',
    metaDescTemplate:   'รวมโค้ดส่วนลด Shopee ล่าสุด ใช้ได้จริง อัปเดตทุกวัน ประหยัดสูงสุด {savings} บาท',
  },

  {
    id:               'lazada-coupon',
    name:             'Lazada Coupon',
    intent:           'transactional',
    tier:             1,
    volume:           'high',
    platform:         'lazada',
    category:         null,
    keywords: [
      'lazada คูปอง',
      'โค้ดส่วนลด lazada',
      'คูปอง lazada วันนี้',
      'lazada coupon code',
      'lazada ส่วนลด',
      'lazada โค้ด',
      'รหัสส่วนลด lazada',
    ],
    targetUrlPattern:   '/coupon/lazada',
    metaTitleTemplate:  'คูปอง Lazada วันนี้ — ส่วนลดสูงสุด {pct}% | คูปองคุ้ม',
    metaDescTemplate:   'รวมโค้ดส่วนลด Lazada ล่าสุด ใช้ได้จริง อัปเดตทุกวัน ประหยัดสูงสุด {savings} บาท',
  },

  {
    id:               'net-price-comparison',
    name:             'Net Price Comparison',
    intent:           'informational',
    tier:             1,
    volume:           'high',
    platform:         'both',
    category:         null,
    keywords: [
      'เปรียบราคา shopee lazada',
      'ราคาจริงหลังหักคูปอง',
      'ราคาสุทธิ shopee',
      'ราคาสุทธิ lazada',
      'ซื้อที่ไหนถูกกว่า shopee lazada',
      'เปรียบราคาออนไลน์',
      'คูปองประหยัดสูงสุด',
    ],
    targetUrlPattern:   '/compare',
    metaTitleTemplate:  'เปรียบราคา Shopee vs Lazada — หาที่ถูกสุดอัตโนมัติ | คูปองคุ้ม',
    metaDescTemplate:   'เปรียบราคาจาก Shopee และ Lazada พร้อมหักคูปองให้อัตโนมัติ รู้ทันทีว่าซื้อที่ไหนถูกกว่า',
  },

  // ── Tier 2: Category + Platform ──────────────────────────────────────────

  {
    id:               'phone-shopee',
    name:             'Phones on Shopee',
    intent:           'transactional',
    tier:             2,
    volume:           'high',
    platform:         'shopee',
    category:         'มือถือ',
    keywords: [
      'มือถือ shopee ราคาถูก',
      'มือถือ shopee คูปอง',
      'สมาร์ทโฟน shopee ราคาดี',
      'โทรศัพท์มือถือ shopee ส่วนลด',
    ],
    targetUrlPattern:   '/deals/shopee/มือถือ',
    metaTitleTemplate:  'มือถือ Shopee ราคาถูก + คูปองส่วนลด | คูปองคุ้ม',
    metaDescTemplate:   'รวมมือถือ Shopee ราคาดีที่สุด พร้อมคูปองส่วนลดที่ใช้ได้ทันที เปรียบราคาอัตโนมัติ',
  },

  {
    id:               'phone-lazada',
    name:             'Phones on Lazada',
    intent:           'transactional',
    tier:             2,
    volume:           'high',
    platform:         'lazada',
    category:         'มือถือ',
    keywords: [
      'มือถือ lazada ราคาถูก',
      'มือถือ lazada คูปอง',
      'สมาร์ทโฟน lazada ราคาดี',
      'โทรศัพท์มือถือ lazada ส่วนลด',
    ],
    targetUrlPattern:   '/deals/lazada/มือถือ',
    metaTitleTemplate:  'มือถือ Lazada ราคาถูก + คูปองส่วนลด | คูปองคุ้ม',
    metaDescTemplate:   'รวมมือถือ Lazada ราคาดีที่สุด พร้อมคูปองส่วนลดที่ใช้ได้ทันที เปรียบราคาอัตโนมัติ',
  },

  {
    id:               'laptop-deals',
    name:             'Laptop Deals',
    intent:           'transactional',
    tier:             2,
    volume:           'medium',
    platform:         'both',
    category:         'คอมพิวเตอร์และแล็ปท็อป',
    keywords: [
      'laptop ราคาถูก shopee',
      'แล็ปท็อป lazada คูปอง',
      'notebook ราคาดี',
      'laptop shopee lazada เปรียบราคา',
    ],
    targetUrlPattern:   '/deals/both/คอมพิวเตอร์และแล็ปท็อป',
    metaTitleTemplate:  'แล็ปท็อปราคาดี Shopee & Lazada + คูปองส่วนลด | คูปองคุ้ม',
    metaDescTemplate:   'เปรียบราคาแล็ปท็อปจาก Shopee และ Lazada พร้อมหักคูปองอัตโนมัติ',
  },

  {
    id:               'beauty-deals',
    name:             'Beauty & Skincare Deals',
    intent:           'transactional',
    tier:             2,
    volume:           'medium',
    platform:         'both',
    category:         'ความงามและสกินแคร์',
    keywords: [
      'ครีมบำรุง shopee ราคาถูก',
      'สกินแคร์ lazada คูปอง',
      'ความงาม shopee ส่วนลด',
      'เครื่องสำอาง lazada ราคาดี',
    ],
    targetUrlPattern:   '/deals/both/ความงามและสกินแคร์',
    metaTitleTemplate:  'สกินแคร์ & ความงาม ราคาดี + คูปองส่วนลด | คูปองคุ้ม',
    metaDescTemplate:   'รวมดีลครีมและสกินแคร์จาก Shopee และ Lazada พร้อมคูปองส่วนลดล่าสุด',
  },

  // ── Tier 3: Budget + Long-tail ────────────────────────────────────────────

  {
    id:               'budget-phone',
    name:             'Budget Phone Search',
    intent:           'informational',
    tier:             3,
    volume:           'medium',
    platform:         'both',
    category:         'มือถือ',
    keywords: [
      'มือถือ งบ 3000',
      'มือถือ งบ 5000',
      'มือถือ งบ 8000',
      'สมาร์ทโฟนราคาไม่เกิน 5000',
      'มือถือดี ราคาถูก 2024',
    ],
    targetUrlPattern:   '/search?q=มือถือ&budget={budget}',
    metaTitleTemplate:  'มือถือ งบ {budget} บาท ที่คุ้มที่สุด | คูปองคุ้ม',
    metaDescTemplate:   'หามือถือในงบ {budget} บาทที่คุ้มสุด เปรียบราคาจาก Shopee และ Lazada พร้อมหักคูปองอัตโนมัติ',
  },

  {
    id:               'budget-laptop',
    name:             'Budget Laptop Search',
    intent:           'informational',
    tier:             3,
    volume:           'medium',
    platform:         'both',
    category:         'คอมพิวเตอร์และแล็ปท็อป',
    keywords: [
      'laptop งบ 10000',
      'laptop งบ 15000',
      'แล็ปท็อป ราคาไม่เกิน 15000',
      'notebook ราคาถูก งบน้อย',
    ],
    targetUrlPattern:   '/search?q=laptop&budget={budget}',
    metaTitleTemplate:  'แล็ปท็อป งบ {budget} บาท ที่คุ้มที่สุด | คูปองคุ้ม',
    metaDescTemplate:   'หาแล็ปท็อปในงบ {budget} บาทที่คุ้มสุด เปรียบราคาจาก Shopee และ Lazada',
  },

  {
    id:               'payday-deals',
    name:             'Payday Deals',
    intent:           'transactional',
    tier:             3,
    volume:           'medium',
    platform:         'both',
    category:         null,
    keywords: [
      'ดีลวันเงินเดือนออก',
      'shopee payday ส่วนลด',
      'lazada payday คูปอง',
      'โปรโมชั่นสิ้นเดือน',
      'คูปอง 30 ของเดือน',
    ],
    targetUrlPattern:   '/deals/payday',
    metaTitleTemplate:  'ดีลวันเงินเดือนออก — Shopee & Lazada | คูปองคุ้ม',
    metaDescTemplate:   'รวมโปรโมชั่นและคูปองส่วนลดช่วงสิ้นเดือน จาก Shopee และ Lazada',
  },

  // ── Brand-level pSEO (POSTLIVE-10) ───────────────────────────────────────

  {
    id:               'apple-shopee',
    name:             'Apple on Shopee',
    intent:           'transactional',
    tier:             2,
    volume:           'high',
    platform:         'shopee',
    category:         'มือถือ',
    brand:            'Apple',
    keywords: [
      'apple shopee',
      'iphone shopee ราคา',
      'iphone shopee คูปอง',
      'apple สินค้า shopee',
      'iphone ราคาถูก shopee',
    ],
    targetUrlPattern:   '/deals/shopee/apple',
    metaTitleTemplate:  'สินค้า Apple บน Shopee — iPhone ราคาดี + คูปองส่วนลด | คูปองคุ้ม',
    metaDescTemplate:   'รวมสินค้า Apple จาก Shopee ราคาล่าสุด พร้อมคูปองส่วนลดที่ใช้ได้ทันที',
  },

  {
    id:               'samsung-shopee',
    name:             'Samsung on Shopee',
    intent:           'transactional',
    tier:             2,
    volume:           'high',
    platform:         'shopee',
    category:         'มือถือ',
    brand:            'Samsung',
    keywords: [
      'samsung shopee',
      'samsung galaxy shopee ราคา',
      'samsung shopee คูปอง',
      'samsung มือถือ shopee',
      'galaxy shopee ส่วนลด',
    ],
    targetUrlPattern:   '/deals/shopee/samsung',
    metaTitleTemplate:  'สินค้า Samsung บน Shopee — Galaxy ราคาดี + คูปองส่วนลด | คูปองคุ้ม',
    metaDescTemplate:   'รวมสินค้า Samsung จาก Shopee ราคาล่าสุด พร้อมคูปองส่วนลดที่ใช้ได้ทันที',
  },

  {
    id:               'xiaomi-shopee',
    name:             'Xiaomi on Shopee',
    intent:           'transactional',
    tier:             2,
    volume:           'medium',
    platform:         'shopee',
    category:         'มือถือ',
    brand:            'Xiaomi',
    keywords: [
      'xiaomi shopee',
      'xiaomi shopee ราคา',
      'xiaomi shopee คูปอง',
      'redmi shopee ราคา',
      'xiaomi มือถือ shopee ถูก',
    ],
    targetUrlPattern:   '/deals/shopee/xiaomi',
    metaTitleTemplate:  'สินค้า Xiaomi บน Shopee — Redmi ราคาดี + คูปองส่วนลด | คูปองคุ้ม',
    metaDescTemplate:   'รวมสินค้า Xiaomi & Redmi จาก Shopee ราคาล่าสุด พร้อมคูปองส่วนลดที่ใช้ได้ทันที',
  },

  {
    id:               'apple-lazada',
    name:             'Apple on Lazada',
    intent:           'transactional',
    tier:             2,
    volume:           'high',
    platform:         'lazada',
    category:         'มือถือ',
    brand:            'Apple',
    keywords: [
      'apple lazada',
      'iphone lazada ราคา',
      'iphone lazada คูปอง',
      'apple สินค้า lazada',
      'iphone ราคาถูก lazada',
    ],
    targetUrlPattern:   '/deals/lazada/apple',
    metaTitleTemplate:  'สินค้า Apple บน Lazada — iPhone ราคาดี + คูปองส่วนลด | คูปองคุ้ม',
    metaDescTemplate:   'รวมสินค้า Apple จาก Lazada ราคาล่าสุด พร้อมคูปองส่วนลดที่ใช้ได้ทันที',
  },

  {
    id:               'samsung-lazada',
    name:             'Samsung on Lazada',
    intent:           'transactional',
    tier:             2,
    volume:           'high',
    platform:         'lazada',
    category:         'มือถือ',
    brand:            'Samsung',
    keywords: [
      'samsung lazada',
      'samsung galaxy lazada ราคา',
      'samsung lazada คูปอง',
      'samsung มือถือ lazada',
      'galaxy lazada ส่วนลด',
    ],
    targetUrlPattern:   '/deals/lazada/samsung',
    metaTitleTemplate:  'สินค้า Samsung บน Lazada — Galaxy ราคาดี + คูปองส่วนลด | คูปองคุ้ม',
    metaDescTemplate:   'รวมสินค้า Samsung จาก Lazada ราคาล่าสุด พร้อมคูปองส่วนลดที่ใช้ได้ทันที',
  },
]

// ---------------------------------------------------------------------------
// Lookup helpers (used by TASK 3.6 and 3.7)
// ---------------------------------------------------------------------------

/** All Tier-1 clusters — highest priority landing pages */
export const TIER1_CLUSTERS = KEYWORD_CLUSTERS.filter(c => c.tier === 1)

/** Clusters by platform */
export function getClustersByPlatform(platform: SeoPlatform): KeywordCluster[] {
  return KEYWORD_CLUSTERS.filter(c => c.platform === platform || c.platform === 'both')
}

/** Clusters by category */
export function getClustersByCategory(category: string): KeywordCluster[] {
  return KEYWORD_CLUSTERS.filter(c => c.category === category || c.category === null)
}

/** Cluster by ID — throws if not found (prevents silent drift) */
export function getCluster(id: string): KeywordCluster {
  const cluster = KEYWORD_CLUSTERS.find(c => c.id === id)
  if (!cluster) throw new Error(`Keyword cluster not found: ${id}`)
  return cluster
}

/** All unique target URL patterns (used to generate landing pages in TASK 3.6) */
export const TARGET_URL_PATTERNS = [...new Set(KEYWORD_CLUSTERS.map(c => c.targetUrlPattern))]
