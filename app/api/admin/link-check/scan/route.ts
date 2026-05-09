// POST /api/admin/link-check/scan
//
// TASK 3.15 -- Automated Link Checker
// Admin-only batch scanner for active product outbound links.

import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin-auth'
import {
  scanProductLinks,
  type LinkCheckProduct,
  type ProductLinkScanReport,
} from '@/lib/automated-link-checker'
import { createAdminClient } from '@/lib/supabase/server'

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 200

function parseLimit(value: string | null): number {
  if (!value) return DEFAULT_LIMIT
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) return DEFAULT_LIMIT
  return Math.min(parsed, MAX_LIMIT)
}

export async function POST(
  req: NextRequest,
): Promise<NextResponse<ProductLinkScanReport | { error: string }>> {
  if (!await getAdminUser()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limit = parseLimit(req.nextUrl.searchParams.get('limit'))
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('products')
    .select('id, url, affiliate_url')
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const products = (data ?? []) as LinkCheckProduct[]
  const report = await scanProductLinks(products)

  if (report.results.length > 0) {
    const { error: upsertError } = await supabase
      .from('product_link_checks')
      .upsert(report.results, { onConflict: 'product_id' })

    if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 })
  }

  return NextResponse.json(report)
}
