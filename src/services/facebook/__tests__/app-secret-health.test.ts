import { afterEach, describe, expect, it } from 'vitest'
import { getFbAppSecretRotationStatus } from '@/services/facebook/app-secret-health'

const ORIGINAL_ENV = { ...process.env }

afterEach((): void => {
  process.env = { ...ORIGINAL_ENV }
})

describe('facebook app secret health', (): void => {
  it('reports missing app secret', (): void => {
    delete process.env.FB_APP_SECRET
    delete process.env.FB_APP_SECRET_ROTATED_AT

    const status = getFbAppSecretRotationStatus()

    expect(status.level).toBe('missing')
    expect(status.shouldRotate).toBe(true)
  })

  it('warns when rotation date is missing', (): void => {
    process.env.FB_APP_SECRET = 'test-secret'
    delete process.env.FB_APP_SECRET_ROTATED_AT

    const status = getFbAppSecretRotationStatus()

    expect(status.level).toBe('unknown')
    expect(status.shouldRotate).toBe(true)
  })

  it('flags rotation before exposure date', (): void => {
    process.env.FB_APP_SECRET = 'test-secret'
    process.env.FB_APP_SECRET_ROTATED_AT = '2026-04-22'

    const status = getFbAppSecretRotationStatus()

    expect(status.level).toBe('exposed')
    expect(status.shouldRotate).toBe(true)
  })

  it('reports ok when rotated after exposure date', (): void => {
    process.env.FB_APP_SECRET = 'test-secret'
    process.env.FB_APP_SECRET_ROTATED_AT = '2026-04-23'

    const status = getFbAppSecretRotationStatus()

    expect(status.level).toBe('ok')
    expect(status.shouldRotate).toBe(false)
  })
})
