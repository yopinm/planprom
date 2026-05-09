// SHOP-PENDING-3: CSV bulk import utilities
// Pure functions — no Supabase dependency, fully testable.

import type { DataSource } from '@/types'
import { checkNetworkConsistency } from '@/lib/affiliate-url'

export const CSV_COLUMNS = [
  'name', 'url', 'affiliate_url', 'price_current',
  'price_original', 'image_url', 'category', 'shop_name', 'affiliate_network',
] as const

export const CSV_TEMPLATE_HEADER = CSV_COLUMNS.join(',')

export const CSV_TEMPLATE_EXAMPLE =
  'iPhone 15 Pro 256GB,https://shopee.co.th/product/123,https://invol.co/abc123,15900,17900,https://cf.shopee.co.th/file/img.jpg,Electronics,Apple Official Store,involve_asia'

export const ALLOWED_AFFILIATE_HOSTS_CSV = [
  'shopee.co.th', 'shope.ee', 'shp.ee',
  'invol.pe', 'invol.co', 'involve.asia',
  'accesstrade.in.th', 'c.accesstrade.in.th', 'atth.me',
  's.lazada.co.th', 'lazada.co.th',
]

export const NETWORK_TO_SOURCE_CSV: Record<string, DataSource> = {
  shopee_affiliate: 'shopee_affiliate',
  involve_asia:     'involve_asia',
  accesstrade:      'accesstrade',
  direct:           'manual',
}

export interface CsvRowResult {
  row: number
  name: string
  ok: boolean
  message: string
}

export interface ValidatedRow {
  platform_id?: string
  name: string
  url: string
  affiliate_url: string
  price_current: number
  price_original: number | null
  image_url: string | null
  category: string | null
  shop_name: string | null
  data_source: DataSource
}

/** RFC-4180-compatible CSV line parser — handles quoted fields with embedded commas. */
export function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      // escaped quote inside a quoted field
      if (inQuotes && line[i + 1] === '"') { field += '"'; i++ }
      else { inQuotes = !inQuotes }
    } else if (ch === ',' && !inQuotes) {
      fields.push(field.trim())
      field = ''
    } else {
      field += ch
    }
  }
  fields.push(field.trim())
  return fields
}

/** Full RFC-4180 document parser — handles newlines inside quoted fields (multi-line headers). */
function parseCSVFull(text: string): string[][] {
  const rows: string[][] = []
  let cols: string[] = []
  let field = ''
  let inQuotes = false

  const flush = () => { cols.push(field.trim()); field = '' }
  const endRow = () => {
    flush()
    if (cols.some(c => c)) rows.push(cols)
    cols = []
  }

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') { field += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      flush()
    } else if (ch === '\r' && !inQuotes) {
      if (text[i + 1] === '\n') i++
      endRow()
    } else if (ch === '\n' && !inQuotes) {
      endRow()
    } else {
      field += ch
    }
  }
  if (field || cols.length > 0) endRow()

  return rows
}

function isHttps(raw: string): boolean {
  try { return new URL(raw).protocol === 'https:' } catch { return false }
}

function isAllowedHostCsv(raw: string): boolean {
  try {
    const host = new URL(raw).hostname.replace(/^www\./, '')
    return ALLOWED_AFFILIATE_HOSTS_CSV.some(h => host === h || host.endsWith(`.${h}`))
  } catch {
    return false
  }
}

/** Validate one parsed CSV row. Returns either a ValidatedRow or an error message. */
export function validateCsvRow(
  cols: string[],
  rowNum: number,
): { ok: true; data: ValidatedRow } | { ok: false; result: CsvRowResult } {
  const [
    name = '', url = '', affiliateUrl = '', priceStr = '',
    origStr = '', imageUrl = '', category = '', shopName = '', network = 'direct',
  ] = cols

  const nameT         = name.trim()
  const urlT          = url.trim()
  const affiliateUrlT = affiliateUrl.trim()
  const label         = nameT || `แถว ${rowNum}`

  if (!nameT)                           return { ok: false, result: { row: rowNum, name: label, ok: false, message: 'ชื่อสินค้าว่างเปล่า' } }
  if (!urlT)                            return { ok: false, result: { row: rowNum, name: label, ok: false, message: 'URL สินค้าว่างเปล่า' } }
  if (!isHttps(urlT))                   return { ok: false, result: { row: rowNum, name: label, ok: false, message: 'URL สินค้าต้องเป็น https://' } }
  if (!affiliateUrlT)                   return { ok: false, result: { row: rowNum, name: label, ok: false, message: 'Affiliate URL ว่างเปล่า' } }
  if (!isHttps(affiliateUrlT))          return { ok: false, result: { row: rowNum, name: label, ok: false, message: 'Affiliate URL ต้องเป็น https://' } }
  if (!isAllowedHostCsv(affiliateUrlT)) return { ok: false, result: { row: rowNum, name: label, ok: false, message: `Affiliate URL ไม่ถูกต้อง: "${affiliateUrlT}"` } }

  // AFFNET-2.1: network must match affiliate_url domain — prevent silent 'manual' fallback
  const networkKey = network.trim() || 'direct'
  const networkErr = checkNetworkConsistency(networkKey, affiliateUrlT)
  if (networkErr) return { ok: false, result: { row: rowNum, name: label, ok: false, message: networkErr } }

  const price = parseFloat(priceStr.trim())
  if (isNaN(price) || price <= 0)    return { ok: false, result: { row: rowNum, name: label, ok: false, message: `ราคาไม่ถูกต้อง: "${priceStr.trim()}"` } }

  const origRaw       = origStr.trim()
  const priceOriginal = origRaw ? parseFloat(origRaw) : null
  const dataSource    = NETWORK_TO_SOURCE_CSV[networkKey] ?? 'manual'

  return {
    ok: true,
    data: {
      name:          nameT,
      url:           urlT,
      affiliate_url: affiliateUrlT,
      price_current: price,
      price_original: priceOriginal,
      image_url:     imageUrl.trim() || null,
      category:      category.trim() || null,
      shop_name:     shopName.trim() || null,
      data_source:   dataSource,
    },
  }
}

// Shopee Affiliate product CSV — Thai column headers.
// รหัสสินค้า,ชื่อสินค้า,ราคา,ขาย,ชื่อร้านค้า,อัตราค่าคอมมิชชัน,คอมมิชชัน,ลิงก์สินค้า,ลิงก์ข้อเสนอ
const SHOPEE_AFFILIATE_HEADER_MARKER = 'รหัสสินค้า'

// Shopee Brand/Shop offer CSV — header spans 2 raw lines due to quoted newline in col 1.
// ชื่อข้อเสนอ,"เริ่มต้น: ...\nสิ้นสุด: ...",อัตราค่าคอมมิชชัน,ลิงก์ข้อเสนอ,ลิงก์ร้านค้า(สั้น)
const SHOP_OFFER_HEADER_MARKER = 'ชื่อข้อเสนอ'

function validateShopeeAffiliateRow(
  cols: string[],
  rowNum: number,
  network: DataSource,
): { ok: true; data: ValidatedRow } | { ok: false; result: CsvRowResult } {
  const [platformIdRaw = '', nameRaw = '', priceRaw = '', , shopNameRaw = '', , , urlRaw = '', affiliateUrlRaw = ''] = cols

  const platformId   = platformIdRaw.trim()
  const name         = nameRaw.trim()
  const url          = urlRaw.trim()
  const affiliateUrl = affiliateUrlRaw.trim()
  const shopName     = shopNameRaw.trim() || null
  const label        = name || `แถว ${rowNum}`

  if (!name)                     return { ok: false, result: { row: rowNum, name: label, ok: false, message: 'ชื่อสินค้าว่างเปล่า' } }
  if (!url)                      return { ok: false, result: { row: rowNum, name: label, ok: false, message: 'ลิงก์สินค้าว่างเปล่า' } }
  if (!isHttps(url))             return { ok: false, result: { row: rowNum, name: label, ok: false, message: 'ลิงก์สินค้าต้องเป็น https://' } }
  if (!affiliateUrl)             return { ok: false, result: { row: rowNum, name: label, ok: false, message: 'ลิงก์ข้อเสนอว่างเปล่า' } }
  if (!isHttps(affiliateUrl))    return { ok: false, result: { row: rowNum, name: label, ok: false, message: 'ลิงก์ข้อเสนอต้องเป็น https://' } }

  const price = parseFloat(priceRaw.replace(/,/g, '').trim())
  if (isNaN(price) || price <= 0) return { ok: false, result: { row: rowNum, name: label, ok: false, message: `ราคาไม่ถูกต้อง: "${priceRaw.trim()}"` } }

  return {
    ok: true,
    data: {
      platform_id:   platformId || undefined,
      name,
      url,
      affiliate_url: affiliateUrl,
      price_current: price,
      price_original: null,
      image_url:     null,
      category:      null,
      shop_name:     shopName,
      data_source:   network,
    },
  }
}

function validateShopOfferRow(
  cols: string[],
  rowNum: number,
  network: DataSource,
): { ok: true; data: ValidatedRow } | { ok: false; result: CsvRowResult } {
  // cols: [ชื่อข้อเสนอ, ระยะเวลา, อัตราคอมฯ, ลิงก์ข้อเสนอ, ลิงก์ร้านค้า(สั้น)]
  const [shopNameRaw = '', , , shopUrlRaw = '', affiliateUrlRaw = ''] = cols

  const shopName    = shopNameRaw.trim()
  const shopUrl     = shopUrlRaw.trim()
  const affiliateUrl = affiliateUrlRaw.trim()
  const label       = shopName || `แถว ${rowNum}`

  if (!shopName)               return { ok: false, result: { row: rowNum, name: label, ok: false, message: 'ชื่อร้านค้าว่างเปล่า' } }
  if (!shopUrl)                return { ok: false, result: { row: rowNum, name: label, ok: false, message: 'ลิงก์ข้อเสนอว่างเปล่า' } }
  if (!isHttps(shopUrl))       return { ok: false, result: { row: rowNum, name: label, ok: false, message: 'ลิงก์ข้อเสนอต้องเป็น https://' } }
  if (!affiliateUrl)           return { ok: false, result: { row: rowNum, name: label, ok: false, message: 'ลิงก์ร้านค้า(สั้น)ว่างเปล่า' } }
  if (!isHttps(affiliateUrl))  return { ok: false, result: { row: rowNum, name: label, ok: false, message: 'ลิงก์ร้านค้าต้องเป็น https://' } }

  // Extract numeric shop ID from shopee.co.th/shop/<id>
  const shopId = shopUrl.match(/\/shop\/(\d+)/)?.[1] ?? `shop_${rowNum}`

  return {
    ok: true,
    data: {
      platform_id:    shopId,
      name:           shopName,
      url:            shopUrl,
      affiliate_url:  affiliateUrl,
      price_current:  0,
      price_original: null,
      image_url:      null,
      category:       'shop_offer',
      shop_name:      shopName,
      data_source:    network,
    },
  }
}

/** Parse a full CSV text into validated rows + error list. Skips the header row.
 *  Auto-detects 3 formats: standard template, Shopee product affiliate, Shopee shop offer.
 *  shopeeNetwork sets data_source for Shopee-format CSVs (default: 'shopee_affiliate'). */
export function parseCSV(text: string, shopeeNetwork: DataSource = 'shopee_affiliate'): {
  valid: ValidatedRow[]
  errors: CsvRowResult[]
} {
  // Use full RFC-4180 parser so multi-line quoted headers (shop offer CSV) are handled
  const rows = parseCSVFull(text)
  const valid: ValidatedRow[]  = []
  const errors: CsvRowResult[] = []

  if (rows.length === 0) return { valid, errors }

  const header = rows[0]
  const isShopOffer       = header.some(c => c === SHOP_OFFER_HEADER_MARKER)
  const isShopeeAffiliate = !isShopOffer && header.some(c => c === SHOPEE_AFFILIATE_HEADER_MARKER)

  for (let i = 1; i < rows.length; i++) {
    const rowNum = i + 1
    const cols   = rows[i]
    const result = isShopOffer
      ? validateShopOfferRow(cols, rowNum, shopeeNetwork)
      : isShopeeAffiliate
        ? validateShopeeAffiliateRow(cols, rowNum, shopeeNetwork)
        : validateCsvRow(cols, rowNum)
    if (result.ok) valid.push(result.data)
    else           errors.push(result.result)
  }

  return { valid, errors }
}
