// GET /api/admin/revenue/weights
//
// Feedback Loop Weights — TASK 4.12
// Returns per-context weight multipliers computed from live revenue data.
// Admin-only — for review and manual approval before applying to ranking.
//
// Response:
//   { weights: ContextWeight[], baseline_cpc, generated_at }

import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin-auth'
import { getContextWeights } from '@/lib/feedback-loop'

export async function GET() {
  if (!await getAdminUser()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const result = await getContextWeights()
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
