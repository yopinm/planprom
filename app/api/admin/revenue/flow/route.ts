// GET /api/admin/revenue/flow[?channel=X][?limit=N]
//
// Affiliate Flow Optimization — TASK 5.6b
// Returns flow metrics (channel × page × platform) from v_funnel_flow.

import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin-auth'
import { getFlowReport, getFlowByChannel } from '@/lib/funnel-flow'

export async function GET(req: NextRequest) {
  if (!await getAdminUser()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { searchParams } = req.nextUrl
    const channel = searchParams.get('channel')
    const limit   = Math.min(200, parseInt(searchParams.get('limit') ?? '100', 10))

    if (channel) {
      const rows = await getFlowByChannel(channel)
      return NextResponse.json({ rows, generated_at: new Date().toISOString() })
    }

    const report = await getFlowReport(limit)
    return NextResponse.json(report)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
