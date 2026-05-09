export type FbTokenRotationStatusLevel = 'missing' | 'unknown' | 'ok' | 'warning' | 'expired'

export interface FbTokenRotationStatus {
  level: FbTokenRotationStatusLevel
  configured: boolean
  issuedAt: string | null
  rotationDays: number
  ageDays: number | null
  daysRemaining: number | null
  shouldRotate: boolean
  message: string
}

const DEFAULT_ROTATION_DAYS = 60
const WARNING_DAYS = 14

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function parseDate(value: string | undefined): Date | null {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function daysBetween(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / 86_400_000)
}

export function getFbTokenRotationStatus(now: Date = new Date()): FbTokenRotationStatus {
  const configured = !!(process.env.FB_PAGE_ID && process.env.FB_PAGE_ACCESS_TOKEN)
  const rotationDays = parsePositiveInteger(process.env.FB_PAGE_ACCESS_TOKEN_ROTATION_DAYS, DEFAULT_ROTATION_DAYS)
  const issuedAtDate = parseDate(process.env.FB_PAGE_ACCESS_TOKEN_ISSUED_AT)
  const issuedAt = process.env.FB_PAGE_ACCESS_TOKEN_ISSUED_AT ?? null

  if (!configured) {
    return {
      level: 'missing',
      configured,
      issuedAt,
      rotationDays,
      ageDays: null,
      daysRemaining: null,
      shouldRotate: false,
      message: 'Set FB_PAGE_ID and FB_PAGE_ACCESS_TOKEN before enabling Graph API.',
    }
  }

  if (!issuedAtDate) {
    return {
      level: 'unknown',
      configured,
      issuedAt,
      rotationDays,
      ageDays: null,
      daysRemaining: null,
      shouldRotate: true,
      message: 'Set FB_PAGE_ACCESS_TOKEN_ISSUED_AT so admin can warn before the token reaches 60 days.',
    }
  }

  const ageDays = Math.max(0, daysBetween(issuedAtDate, now))
  const daysRemaining = rotationDays - ageDays

  if (daysRemaining <= 0) {
    return {
      level: 'expired',
      configured,
      issuedAt,
      rotationDays,
      ageDays,
      daysRemaining,
      shouldRotate: true,
      message: `Facebook token is ${ageDays} days old. Rotate it now before posting/webhook flows depend on it.`,
    }
  }

  if (daysRemaining <= WARNING_DAYS) {
    return {
      level: 'warning',
      configured,
      issuedAt,
      rotationDays,
      ageDays,
      daysRemaining,
      shouldRotate: true,
      message: `Facebook token has ${daysRemaining} days left before the ${rotationDays}-day rotation target.`,
    }
  }

  return {
    level: 'ok',
    configured,
    issuedAt,
    rotationDays,
    ageDays,
    daysRemaining,
    shouldRotate: false,
    message: `Facebook token rotation is healthy. ${daysRemaining} days remain.`,
  }
}
