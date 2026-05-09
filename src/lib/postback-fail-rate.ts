import { db } from '@/lib/db'

interface CountRow {
  count: number
}

export function computePostbackFailRate(success: number, blocked: number): number {
  const total = success + blocked
  return total === 0 ? 0 : (blocked / total) * 100
}

export async function fetchPostbackFailRate(): Promise<number> {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const [successRows, blockedRows] = await Promise.all([
      db<CountRow[]>`
        SELECT COUNT(*)::int AS count
        FROM revenue_tracking
        WHERE received_at >= ${since}
      `,
      db<CountRow[]>`
        SELECT COUNT(*)::int AS count
        FROM analytics_events
        WHERE event_name = 'control_blocked'
          AND created_at >= ${since}
      `,
    ])
    return computePostbackFailRate(successRows[0]?.count ?? 0, blockedRows[0]?.count ?? 0)
  } catch { return 0 }
}
