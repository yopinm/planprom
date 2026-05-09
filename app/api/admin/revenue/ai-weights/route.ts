// GET /api/admin/revenue/ai-weights
//
// TASK 6.1 - AI Revenue-Driven Weighting dry-run report.
// Admin-only. This endpoint returns recommendations and readiness state only;
// it does not apply ranking changes.

import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin-auth'
import { getAiRevenueWeightingReport } from '@/lib/ai-revenue-weighting'

export async function GET(): Promise<NextResponse> {
  if (!await getAdminUser()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const report = await getAiRevenueWeightingReport()
    return NextResponse.json(report)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
