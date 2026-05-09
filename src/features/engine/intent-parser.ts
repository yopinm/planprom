// Intent Parser — Layer 1 of the Search & Deal Optimization Engine
// Accepts 3 input types → normalizes to ParsedIntent
//
// Input types:
//   1. budget  — "400 กีฬา", "งบ 500 มือถือ", "ไม่เกิน 300 บาท"
//   2. url     — Shopee / Lazada product URL (delegated to deep-link-parser)
//   3. product_name — everything else, e.g. "Samsung Galaxy A55"

import { parseDeepLink, isPlatformUrl } from '@/lib/deep-link-parser'
import { detectCategory } from '@/lib/constants/categories'

import type { ParsedIntent } from '@/types'

// ---------------------------------------------------------------------------
// Budget patterns — extracts the first numeric budget from input
// ---------------------------------------------------------------------------
const BUDGET_PATTERNS: RegExp[] = [
  // "งบ 500", "งบประมาณ 500", "budget 500"
  /(?:งบ(?:ประมาณ)?|budget)\s*(\d[\d,]*)/i,
  // "ไม่เกิน 300 บาท", "ราคาไม่เกิน 500"
  /(?:ไม่เกิน|ราคา(?:ไม่เกิน)?)\s*(\d[\d,]*)/i,
  // "300 บาท" or "500บาท"
  /(\d[\d,]*)\s*บาท/i,
  // "400 กีฬา" — number at start followed by space + non-digit
  /^(\d[\d,]*)\s+\D/,
  // "กีฬา 400" — number at end
  /\D\s+(\d[\d,]*)$/,
]

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------
function isUrl(input: string): boolean {
  return input.startsWith('http://') || input.startsWith('https://')
}

// ---------------------------------------------------------------------------
// Budget extraction
// ---------------------------------------------------------------------------
function parseBudget(input: string): number | null {
  for (const pattern of BUDGET_PATTERNS) {
    const m = input.match(pattern)
    if (m) {
      const n = parseInt(m[1].replace(/,/g, ''), 10)
      if (!isNaN(n) && n > 0) return n
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export function parseIntent(input: string): ParsedIntent {
  const trimmed = input.trim()

  if (!trimmed) {
    return { query_type: 'product_name', query: '' }
  }

  // 1. URL — delegate to deep-link-parser for full extraction
  if (isUrl(trimmed) && isPlatformUrl(trimmed)) {
    const parsed = parseDeepLink(trimmed)
    if (parsed) {
      return {
        query_type: 'url',
        platform: parsed.platform,
        product_id: parsed.product_id,
        category: parsed.category,
        query: trimmed,
      }
    }
  }

  // Generic URL (unknown platform)
  if (isUrl(trimmed)) {
    return { query_type: 'url', query: trimmed }
  }

  // 2. Budget
  const budget = parseBudget(trimmed)
  if (budget !== null) {
    return {
      query_type: 'budget',
      budget,
      category: detectCategory(trimmed),
      query: trimmed,
    }
  }

  // 3. Product name (fallback)
  return {
    query_type: 'product_name',
    category: detectCategory(trimmed),
    query: trimmed,
  }
}
