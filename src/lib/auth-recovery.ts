export interface RecoveryHashParams {
  accessToken: string
  refreshToken: string
  type: string | null
}

export interface PasswordValidationResult {
  ok: boolean
  message: string | null
}

const MIN_PASSWORD_LENGTH = 8

export function parseRecoveryHash(hash: string): RecoveryHashParams | null {
  const normalizedHash = hash.startsWith('#') ? hash.slice(1) : hash
  if (!normalizedHash) return null

  const params = new URLSearchParams(normalizedHash)
  const accessToken = params.get('access_token')
  const refreshToken = params.get('refresh_token')

  if (!accessToken || !refreshToken) return null

  return {
    accessToken,
    refreshToken,
    type: params.get('type'),
  }
}

export function isPasswordRecoveryHash(hash: string): boolean {
  const parsed = parseRecoveryHash(hash)
  return parsed?.type === 'recovery'
}

export function buildRecoveryRedirectPath(hash: string): string | null {
  if (!isPasswordRecoveryHash(hash)) return null
  return `/auth/reset-password${hash.startsWith('#') ? hash : `#${hash}`}`
}

export function validateNewPassword(
  password: string,
  confirmPassword: string
): PasswordValidationResult {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    }
  }

  if (password !== confirmPassword) {
    return {
      ok: false,
      message: 'Passwords do not match.',
    }
  }

  return { ok: true, message: null }
}
