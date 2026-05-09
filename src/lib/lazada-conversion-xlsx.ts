// Lazada Conversion Report XLSX parser
// Reads LAZADA-ConversionReport-*.xlsx files from /core/ directory
// Returns products grouped by productId with conversion count

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import * as XLSX from 'xlsx'

export interface ConversionProduct {
  productId:      string
  productName:    string
  categoryL1:     string | null
  brandName:      string | null
  sellerName:     string | null
  avgOrderAmount: number
  totalPayout:    number
  commissionRate: number
  conversionCount: number
  status:         string
}

interface RawRow {
  'Product ID'?:      string | number
  'Product Name'?:    string
  'Category L1'?:     string
  'Brand Name'?:      string
  'Seller Name'?:     string
  'Order Amount'?:    string | number
  'Payout'?:          string | number
  'Commission Rate'?: string | number
  'Status'?:          string
  'Validity'?:        string
}

export function parseConversionReports(coreDir?: string): ConversionProduct[] {
  const dir = coreDir ?? join(process.cwd(), 'core')

  let files: string[]
  try {
    files = readdirSync(dir)
      .filter((f: string) => /^LAZADA-ConversionReport-.+\.xlsx$/i.test(f))
      .map((f: string) => join(dir, f))
  } catch {
    return []
  }
  if (files.length === 0) return []

  // Accumulate per-product across all files
  const map = new Map<string, {
    productName: string
    categoryL1: string | null
    brandName: string | null
    sellerName: string | null
    totalOrderAmount: number
    totalPayout: number
    commissionRate: number
    conversionCount: number
    status: string
  }>()

  for (const file of files) {
    let buf: Buffer
    try { buf = readFileSync(file) } catch { continue }

    const wb = XLSX.read(buf, { type: 'buffer', cellDates: false })
    const ws = wb.Sheets[wb.SheetNames[0]]
    if (!ws) continue

    const rows = XLSX.utils.sheet_to_json<RawRow>(ws, { defval: '' })

    for (const row of rows) {
      const rawId = row['Product ID']
      if (!rawId) continue

      // Lazada Product IDs come as scientific notation strings (e.g. "5.777446551E9")
      const productId = String(Math.round(Number(rawId)))
      if (isNaN(Number(productId)) || productId === '0') continue

      const validity = String(row['Validity'] ?? '').toLowerCase()
      const status   = String(row['Status'] ?? '')
      // Only count valid/fulfilled conversions
      if (validity !== 'valid') continue

      const orderAmount    = Number(row['Order Amount']   ?? 0) || 0
      const payout         = Number(row['Payout']         ?? 0) || 0
      const commissionRate = Number(row['Commission Rate']?? 0) || 0

      const existing = map.get(productId)
      if (existing) {
        existing.totalOrderAmount += orderAmount
        existing.totalPayout      += payout
        existing.conversionCount  += 1
      } else {
        map.set(productId, {
          productName:      String(row['Product Name'] ?? ''),
          categoryL1:       row['Category L1'] ? String(row['Category L1']) : null,
          brandName:        row['Brand Name']  ? String(row['Brand Name'])  : null,
          sellerName:       row['Seller Name'] ? String(row['Seller Name']) : null,
          totalOrderAmount: orderAmount,
          totalPayout:      payout,
          commissionRate,
          conversionCount:  1,
          status,
        })
      }
    }
  }

  return Array.from(map.entries()).map(([productId, d]) => ({
    productId,
    productName:     d.productName,
    categoryL1:      d.categoryL1,
    brandName:       d.brandName,
    sellerName:      d.sellerName,
    avgOrderAmount:  d.conversionCount > 0 ? d.totalOrderAmount / d.conversionCount : 0,
    totalPayout:     d.totalPayout,
    commissionRate:  d.commissionRate,
    conversionCount: d.conversionCount,
    status:          d.status,
  }))
}
