import { db } from '@/lib/db'

export type PostbackMonitorStatus = 'success' | 'blocked'

export interface RevenueTrackingPostbackRow {
  id: string
  platform: string
  sub_id: string | null
  order_id: string | null
  commission: number | null
  event_type: string
  raw_payload: Record<string, unknown> | null
  received_at: string
}

export interface ControlBlockedEventRow {
  id: string
  event_name: string
  properties: Record<string, unknown> | null
  path: string | null
  created_at: string
}

export interface PostbackMonitorRow {
  id: string
  status: PostbackMonitorStatus
  platform: string
  route: string
  order_id: string | null
  sub_id: string | null
  commission: number | null
  event_type: string | null
  reason: string
  source_page: string | null
  product_id: string | null
  occurred_at: string
}

export interface PostbackMonitorSummary {
  rows: PostbackMonitorRow[]
  successCount: number
  blockedCount: number
  unattributedCount: number
}

function stringFromRecord(record: Record<string, unknown> | null | undefined, key: string): string | null {
  const value = record?.[key]
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

function numberFromRecord(record: Record<string, unknown> | null | undefined, key: string): number | null {
  const value = record?.[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export function mapRevenuePostback(row: RevenueTrackingPostbackRow): PostbackMonitorRow {
  const payload = row.raw_payload ?? {}

  return {
    id: `revenue:${row.id}`,
    status: 'success',
    platform: row.platform,
    route: `/api/postback/${row.platform}`,
    order_id: row.order_id,
    sub_id: row.sub_id,
    commission: row.commission,
    event_type: row.event_type,
    reason: row.event_type === 'conversion' ? 'verified' : row.event_type,
    source_page: null,
    product_id: stringFromRecord(payload, 'product_id'),
    occurred_at: row.received_at,
  }
}

export function mapControlBlockedPostback(row: ControlBlockedEventRow): PostbackMonitorRow | null {
  const properties = row.properties ?? {}
  const route = stringFromRecord(properties, 'route') ?? row.path ?? ''

  if (!route.startsWith('/api/postback/')) return null

  return {
    id: `blocked:${row.id}`,
    status: 'blocked',
    platform: stringFromRecord(properties, 'platform') ?? route.split('/').at(-1) ?? 'unknown',
    route,
    order_id: stringFromRecord(properties, 'order_id'),
    sub_id: stringFromRecord(properties, 'sub_id'),
    commission: numberFromRecord(properties, 'commission'),
    event_type: null,
    reason: stringFromRecord(properties, 'reason') ?? 'blocked',
    source_page: null,
    product_id: stringFromRecord(properties, 'product_id'),
    occurred_at: row.created_at,
  }
}

export function buildPostbackMonitorSummary(rows: PostbackMonitorRow[]): PostbackMonitorSummary {
  return {
    rows,
    successCount: rows.filter(row => row.status === 'success').length,
    blockedCount: rows.filter(row => row.status === 'blocked').length,
    unattributedCount: rows.filter(row => row.status === 'success' && !row.sub_id).length,
  }
}

export async function getPostbackMonitor(limit = 50): Promise<PostbackMonitorSummary> {
  const [revenueRows, blockedRows] = await Promise.all([
    db<RevenueTrackingPostbackRow[]>`
      SELECT id, platform, sub_id, order_id, commission, event_type, raw_payload, received_at
      FROM revenue_tracking
      ORDER BY received_at DESC
      LIMIT ${limit}
    `,
    db<ControlBlockedEventRow[]>`
      SELECT id, event_name, properties, path, created_at
      FROM analytics_events
      WHERE event_name = 'control_blocked'
      ORDER BY created_at DESC
      LIMIT ${limit}
    `,
  ])

  const successes = revenueRows.map(mapRevenuePostback)
  const blocked = blockedRows
    .map(mapControlBlockedPostback)
    .filter((row): row is PostbackMonitorRow => row !== null)

  const rows = [...successes, ...blocked]
    .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())
    .slice(0, limit)

  return buildPostbackMonitorSummary(rows)
}
