// GET /api/admin/revenue/summary
//
// Revenue Attribution Summary — TASK 4.11
// Returns aggregated click + commission data from v_revenue_attribution view.
// Admin-only endpoint — service role required.
//
// Response:
//   { rows: RevenueRow[], total_clicks, total_conversions, total_commission, generated_at }

import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin-auth'
import { getRevenueSummary } from '@/lib/revenue-data'

export async function GET() {
  if (!await getAdminUser()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const summary = await getRevenueSummary()
    return NextResponse.json(summary)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
