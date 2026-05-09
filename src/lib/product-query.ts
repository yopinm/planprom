import type { Product } from '@/types'

export interface ScoredProductRow {
  products: Product | Product[] | null
}

export function productFromScoredRow(row: ScoredProductRow): Product | null {
  if (Array.isArray(row.products)) return row.products[0] ?? null
  return row.products
}

export function productsFromScoredRows(rows: ScoredProductRow[]): Product[] {
  return rows.flatMap(row => {
    const product = productFromScoredRow(row)
    return product ? [product] : []
  })
}
