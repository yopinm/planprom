import { afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const ORIGINAL_ENV = { ...process.env }

afterEach((): void => {
  process.env = { ...ORIGINAL_ENV }
  vi.resetModules()
  vi.clearAllMocks()
})

describe('postback admin control guard', (): void => {
  it('blocks Shopee postbacks before revenue writes when postback tracking is disabled', async (): Promise<void> => {
    process.env.REVENUE_WEBHOOK_SECRET = 'test-secret'

    const logControlBlockedAttempt = vi.fn(() => Promise.resolve())
    vi.doMock('@/lib/admin-control-runtime', () => ({
      getRuntimeAdminControlStatus: vi.fn(() => Promise.resolve({
        enabled: false,
        reason: 'settings_disabled',
        message: 'Postback Tracking is disabled in admin control flags.',
      })),
      logControlBlockedAttempt,
    }))

    vi.doMock('@/lib/supabase/server', () => ({
      createAdminClient: vi.fn(() => ({
        from: vi.fn(() => ({
          upsert: vi.fn(),
        })),
      })),
    }))

    const { POST } = await import('@/app/api/postback/shopee/route')
    const req = new NextRequest('http://localhost/api/postback/shopee', {
      method: 'POST',
      body: JSON.stringify({ sub_id: 'search_top_1', order_id: 'S-001', commission: 12 }),
    })

    const res = await POST(req)
    const body = await res.json() as { error: string; reason: string }

    expect(res.status).toBe(503)
    expect(body.error).toBe('Postback tracking disabled')
    expect(body.reason).toBe('settings_disabled')
    expect(logControlBlockedAttempt).toHaveBeenCalledWith(expect.objectContaining({
      flagKey: 'postback_tracking',
      route: '/api/postback/shopee',
      reason: 'settings_disabled',
    }))
  })

  it('blocks AccessTrade GET postbacks when postback tracking is disabled', async (): Promise<void> => {
    process.env.REVENUE_WEBHOOK_SECRET = 'test-secret'

    const logControlBlockedAttempt = vi.fn(() => Promise.resolve())
    vi.doMock('@/lib/admin-control-runtime', () => ({
      getRuntimeAdminControlStatus: vi.fn(() => Promise.resolve({
        enabled: false,
        reason: 'settings_disabled',
        message: 'Postback Tracking is disabled in admin control flags.',
      })),
      logControlBlockedAttempt,
    }))

    vi.doMock('@/lib/db', () => ({
      db: Object.assign(vi.fn(), { json: vi.fn((v: unknown) => v) }),
    }))

    const { GET } = await import('@/app/api/postback/accesstrade/route')
    const req = new NextRequest(
      'http://localhost/api/postback/accesstrade?aff_sub=home_top&order_id=AT-001&commission=25&status=approved&token=test-secret',
    )

    const res = await GET(req)
    const body = await res.json() as { ok: boolean; provider: string; mode: string }

    expect(res.status).toBe(200)
    expect(body.mode).toBe('validation')
    expect(logControlBlockedAttempt).toHaveBeenCalledWith(expect.objectContaining({
      flagKey: 'postback_tracking',
      route:   '/api/postback/accesstrade',
      reason:  'settings_disabled',
    }))
  })

  it('blocks Lazada postbacks before revenue writes when postback tracking is disabled', async (): Promise<void> => {
    process.env.REVENUE_WEBHOOK_SECRET = 'test-secret'

    const logControlBlockedAttempt = vi.fn(() => Promise.resolve())
    vi.doMock('@/lib/admin-control-runtime', () => ({
      getRuntimeAdminControlStatus: vi.fn(() => Promise.resolve({
        enabled: false,
        reason: 'settings_disabled',
        message: 'Postback Tracking is disabled in admin control flags.',
      })),
      logControlBlockedAttempt,
    }))

    vi.doMock('@/lib/supabase/server', () => ({
      createAdminClient: vi.fn(() => ({
        from: vi.fn(() => ({
          upsert: vi.fn(),
        })),
      })),
    }))

    const { POST } = await import('@/app/api/postback/lazada/route')
    const req = new NextRequest('http://localhost/api/postback/lazada', {
      method: 'POST',
      body: JSON.stringify({ sub_id: 'search_top_1', order_id: 'L-001', commission: 12 }),
    })

    const res = await POST(req)
    const body = await res.json() as { error: string; reason: string }

    expect(res.status).toBe(503)
    expect(body.error).toBe('Postback tracking disabled')
    expect(body.reason).toBe('settings_disabled')
    expect(logControlBlockedAttempt).toHaveBeenCalledWith(expect.objectContaining({
      flagKey: 'postback_tracking',
      route: '/api/postback/lazada',
      reason: 'settings_disabled',
    }))
  })
})
