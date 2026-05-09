// src/lib/monitoring.ts
// TASK 5.1 — Monitoring policy, structured logger, and Sentry capture helpers.
// All functions are no-ops when SENTRY_DSN is absent (local / pre-hosting).

import * as Sentry from '@sentry/nextjs'

// ---------------------------------------------------------------------------
// Alert thresholds (policy)
// ---------------------------------------------------------------------------

export const MONITORING_POLICY = {
  // P95 response time before alerting (ms)
  apiLatencyP95Ms: 2_000,
  // Error rate that triggers a Sentry alert (%)
  errorRateThreshold: 5,
  // Health check failure count before page-duty fires
  healthCheckFailures: 3,
  // Affiliate redirect timeout (ms)
  affiliateRedirectTimeoutMs: 5_000,
  // Minimum uptime SLA (%)
  uptimeSlaPercent: 99.5,
} as const

// ---------------------------------------------------------------------------
// Log levels
// ---------------------------------------------------------------------------

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogPayload {
  msg: string
  [key: string]: unknown
}

function log(level: LogLevel, payload: LogPayload): void {
  const entry = JSON.stringify({ level, ts: new Date().toISOString(), ...payload })
  if (level === 'error' || level === 'warn') {
    console.error(entry)
  } else {
    console.log(entry)
  }
}

export const logger = {
  debug: (payload: LogPayload) => log('debug', payload),
  info:  (payload: LogPayload) => log('info',  payload),
  warn:  (payload: LogPayload) => log('warn',  payload),
  error: (payload: LogPayload) => log('error', payload),
}

// ---------------------------------------------------------------------------
// Sentry capture helpers
// ---------------------------------------------------------------------------

/** Capture a non-fatal error with structured context. */
export function captureError(
  err: unknown,
  context?: Record<string, unknown>,
): void {
  if (err instanceof Error) {
    Sentry.withScope((scope) => {
      if (context) scope.setExtras(context)
      Sentry.captureException(err)
    })
  }
  logger.error({ msg: String(err), ...context })
}

/** Record a custom metric as a Sentry breadcrumb (pre-hosting: just logs). */
export function recordMetric(
  name: string,
  value: number,
  unit: 'ms' | 'count' | 'percent' = 'count',
): void {
  Sentry.addBreadcrumb({ category: 'metric', message: name, data: { value, unit } })
  logger.info({ msg: 'metric', name, value, unit })
}

// ---------------------------------------------------------------------------
// Health check helpers (used by /api/health)
// ---------------------------------------------------------------------------

export type HealthStatus = 'ok' | 'degraded' | 'error'

export interface HealthCheckResult {
  status: HealthStatus
  checks: Record<string, { ok: boolean; latencyMs?: number; detail?: string }>
}

/** Run a timed check. Returns { ok, latencyMs, detail? }. */
export async function timedCheck(
  label: string,
  fn: () => Promise<void>,
): Promise<{ ok: boolean; latencyMs: number; detail?: string }> {
  const start = Date.now()
  try {
    await fn()
    return { ok: true, latencyMs: Date.now() - start }
  } catch (err) {
    return { ok: false, latencyMs: Date.now() - start, detail: String(err) }
  }
}
