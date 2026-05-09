export type FbAppSecretRotationStatusLevel = 'missing' | 'unknown' | 'exposed' | 'ok'

export interface FbAppSecretRotationStatus {
  level: FbAppSecretRotationStatusLevel
  configured: boolean
  rotatedAt: string | null
  exposedOn: string
  shouldRotate: boolean
  message: string
}

const EXPOSED_ON = '2026-04-23'

function parseDate(value: string | undefined): Date | null {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function getFbAppSecretRotationStatus(): FbAppSecretRotationStatus {
  const configured = !!process.env.FB_APP_SECRET
  const rotatedAt = process.env.FB_APP_SECRET_ROTATED_AT ?? null
  const rotatedAtDate = parseDate(process.env.FB_APP_SECRET_ROTATED_AT)
  const exposedDate = new Date(`${EXPOSED_ON}T00:00:00.000Z`)

  if (!configured) {
    return {
      level: 'missing',
      configured,
      rotatedAt,
      exposedOn: EXPOSED_ON,
      shouldRotate: true,
      message: 'Set FB_APP_SECRET before registering the production webhook.',
    }
  }

  if (!rotatedAtDate) {
    return {
      level: 'unknown',
      configured,
      rotatedAt,
      exposedOn: EXPOSED_ON,
      shouldRotate: true,
      message: 'Set FB_APP_SECRET_ROTATED_AT after regenerating the Meta App Secret.',
    }
  }

  if (rotatedAtDate.getTime() < exposedDate.getTime()) {
    return {
      level: 'exposed',
      configured,
      rotatedAt,
      exposedOn: EXPOSED_ON,
      shouldRotate: true,
      message: `Meta App Secret was last rotated before the ${EXPOSED_ON} exposure; regenerate it before production.`,
    }
  }

  return {
    level: 'ok',
    configured,
    rotatedAt,
    exposedOn: EXPOSED_ON,
    shouldRotate: false,
    message: `Meta App Secret rotation recorded on ${rotatedAt}.`,
  }
}
