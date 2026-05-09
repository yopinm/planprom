import type { ReactElement } from 'react'
import { createAdminClient } from '@/lib/supabase/server'

interface ProductCategoryRef {
  category: string | null
}

interface ClickProductRow {
  id: string | number | null
  products: ProductCategoryRef | ProductCategoryRef[] | null
}

interface WinningCategoryRow {
  category: string
  clickCount: number
}

function formatNumber(value: number): string {
  return value.toLocaleString('th-TH')
}

function getCategory(products: ProductCategoryRef | ProductCategoryRef[] | null): string {
  const product = Array.isArray(products) ? products[0] : products
  return product?.category?.trim() || 'uncategorized'
}

async function fetchWinningCategoryRows(): Promise<WinningCategoryRow[]> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('click_logs')
      .select('id,products!inner(category)')
      .not('product_id', 'is', null)
      .limit(5000)

    if (error) return []

    const counts = new Map<string, number>()
    const rows = (data ?? []) as ClickProductRow[]
    for (const row of rows) {
      const category = getCategory(row.products)
      counts.set(category, (counts.get(category) ?? 0) + 1)
    }

    return [...counts.entries()]
      .map(([category, clickCount]) => ({ category, clickCount }))
      .sort((a, b) => b.clickCount - a.clickCount)
      .slice(0, 10)
  } catch {
    return []
  }
}

export async function WinningCategoryReport(): Promise<ReactElement> {
  const rows = await fetchWinningCategoryRows()

  return (
    <section className="mt-8 rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-neutral-800">Winning Category Report (POSTLIVE-10)</h2>
          <p className="mt-0.5 text-[11px] text-neutral-400">
            Top product categories from click_logs joined with products
          </p>
        </div>
        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-black text-neutral-600">
          Top {rows.length}
        </span>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[420px] text-left text-[11px]">
          <thead>
            <tr className="border-b border-neutral-100">
              <th className="pb-1.5 pr-3 font-black text-neutral-500">category</th>
              <th className="pb-1.5 text-right font-black text-neutral-500">click_count</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.category} className="border-b border-neutral-50 last:border-0">
                <td className="max-w-[260px] truncate py-1.5 pr-3 font-black text-neutral-700">
                  {row.category}
                </td>
                <td className="py-1.5 text-right font-black text-neutral-800">
                  {formatNumber(row.clickCount)}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={2} className="py-10 text-center text-xs text-neutral-400">
                  No data yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
