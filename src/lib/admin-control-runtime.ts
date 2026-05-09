import {
  getAdminControlStatus,
  type AdminControlFlagKey,
  type AdminControlStatus,
} from '@/lib/admin-control'
import { db } from '@/lib/db'

export interface ControlBlockedAttempt {
  flagKey: AdminControlFlagKey
  route: string
  reason: string
  method: string
  metadata?: Record<string, unknown>
}

interface ControlFlagRow {
  is_enabled: boolean | null
}

type DbJsonValue = Parameters<typeof db.json>[0]

export async function getRuntimeAdminControlStatus(
  flagKey: AdminControlFlagKey,
): Promise<AdminControlStatus> {
  try {
    const [data] = await db<ControlFlagRow[]>`
      SELECT is_enabled
      FROM admin_control_flags
      WHERE flag_key = ${flagKey}
      LIMIT 1
    `

    return getAdminControlStatus(flagKey, data)
  } catch {
    return {
      enabled: false,
      reason: 'lookup_failed',
      message: 'Admin control flag lookup failed; blocking risky operation.',
    }
  }
}

export async function getMaintenanceModeStatus(): Promise<AdminControlStatus> {
  try {
    const [data] = await db<ControlFlagRow[]>`
      SELECT is_enabled
      FROM admin_control_flags
      WHERE flag_key = 'maintenance_mode'
      LIMIT 1
    `

    return getAdminControlStatus('maintenance_mode', data)
  } catch {
    return {
      enabled: false,
      reason: 'lookup_failed',
      message: 'Maintenance mode lookup failed; public routes remain available.',
    }
  }
}

export async function logControlBlockedAttempt(input: ControlBlockedAttempt): Promise<void> {
  try {
    await db`
      INSERT INTO analytics_events (event_name, properties, path)
      VALUES (
        'control_blocked',
        ${db.json({
          flag_key: input.flagKey,
          route: input.route,
          reason: input.reason,
          method: input.method,
          ...(input.metadata ?? {}),
        } as DbJsonValue)},
        ${input.route}
      )
    `
  } catch {
    // Control logging must not mask the original block response.
  }
}
