// app/api/health/detail — TASK 5.1
// GET /api/health/detail → structured health check with DB ping
// /api/health (original) is unchanged — always 200, used by uptime monitors
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { timedCheck, type HealthStatus } from '@/lib/monitoring'

export const dynamic = 'force-dynamic'

export async function GET() {
  const checks: Record<string, { ok: boolean; latencyMs?: number; detail?: string }> = {}

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (supabaseUrl && supabaseKey) {
    checks.db = await timedCheck('supabase-ping', async () => {
      const client = createClient(supabaseUrl, supabaseKey)
      const { error } = await client.from('products').select('id').limit(1)
      if (error) throw new Error(error.message)
    })
  } else {
    checks.db = { ok: false, detail: 'credentials not configured' }
  }

  const anyError = Object.values(checks).some((c) => !c.ok)
  const status: HealthStatus = anyError ? 'degraded' : 'ok'

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '0.1.0',
      checks,
    },
    { status: anyError ? 503 : 200 },
  )
}
