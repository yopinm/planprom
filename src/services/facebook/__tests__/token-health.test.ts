import { afterEach, describe, expect, it } from 'vitest'
import { getFbTokenRotationStatus } from '@/services/facebook/token-health'

const ORIGINAL_ENV = { ...process.env }
const NOW = new Date('2026-04-23T00:00:00.000Z')

afterEach((): void => {
  process.env = { ...ORIGINAL_ENV }
})

describe('facebook token health', (): void => {
  it('reports missing configuration', (): void => {
    delete process.env.FB_PAGE_ID
    delete process.env.FB_PAGE_ACCESS_TOKEN

    const status = getFbTokenRotationStatus(NOW)

    expect(status.level).toBe('missing')
    expect(status.shouldRotate).toBe(false)
  })

  it('warns when issued date is missing', (): void => {
    process.env.FB_PAGE_ID = '123'
    process.env.FB_PAGE_ACCESS_TOKEN = 'token'
    delete process.env.FB_PAGE_ACCESS_TOKEN_ISSUED_AT

    const status = getFbTokenRotationStatus(NOW)

    expect(status.level).toBe('unknown')
    expect(status.shouldRotate).toBe(true)
  })

  it('reports healthy, warning, and expired rotation windows', (): void => {
    process.env.FB_PAGE_ID = '123'
    process.env.FB_PAGE_ACCESS_TOKEN = 'token'

    process.env.FB_PAGE_ACCESS_TOKEN_ISSUED_AT = '2026-04-01'
    expect(getFbTokenRotationStatus(NOW).level).toBe('ok')

    process.env.FB_PAGE_ACCESS_TOKEN_ISSUED_AT = '2026-03-08'
    expect(getFbTokenRotationStatus(NOW).level).toBe('warning')

    process.env.FB_PAGE_ACCESS_TOKEN_ISSUED_AT = '2026-02-01'
    expect(getFbTokenRotationStatus(NOW).level).toBe('expired')
  })
})
