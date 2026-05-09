// POST /api/admin/products/fake-discount
//
// TASK 4.4 -- Fake Discount Detection
// Admin-only scanner. Persists suspicious discount flags to products.

import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin-auth'
import { buildFakeDiscountProductPatch } from '@/lib/fake-discount'
import { createAdminClient } from '@/lib/supabase/server'

interface ProductPriceRow {
  id: string
  price_current: number
  price_original: number | null
  suspicious_discount: boolean | null
  suspicious_discount_reason: string | null
}

interface FakeDiscountScanResponse {
  scanned: number
  flagged: number
  updated: number
  skipped: boolean
  reason: string | null
  generated_at: string
}

function needsFakeDiscountUpdate(
  row: ProductPriceRow,
  patch: ReturnType<typeof buildFakeDiscountProductPatch>,
): boolean {
  return (
    row.suspicious_discount !== patch.suspicious_discount ||
    row.suspicious_discount_reason !== patch.suspicious_discount_reason
  )
}

export async function POST(): Promise<NextResponse<FakeDiscountScanResponse | { error: string }>> {
  if (!await getAdminUser()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()
  const generatedAt = new Date()

  const { data: historyRows, error: historyError } = await supabase
    .from('price_history')
    .select('product_id')
    .limit(1)

  if (historyError) return NextResponse.json({ error: historyError.message }, { status: 500 })

  if ((historyRows ?? []).length === 0) {
    return NextResponse.json({
      scanned:      0,
      flagged:      0,
      updated:      0,
      skipped:      true,
      reason:       'price_history_empty',
      generated_at: generatedAt.toISOString(),
    })
  }

  const { data, error } = await supabase
    .from('products')
    .select('id, price_current, price_original, suspicious_discount, suspicious_discount_reason')
    .eq('is_active', true)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (data ?? []) as ProductPriceRow[]
  let flagged = 0
  let updated = 0

  for (const row of rows) {
    const patch = buildFakeDiscountProductPatch(row, generatedAt)
    if (patch.suspicious_discount) flagged++

    if (!needsFakeDiscountUpdate(row, patch)) continue

    const { error: updateError } = await supabase
      .from('products')
      .update(patch)
      .eq('id', row.id)

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
    updated++
  }

  return NextResponse.json({
    scanned:      rows.length,
    flagged,
    updated,
    skipped:      false,
    reason:       null,
    generated_at: generatedAt.toISOString(),
  })
}
