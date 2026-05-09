import { db } from '@/lib/db'

export interface UptimeEventInsert {
  monitorName: string
  alertType: 1 | 2
  alertDetails: string | null
}

export interface UptimeEvent {
  id: string
  monitor_name: string
  alert_type: 1 | 2
  alert_details: string | null
  occurred_at: Date
}

export async function insertUptimeEvent(data: UptimeEventInsert): Promise<void> {
  await db`
    INSERT INTO uptime_events (
      monitor_name,
      alert_type,
      alert_details
    )
    VALUES (
      ${data.monitorName},
      ${data.alertType},
      ${data.alertDetails}
    )
  `
}

export async function getRecentUptimeEvents(): Promise<UptimeEvent[]> {
  const rows = await db<UptimeEvent[]>`
    SELECT
      id,
      monitor_name,
      alert_type,
      alert_details,
      occurred_at
    FROM uptime_events
    ORDER BY occurred_at DESC
    LIMIT 20
  `

  return rows
}
