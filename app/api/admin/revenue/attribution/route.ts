// GET /api/admin/revenue/attribution[?sub_id=X][?product_id=Y][?limit=N]
//
// Sub ID Revenue Attribution — TASK 5.4
// Returns last-click attribution detail from v_revenue_attribution_detail.
// Admin-only endpoint — feeds TASK 5.5 Revenue Dashboard.

import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin-auth'
import {
  getAttributionDetail,
  getAttributionBySubId,
  getAttributionByProduct,
} from '@/lib/revenue-attribution'

export async function GET(req: NextRequest) {
  if (!await getAdminUser()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { searchParams } = req.nextUrl
    const subId     = searchParams.get('sub_id')
    const productId = searchParams.get('product_id')
    const limit     = Math.min(500, parseInt(searchParams.get('limit') ?? '100', 10))

    if (subId) {
      const rows = await getAttributionBySubId(subId)
      return NextResponse.json({ rows, generated_at: new Date().toISOString() })
    }

    if (productId) {
      const rows = await getAttributionByProduct(productId)
      return NextResponse.json({ rows, generated_at: new Date().toISOString() })
    }

    const summary = await getAttributionDetail(limit)
    return NextResponse.json(summary)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
