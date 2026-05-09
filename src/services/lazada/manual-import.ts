// Manual import fallback for Lazada products.
// Place raw Lazada product items (LazadaProductItem shape) in data/lazada-products.json.
// Returns [] gracefully if the file is absent or malformed.

import { readFileSync } from 'fs'
import { join } from 'path'
import type { Product } from '@/types'
import { toProduct, isValidLazadaItem } from './normalizer'

const IMPORT_PATH = join(process.cwd(), 'data', 'lazada-products.json')

export function normalizeManualImport(items: unknown[]): Product[] {
  const checkedAt = new Date().toISOString()
  return items.filter(isValidLazadaItem).map((item) => toProduct(item, checkedAt))
}

export function loadManualImportProducts(): Product[] {
  let raw: string
  try {
    raw = readFileSync(IMPORT_PATH, 'utf-8')
  } catch {
    return []
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return []
  }

  return Array.isArray(parsed) ? normalizeManualImport(parsed) : []
}
