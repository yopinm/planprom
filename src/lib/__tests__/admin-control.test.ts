import { describe, expect, it } from 'vitest'
import {
  ADMIN_CONTROL_FLAGS,
  countDisabledRiskyFlags,
  getDefaultAdminControlFlags,
  isAdminControlFlagKey,
  mergeAdminControlFlags,
} from '@/lib/admin-control'

describe('admin control registry', (): void => {
  it('contains the launch control flags required by ADMIN-CONTROL-1', (): void => {
    const keys = ADMIN_CONTROL_FLAGS.map(flag => flag.flag_key)

    expect(keys).toContain('net_price_calculation')
    expect(keys).toContain('ai_ranking')
    expect(keys).toContain('lazada_real_data')
    expect(keys).toContain('affiliate_redirect')
    expect(keys).toContain('postback_tracking')
    expect(keys).toContain('maintenance_mode')
  })

  it('defaults risky revenue and AI controls to off', (): void => {
    const flags = getDefaultAdminControlFlags()

    expect(flags.find(flag => flag.flag_key === 'net_price_calculation')?.is_enabled).toBe(true)
    expect(flags.find(flag => flag.flag_key === 'ai_ranking')?.is_enabled).toBe(false)
    expect(flags.find(flag => flag.flag_key === 'affiliate_redirect')?.is_enabled).toBe(false)
    expect(flags.find(flag => flag.flag_key === 'postback_tracking')?.is_enabled).toBe(false)
  })

  it('merges persisted values without losing registry labels', (): void => {
    const flags = mergeAdminControlFlags([
      {
        flag_key: 'affiliate_redirect',
        label: 'Old label',
        is_enabled: true,
        updated_by: 'admin-user',
        updated_at: '2026-04-23T08:00:00.000Z',
      },
    ])

    const affiliateFlag = flags.find(flag => flag.flag_key === 'affiliate_redirect')

    expect(affiliateFlag?.label).toBe('Affiliate Redirect')
    expect(affiliateFlag?.is_enabled).toBe(true)
    expect(affiliateFlag?.updated_by).toBe('admin-user')
  })

  it('validates known flag keys and counts disabled high-risk controls', (): void => {
    const flags = getDefaultAdminControlFlags()

    expect(isAdminControlFlagKey('postback_tracking')).toBe(true)
    expect(isAdminControlFlagKey('unknown_flag')).toBe(false)
    expect(countDisabledRiskyFlags(flags)).toBe(3)
  })
})
