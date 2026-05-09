// GET /api/admin/revenue/scores[?sub_id=search_top_1]
//
// Revenue Scoring API v1 — TASK 4.13
// Returns 0–100 revenue scores for all sub_ids, or one sub_id via query param.
// Admin-only endpoint — feeds TASK 4.14 Revenue Dashboard.

import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin-auth'
import { getRevenueScores, getSubIdScore } from '@/lib/revenue-score'

export async function GET(req: NextRequest) {
  if (!await getAdminUser()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const subId = req.nextUrl.searchParams.get('sub_id')

    if (subId) {
      const score = await getSubIdScore(subId)
      if (!score) return NextResponse.json({ error: 'sub_id not found' }, { status: 404 })
      return NextResponse.json(score)
    }

    const report = await getRevenueScores()
    return NextResponse.json(report)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
