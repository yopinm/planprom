// GET /api/admin/revenue/funnel[?platform=X][?type=path][?limit=N]
//
// CTR / Funnel Analysis — TASK 5.6
// Returns funnel metrics (CVR, RPC) from v_funnel_metrics or v_funnel_path.
// Admin-only endpoint — feeds Revenue Dashboard funnel section.

import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin-auth'
import {
  getFunnelReport,
  getFunnelByPlatform,
  getPathMetrics,
} from '@/lib/funnel-metrics'

export async function GET(req: NextRequest) {
  if (!await getAdminUser()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { searchParams } = req.nextUrl
    const platform = searchParams.get('platform')
    const type     = searchParams.get('type')      // 'path' → path breakdown only
    const limit    = Math.min(200, parseInt(searchParams.get('limit') ?? '50', 10))

    if (type === 'path') {
      const rows = await getPathMetrics()
      return NextResponse.json({ rows, generated_at: new Date().toISOString() })
    }

    if (platform) {
      const rows = await getFunnelByPlatform(platform)
      return NextResponse.json({ rows, generated_at: new Date().toISOString() })
    }

    const report = await getFunnelReport(limit)
    return NextResponse.json(report)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
