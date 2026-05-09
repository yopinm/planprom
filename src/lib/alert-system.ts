// src/lib/alert-system.ts
// TASK 2.8 — Alert System helpers (server-side only)
//
// Pure functions: isInCooldown, shouldTriggerTargetDeal
// Data functions use direct PostgreSQL.
// Notification: sendNotificationStub (real provider wired in P4-Ext/P5)

import type {
  Alert,
  AlertType,
  AlertChannel,
  AlertLog,
  AlertLogEvent,
} from '@/types'
import { db } from '@/lib/db'

// ---------------------------------------------------------------------------
// Input shapes
// ---------------------------------------------------------------------------

export interface CreateAlertInput {
  product_id?: string | null
  target_price?: number | null
  rare_score_threshold?: number | null
  alert_type: AlertType
  channel?: AlertChannel
  cooldown_minutes?: number
}

export interface UpdateAlertInput {
  target_price?: number | null
  rare_score_threshold?: number | null
  alert_type?: AlertType
  channel?: AlertChannel
  cooldown_minutes?: number
}

export interface RareAlertCandidate {
  product_id: string
  final_score: number
  badge: string | null
}

export interface RareAlertDecisionInput {
  alert: Alert
  candidate: RareAlertCandidate | null
}

export const LINE_NOTIFY_LIMIT_PER_HOUR = 1000
const LINE_NOTIFY_ENDPOINT = 'https://notify-api.line.me/api/notify'

interface LineNotifyWindow {
  count: number
  windowStart: number
}

const lineNotifyRateStore = new Map<string, LineNotifyWindow>()

function lineTokenKey(token: string): string {
  return token.slice(-12)
}

export function canSendLineNotify(token: string, now = Date.now()): boolean {
  const key = lineTokenKey(token)
  const previous = lineNotifyRateStore.get(key)
  const oneHourMs = 60 * 60_000

  if (!previous || now - previous.windowStart >= oneHourMs) {
    lineNotifyRateStore.set(key, { count: 1, windowStart: now })
    return true
  }

  if (previous.count >= LINE_NOTIFY_LIMIT_PER_HOUR) return false
  previous.count++
  return true
}

// ---------------------------------------------------------------------------
// Pure logic — no Supabase (safe for unit tests)
// ---------------------------------------------------------------------------

/**
 * Returns true if the alert is still within its cooldown window
 * (last_triggered_at + cooldown_minutes > now).
 */
export function isInCooldown(alert: Alert): boolean {
  if (!alert.last_triggered_at) return false
  const last = new Date(alert.last_triggered_at).getTime()
  const cooldownMs = alert.cooldown_minutes * 60_000
  return Date.now() < last + cooldownMs
}

/**
 * Returns true if the current price satisfies the alert's trigger condition.
 * - target_deal: current <= target_price
 * - price_drop:  always triggers (caller checks vs moving avg externally)
 * - coupon_expiry: not price-based, always triggers when called
 */
export function shouldTriggerByPrice(
  alert: Alert,
  currentPrice: number,
): boolean {
  if (alert.alert_type === 'target_deal') {
    if (alert.target_price === null) return false
    return currentPrice <= alert.target_price
  }
  // price_drop and coupon_expiry: caller decides — return true by default
  return true
}

/**
 * Full pre-trigger check combining active state + cooldown + price.
 * Returns the reason if the alert should be skipped, or null if it should fire.
 */
export function checkAlertShouldFire(
  alert: Alert,
  currentPrice: number,
): { fire: true } | { fire: false; reason: AlertLogEvent } {
  if (!alert.is_active) {
    return { fire: false, reason: 'skipped_disabled' }
  }
  if (isInCooldown(alert)) {
    return { fire: false, reason: 'skipped_cooldown' }
  }
  if (!shouldTriggerByPrice(alert, currentPrice)) {
    return { fire: false, reason: 'skipped_cooldown' } // price not met — no log noise
  }
  return { fire: true }
}

export function checkRareItemAlertShouldFire(
  input: RareAlertDecisionInput,
): { fire: true; candidate: RareAlertCandidate } | { fire: false; reason: AlertLogEvent } {
  if (!input.alert.is_active) {
    return { fire: false, reason: 'skipped_disabled' }
  }
  if (isInCooldown(input.alert)) {
    return { fire: false, reason: 'skipped_cooldown' }
  }
  if (!input.candidate || input.candidate.badge !== 'rare') {
    return { fire: false, reason: 'skipped_not_rare' }
  }

  const threshold = input.alert.rare_score_threshold ?? 70
  if (input.candidate.final_score < threshold) {
    return { fire: false, reason: 'skipped_not_rare' }
  }

  return { fire: true, candidate: input.candidate }
}

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

/** List all alerts for the authenticated user (active first, then inactive). */
export async function getAlerts(
  userId: string,
): Promise<Alert[]> {
  return db<Alert[]>`
    SELECT *
    FROM alerts
    WHERE user_ref = ${userId}
    ORDER BY is_active DESC, created_at DESC
  `
}

/** Fetch alert logs for a specific alert (latest first, max 20). */
export async function getAlertLogs(
  alertId: string,
): Promise<AlertLog[]> {
  return db<AlertLog[]>`
    SELECT *
    FROM alert_logs
    WHERE alert_id = ${alertId}
    ORDER BY created_at DESC
    LIMIT 20
  `
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/** Create a new alert for the user. */
export async function createAlert(
  userId: string,
  input: CreateAlertInput,
): Promise<Alert> {
  const row = {
    user_ref:         userId,
    product_id:       input.product_id ?? null,
    target_price:     input.target_price ?? null,
    rare_score_threshold: input.rare_score_threshold ?? null,
    alert_type:       input.alert_type,
    channel:          input.channel ?? 'email',
    cooldown_minutes: input.cooldown_minutes ?? 60,
    is_active:        true,
  }

  const [data] = await db<Alert[]>`
    INSERT INTO alerts (
      user_ref,
      product_id,
      target_price,
      rare_score_threshold,
      alert_type,
      channel,
      cooldown_minutes,
      is_active
    )
    VALUES (
      ${row.user_ref},
      ${row.product_id},
      ${row.target_price},
      ${row.rare_score_threshold},
      ${row.alert_type},
      ${row.channel},
      ${row.cooldown_minutes},
      ${row.is_active}
    )
    RETURNING *
  `

  if (!data) throw new Error('Failed to create alert')
  return data
}

/** Update fields on an existing alert (owner RLS enforced). */
export async function updateAlert(
  userId: string,
  alertId: string,
  input: UpdateAlertInput,
): Promise<Alert> {
  // Build partial patch — only include defined fields
  const [data] = await db<Alert[]>`
    UPDATE alerts
    SET target_price = CASE
          WHEN ${input.target_price !== undefined} THEN ${input.target_price ?? null}
          ELSE target_price
        END,
        rare_score_threshold = CASE
          WHEN ${input.rare_score_threshold !== undefined} THEN ${input.rare_score_threshold ?? null}
          ELSE rare_score_threshold
        END,
        alert_type = CASE
          WHEN ${input.alert_type !== undefined} THEN ${input.alert_type ?? null}
          ELSE alert_type
        END,
        channel = CASE
          WHEN ${input.channel !== undefined} THEN ${input.channel ?? null}
          ELSE channel
        END,
        cooldown_minutes = CASE
          WHEN ${input.cooldown_minutes !== undefined} THEN ${input.cooldown_minutes ?? null}
          ELSE cooldown_minutes
        END
    WHERE id = ${alertId}
      AND user_ref = ${userId}
    RETURNING *
  `

  if (!data) throw new Error('Alert not found')
  return data
}

/** Toggle is_active on an alert. */
export async function toggleAlert(
  userId: string,
  alertId: string,
  isActive: boolean,
): Promise<Alert> {
  const [data] = await db<Alert[]>`
    UPDATE alerts
    SET is_active = ${isActive}
    WHERE id = ${alertId}
      AND user_ref = ${userId}
    RETURNING *
  `

  if (!data) throw new Error('Alert not found')
  return data
}

/** Delete an alert (owner RLS enforced). */
export async function deleteAlert(
  userId: string,
  alertId: string,
): Promise<void> {
  await db`
    DELETE FROM alerts
    WHERE id = ${alertId}
      AND user_ref = ${userId}
  `
}

// ---------------------------------------------------------------------------
// Alert log writer
// ---------------------------------------------------------------------------

/** Append a scanner decision to alert_logs. */
export async function logAlertEvent(
  params: {
    alert_id: string
    product_id?: string | null
    current_price?: number | null
    target_price?: number | null
    rare_score_threshold?: number | null
    event: AlertLogEvent
    channel?: AlertChannel | null
  },
): Promise<void> {
  await db`
    INSERT INTO alert_logs (
      alert_id,
      product_id,
      current_price,
      target_price,
      rare_score_threshold,
      event,
      channel
    )
    VALUES (
      ${params.alert_id},
      ${params.product_id ?? null},
      ${params.current_price ?? null},
      ${params.target_price ?? null},
      ${params.rare_score_threshold ?? null},
      ${params.event},
      ${params.channel ?? null}
    )
  `
}
// ---------------------------------------------------------------------------
// Notification stub (real providers wired in P4-Ext / P5)
// ---------------------------------------------------------------------------

export interface NotificationPayload {
  alertId: string
  userId: string
  channel: AlertChannel
  productId: string | null
  currentPrice: number
  targetPrice: number | null
  alertType: AlertType
}

export interface LineNotifyPayload {
  token: string
  message: string
}

export interface LineNotifyResult {
  ok: boolean
  expired: boolean
  message: string | null
}

export async function sendLineNotify(
  payload: LineNotifyPayload,
): Promise<LineNotifyResult> {
  if (!canSendLineNotify(payload.token)) {
    return { ok: false, expired: false, message: 'LINE Notify rate limit exceeded' }
  }

  try {
    const body = new URLSearchParams({ message: payload.message })
    const response = await fetch(LINE_NOTIFY_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${payload.token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    })

    if (response.ok) {
      return { ok: true, expired: false, message: null }
    }

    const expired = response.status === 401
    return {
      ok: false,
      expired,
      message: expired ? 'LINE Notify token expired' : `LINE Notify failed: ${response.status}`,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'LINE Notify request failed'
    return { ok: false, expired: false, message }
  }
}

export function buildRareItemLineMessage(params: {
  productName: string
  productUrl: string
  finalScore: number
  threshold: number
}): string {
  return [
    'Rare item alert',
    params.productName,
    `Score: ${params.finalScore}/100 (threshold ${params.threshold})`,
    params.productUrl,
  ].join('\n')
}

/**
 * Stub notification sender — logs to console.
 * Real implementation:
 *   email → NodeMailer / Resend (P5)
 *   line  → LINE Messaging API (P5)
 *   push  → Web Push / FCM (P5)
 */
export function sendNotificationStub(payload: NotificationPayload): void {
  const { channel, alertType, currentPrice, targetPrice, productId } = payload
  console.log(
    `[alert-stub] NOTIFY via ${channel} | type=${alertType}` +
    ` product=${productId ?? 'n/a'}` +
    ` price=${currentPrice} target=${targetPrice ?? 'n/a'}`,
  )
}

