// GET /api/admin/revenue/by-subid
// POSTLIVE-03: Revenue by Sub-ID Report — time-to-conversion per platform

import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin-auth'
import { getRevenueBySubIdReport } from '@/lib/revenue-data'

export async function GET() {
  if (!(await getAdminUser()))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const report = await getRevenueBySubIdReport()
    return NextResponse.json(report)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
