import { describe, expect, it } from 'vitest'

import {
  buildRecoveryRedirectPath,
  isPasswordRecoveryHash,
  parseRecoveryHash,
  validateNewPassword,
} from '../auth-recovery'

describe('parseRecoveryHash', () => {
  it('extracts Supabase recovery tokens without exposing other hash fields', () => {
    const parsed = parseRecoveryHash(
      '#access_token=token-1&refresh_token=refresh-1&type=recovery&expires_in=3600'
    )

    expect(parsed).toEqual({
      accessToken: 'token-1',
      refreshToken: 'refresh-1',
      type: 'recovery',
    })
  })

  it('returns null when required tokens are missing', () => {
    expect(parseRecoveryHash('#type=recovery')).toBeNull()
    expect(parseRecoveryHash('')).toBeNull()
  })
})

describe('isPasswordRecoveryHash', () => {
  it('accepts only recovery hashes', () => {
    expect(
      isPasswordRecoveryHash('#access_token=a&refresh_token=b&type=recovery')
    ).toBe(true)
    expect(
      isPasswordRecoveryHash('#access_token=a&refresh_token=b&type=magiclink')
    ).toBe(false)
  })
})

describe('buildRecoveryRedirectPath', () => {
  it('preserves the hash when moving root recovery links to the reset page', () => {
    expect(
      buildRecoveryRedirectPath('#access_token=a&refresh_token=b&type=recovery')
    ).toBe('/auth/reset-password#access_token=a&refresh_token=b&type=recovery')
  })

  it('rejects non-recovery hashes', () => {
    expect(buildRecoveryRedirectPath('#access_token=a&refresh_token=b&type=signup')).toBeNull()
  })
})

describe('validateNewPassword', () => {
  it('requires a minimum length and matching confirmation', () => {
    expect(validateNewPassword('short', 'short')).toEqual({
      ok: false,
      message: 'Password must be at least 8 characters.',
    })
    expect(validateNewPassword('long-enough', 'different')).toEqual({
      ok: false,
      message: 'Passwords do not match.',
    })
    expect(validateNewPassword('long-enough', 'long-enough')).toEqual({
      ok: true,
      message: null,
    })
  })
})
