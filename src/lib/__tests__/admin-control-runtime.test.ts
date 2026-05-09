import { afterEach, describe, expect, it, vi } from 'vitest'
import { getAdminControlStatus } from '@/lib/admin-control'

const ORIGINAL_ENV = { ...process.env }

afterEach((): void => {
  process.env = { ...ORIGINAL_ENV }
  vi.resetModules()
  vi.clearAllMocks()
})

describe('admin control runtime status', (): void => {
  it('blocks affiliate redirect when the central flag is off', (): void => {
    const status = getAdminControlStatus('affiliate_redirect', { is_enabled: false })

    expect(status.enabled).toBe(false)
    expect(status.reason).toBe('settings_disabled')
    expect(status.message).toContain('Affiliate Redirect')
  })

  it('allows postback tracking when the central flag is on', (): void => {
    const status = getAdminControlStatus('postback_tracking', { is_enabled: true })

    expect(status.enabled).toBe(true)
    expect(status.reason).toBe('enabled')
  })

  it('uses the safe default when no row exists', (): void => {
    const affiliateStatus = getAdminControlStatus('affiliate_redirect', null)
    const netPriceStatus = getAdminControlStatus('net_price_calculation', null)

    expect(affiliateStatus.enabled).toBe(false)
    expect(netPriceStatus.enabled).toBe(true)
  })

  it('keeps public routes available if maintenance row is absent', async (): Promise<void> => {
    vi.doMock('@/lib/db', () => ({
      db: vi.fn().mockResolvedValue([]),
    }))
    const { getMaintenanceModeStatus } = await import('@/lib/admin-control-runtime')

    const status = await getMaintenanceModeStatus()

    expect(status.enabled).toBe(false)
    expect(status.reason).toBe('settings_disabled')
  })

  it('treats enabled maintenance flag as active route maintenance', async (): Promise<void> => {
    vi.doMock('@/lib/db', () => ({
      db: vi.fn().mockResolvedValue([{ is_enabled: true }]),
    }))
    const { getMaintenanceModeStatus } = await import('@/lib/admin-control-runtime')

    const status = await getMaintenanceModeStatus()

    expect(status.enabled).toBe(true)
    expect(status.reason).toBe('enabled')
  })

  it('keeps public routes available if maintenance lookup fails', async (): Promise<void> => {
    vi.doMock('@/lib/db', () => ({
      db: vi.fn().mockRejectedValue(new Error('db unavailable')),
    }))
    const { getMaintenanceModeStatus } = await import('@/lib/admin-control-runtime')

    const status = await getMaintenanceModeStatus()

    expect(status.enabled).toBe(false)
    expect(status.reason).toBe('lookup_failed')
  })
})
