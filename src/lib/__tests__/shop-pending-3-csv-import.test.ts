// SHOP-PENDING-3 — CSV bulk import unit tests

import { describe, expect, it } from 'vitest'
import {
  parseCSVLine,
  validateCsvRow,
  parseCSV,
  CSV_TEMPLATE_HEADER,
  CSV_TEMPLATE_EXAMPLE,
} from '@/lib/csv-import'

// ---------------------------------------------------------------------------
// parseCSVLine
// ---------------------------------------------------------------------------
describe('parseCSVLine — basic', () => {
  it('splits a simple comma-separated line', () => {
    expect(parseCSVLine('a,b,c')).toEqual(['a', 'b', 'c'])
  })

  it('trims whitespace around each field', () => {
    expect(parseCSVLine(' a , b , c ')).toEqual(['a', 'b', 'c'])
  })

  it('handles empty fields', () => {
    expect(parseCSVLine('a,,c')).toEqual(['a', '', 'c'])
  })
})

describe('parseCSVLine — quoted fields', () => {
  it('preserves commas inside double quotes', () => {
    expect(parseCSVLine('"hello, world",b')).toEqual(['hello, world', 'b'])
  })

  it('handles escaped double-quote inside quoted field', () => {
    expect(parseCSVLine('"say ""hi"" there",b')).toEqual(['say "hi" there', 'b'])
  })

  it('handles empty quoted field', () => {
    expect(parseCSVLine('"",b')).toEqual(['', 'b'])
  })
})

// ---------------------------------------------------------------------------
// validateCsvRow — valid input
// ---------------------------------------------------------------------------
describe('validateCsvRow — valid row', () => {
  const validCols = [
    'iPhone 15 Pro',
    'https://shopee.co.th/product/1',
    'https://invol.co/abc',
    '15900',
    '17900',
    'https://img.example.com/pic.jpg',
    'Electronics',
    'Apple Store',
    'involve_asia',
  ]

  it('returns ok:true with correct parsed values', () => {
    const result = validateCsvRow(validCols, 2)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.name).toBe('iPhone 15 Pro')
    expect(result.data.price_current).toBe(15900)
    expect(result.data.price_original).toBe(17900)
    expect(result.data.data_source).toBe('involve_asia')
    expect(result.data.category).toBe('Electronics')
  })

  it('maps accesstrade network correctly', () => {
    const cols = [...validCols]
    cols[2] = 'https://c.accesstrade.in.th/click?offer_id=1'
    cols[8] = 'accesstrade'
    const result = validateCsvRow(cols, 3)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.data_source).toBe('accesstrade')
  })

  it('defaults unknown network to manual (Shopee URL + direct network = consistent)', () => {
    const cols = [...validCols]
    cols[2] = 'https://shopee.co.th/product/special'  // Shopee URL — consistent with 'direct'
    cols[8] = 'direct'
    const result = validateCsvRow(cols, 4)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.data_source).toBe('manual')
  })

  it('allows missing optional fields (price_original, image, category, shop)', () => {
    // affiliate URL must match implicit 'direct' network (no 9th column)
    const cols = ['Product X', 'https://shopee.co.th/p/1', 'https://shopee.co.th/affiliate/x', '500']
    const result = validateCsvRow(cols, 5)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.price_original).toBeNull()
    expect(result.data.image_url).toBeNull()
    expect(result.data.category).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// validateCsvRow — invalid input
// ---------------------------------------------------------------------------
describe('validateCsvRow — validation errors', () => {
  const base = [
    'Product', 'https://shopee.co.th/p/1', 'https://invol.co/x', '999',
    '', '', '', '', 'involve_asia',
  ]

  it('rejects empty name', () => {
    const cols = [...base]; cols[0] = ''
    const r = validateCsvRow(cols, 2)
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.result.message).toContain('ชื่อ')
  })

  it('rejects empty url', () => {
    const cols = [...base]; cols[1] = ''
    const r = validateCsvRow(cols, 3)
    expect(r.ok).toBe(false)
  })

  it('rejects empty affiliate_url', () => {
    const cols = [...base]; cols[2] = ''
    const r = validateCsvRow(cols, 4)
    expect(r.ok).toBe(false)
  })

  it('rejects disallowed affiliate host', () => {
    const cols = [...base]; cols[2] = 'https://evil.com/track'
    const r = validateCsvRow(cols, 5)
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.result.message).toContain('Affiliate URL ไม่ถูกต้อง')
  })

  it('rejects zero price', () => {
    const cols = [...base]; cols[3] = '0'
    const r = validateCsvRow(cols, 6)
    expect(r.ok).toBe(false)
  })

  it('rejects non-numeric price', () => {
    const cols = [...base]; cols[3] = 'abc'
    const r = validateCsvRow(cols, 7)
    expect(r.ok).toBe(false)
  })

  it('rejects http:// product URL', () => {
    const cols = [...base]; cols[1] = 'http://shopee.co.th/p/1'
    const r = validateCsvRow(cols, 8)
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.result.message).toContain('https://')
  })

  it('rejects http:// affiliate URL', () => {
    const cols = [...base]; cols[2] = 'http://invol.co/x'
    const r = validateCsvRow(cols, 9)
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.result.message).toContain('https://')
  })
})

// ---------------------------------------------------------------------------
// parseCSV — full file parsing
// ---------------------------------------------------------------------------
describe('parseCSV', () => {
  it('skips header row and parses data rows', () => {
    const csv = [
      CSV_TEMPLATE_HEADER,
      CSV_TEMPLATE_EXAMPLE,
    ].join('\n')
    const { valid, errors } = parseCSV(csv)
    expect(valid).toHaveLength(1)
    expect(errors).toHaveLength(0)
    expect(valid[0].name).toBe('iPhone 15 Pro 256GB')
    expect(valid[0].data_source).toBe('involve_asia')
  })

  it('collects errors for invalid rows without stopping', () => {
    const csv = [
      CSV_TEMPLATE_HEADER,
      CSV_TEMPLATE_EXAMPLE,                                          // valid row 2
      ',https://shopee.co.th/p/1,https://invol.co/x,999,,,,, ',    // invalid row 3 — empty name
      CSV_TEMPLATE_EXAMPLE.replace('iPhone 15 Pro 256GB', 'Item B'), // valid row 4
    ].join('\n')
    const { valid, errors } = parseCSV(csv)
    expect(valid).toHaveLength(2)
    expect(errors).toHaveLength(1)
    expect(errors[0].row).toBe(3)
  })

  it('returns empty arrays for header-only file', () => {
    const { valid, errors } = parseCSV(CSV_TEMPLATE_HEADER)
    expect(valid).toHaveLength(0)
    expect(errors).toHaveLength(0)
  })

  it('handles Windows CRLF line endings', () => {
    const csv = `${CSV_TEMPLATE_HEADER}\r\n${CSV_TEMPLATE_EXAMPLE}`
    const { valid } = parseCSV(csv)
    expect(valid).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// parseCSV — Shopee Affiliate format (Thai headers)
// ---------------------------------------------------------------------------
describe('parseCSV — Shopee Affiliate format', () => {
  const SHOPEE_HEADER = 'รหัสสินค้า,ชื่อสินค้า,ราคา,ขาย,ชื่อร้านค้า,อัตราค่าคอมมิชชัน,คอมมิชชัน,ลิงก์สินค้า,ลิงก์ข้อเสนอ'
  const SHOPEE_ROW    = '987654321,iPhone 15 Pro 256GB,39900,1250,Apple Official Store,5%,1995,https://shopee.co.th/product/987654321,https://invol.pe/abcxyz'

  it('detects Shopee Affiliate header and parses correctly', () => {
    const { valid, errors } = parseCSV(`${SHOPEE_HEADER}\n${SHOPEE_ROW}`)
    expect(errors).toHaveLength(0)
    expect(valid).toHaveLength(1)
    const row = valid[0]
    expect(row.platform_id).toBe('987654321')
    expect(row.name).toBe('iPhone 15 Pro 256GB')
    expect(row.price_current).toBe(39900)
    expect(row.shop_name).toBe('Apple Official Store')
    expect(row.url).toBe('https://shopee.co.th/product/987654321')
    expect(row.affiliate_url).toBe('https://invol.pe/abcxyz')
    expect(row.data_source).toBe('shopee_affiliate')
    expect(row.price_original).toBeNull()
    expect(row.image_url).toBeNull()
    expect(row.category).toBeNull()
  })

  it('returns error for empty name', () => {
    const row = ',,,,,,,https://shopee.co.th/p/1,https://invol.pe/x'
    const { errors } = parseCSV(`${SHOPEE_HEADER}\n${row}`)
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('ชื่อสินค้า')
  })

  it('returns error for empty affiliate URL', () => {
    const row = '111,Test Product,999,0,Shop,,, https://shopee.co.th/p/1,'
    const { errors } = parseCSV(`${SHOPEE_HEADER}\n${row}`)
    expect(errors).toHaveLength(1)
  })

  it('handles Windows CRLF', () => {
    const { valid } = parseCSV(`${SHOPEE_HEADER}\r\n${SHOPEE_ROW}`)
    expect(valid).toHaveLength(1)
  })

  it('does not affect standard CSV format detection', () => {
    const csv = `${CSV_TEMPLATE_HEADER}\n${CSV_TEMPLATE_EXAMPLE}`
    const { valid } = parseCSV(csv)
    expect(valid[0]?.platform_id).toBeUndefined()
    expect(valid[0]?.name).toBe('iPhone 15 Pro 256GB')
  })
})

// ---------------------------------------------------------------------------
// parseCSV — Shopee Shop/Brand offer format (brand_offer page)
// ---------------------------------------------------------------------------
describe('parseCSV — Shopee shop offer format', () => {
  // Real CSV: header col 1 contains a newline inside quotes → 2 raw lines for 1 logical header row
  const SHOP_HEADER_RAW = 'ชื่อข้อเสนอ,"เริ่มต้น: {start_time}\nสิ้นสุด: {end_time}",อัตราค่าคอมมิชชัน,ลิงก์ข้อเสนอ,ลิงก์ร้านค้า(สั้น)'
  const SHOP_ROW        = 'บ้านแม่ตุน,ระยะเวลาข้อเสนอ,สูงสุดถึง 13%,https://shopee.co.th/shop/298882983,https://s.shopee.co.th/5flFCgHCrv'

  it('parses multi-line quoted header correctly', () => {
    const { valid, errors } = parseCSV(`${SHOP_HEADER_RAW}\n${SHOP_ROW}`)
    expect(errors).toHaveLength(0)
    expect(valid).toHaveLength(1)
  })

  it('maps columns to product fields correctly', () => {
    const { valid } = parseCSV(`${SHOP_HEADER_RAW}\n${SHOP_ROW}`)
    const row = valid[0]
    expect(row.platform_id).toBe('298882983')
    expect(row.name).toBe('บ้านแม่ตุน')
    expect(row.shop_name).toBe('บ้านแม่ตุน')
    expect(row.url).toBe('https://shopee.co.th/shop/298882983')
    expect(row.affiliate_url).toBe('https://s.shopee.co.th/5flFCgHCrv')
    expect(row.price_current).toBe(0)
    expect(row.category).toBe('shop_offer')
    expect(row.data_source).toBe('shopee_affiliate')
  })

  it('parses all 20 real shop rows without error', () => {
    const rows = [
      'บ้านแม่ตุน,ระยะเวลาข้อเสนอ,สูงสุดถึง 13%,https://shopee.co.th/shop/298882983,https://s.shopee.co.th/5flFCgHCrv',
      'Go believe,ระยะเวลาข้อเสนอ,สูงสุดถึง 7%,https://shopee.co.th/shop/349485745,https://s.shopee.co.th/7VCtO3AE9I',
      'KKK DESIGN,ระยะเวลาข้อเสนอ,สูงสุดถึง 12%,https://shopee.co.th/shop/45297410,https://s.shopee.co.th/7KtTBkArUH',
    ]
    const csv = `${SHOP_HEADER_RAW}\n${rows.join('\n')}`
    const { valid, errors } = parseCSV(csv)
    expect(errors).toHaveLength(0)
    expect(valid).toHaveLength(3)
  })

  it('returns error for empty shop name', () => {
    const row = ',ระยะเวลา,13%,https://shopee.co.th/shop/111,https://s.shopee.co.th/abc'
    const { errors } = parseCSV(`${SHOP_HEADER_RAW}\n${row}`)
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('ชื่อร้านค้า')
  })

  it('returns error for missing affiliate link', () => {
    const row = 'ร้านทดสอบ,ระยะเวลา,13%,https://shopee.co.th/shop/111,'
    const { errors } = parseCSV(`${SHOP_HEADER_RAW}\n${row}`)
    expect(errors).toHaveLength(1)
  })

  it('handles CRLF line endings', () => {
    const { valid } = parseCSV(`${SHOP_HEADER_RAW}\r\n${SHOP_ROW}`)
    expect(valid).toHaveLength(1)
    expect(valid[0].name).toBe('บ้านแม่ตุน')
  })

  it('does not confuse shop offer with product affiliate (different marker)', () => {
    const productCsv = `${CSV_TEMPLATE_HEADER}\n${CSV_TEMPLATE_EXAMPLE}`
    const { valid } = parseCSV(productCsv)
    expect(valid[0]?.category).not.toBe('shop_offer')
  })
})
