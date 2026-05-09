import { afterEach, describe, expect, it, vi } from 'vitest'

const ORIGINAL_ENV = { ...process.env }

afterEach((): void => {
  process.env = { ...ORIGINAL_ENV }
  vi.resetModules()
  vi.clearAllMocks()
})

describe('admin alerts/postbacks page fallbacks', (): void => {
  it('keeps /admin/alerts renderable when signal queries reject with a PostgREST error', async (): Promise<void> => {
    process.env = { ...ORIGINAL_ENV, USE_MOCK_DATA: 'false' }

    vi.doMock('@/lib/admin-auth', () => ({
      requireAdminSession: vi.fn(async () => 'admin-user'),
    }))

    vi.doMock('@/lib/supabase/server', () => ({
      createAdminClient: vi.fn(() => ({
        from: (table: string) => {
          if (table === 'admin_alert_rules') {
            return {
              select: () => ({
                order: async () => ({
                  data: null,
                  error: { code: '42P01', details: null, hint: null, message: 'missing relation' },
                }),
              }),
            }
          }

          if (table === 'admin_alert_rule_audit_logs') {
            return {
              select: () => ({
                order: () => ({
                  limit: async () => ({
                    data: null,
                    error: { code: '42P01', details: null, hint: null, message: 'missing relation' },
                  }),
                }),
              }),
            }
          }

          if (table === 'analytics_events' || table === 'product_link_checks' || table === 'v_funnel_flow') {
            return {
              select: () => ({
                eq: () => ({
                  in: () => ({
                    gte: async () => ({
                      data: null,
                      error: { code: '42P01', details: null, hint: null, message: `${table} missing` },
                      count: null,
                    }),
                  }),
                  gte: async () => ({
                    data: null,
                    error: { code: '42P01', details: null, hint: null, message: `${table} missing` },
                    count: null,
                  }),
                }),
                gt: () => ({
                  gte: async () => ({
                    data: null,
                    error: { code: '42P01', details: null, hint: null, message: `${table} missing` },
                  }),
                }),
              }),
            }
          }

          throw new Error(`Unhandled table ${table}`)
        },
      })),
    }))

    const mod = await import('@/app/admin/alerts/page')

    await expect(mod.default()).resolves.toBeTruthy()
  })

  it('keeps /admin/postbacks renderable when monitor lookup rejects with a PostgREST error', async (): Promise<void> => {
    process.env = { ...ORIGINAL_ENV, USE_MOCK_DATA: 'false' }

    vi.doMock('@/lib/admin-auth', () => ({
      requireAdminSession: vi.fn(async () => 'admin-user'),
    }))

    vi.doMock('@/lib/postback-monitor', async () => {
      const actual = await vi.importActual<typeof import('@/lib/postback-monitor')>('@/lib/postback-monitor')
      return {
        ...actual,
        getPostbackMonitor: vi.fn(async () => {
          throw { code: '42P01', details: null, hint: null, message: 'revenue_tracking missing' }
        }),
      }
    })

    const mod = await import('@/app/admin/postbacks/page')

    await expect(mod.default()).resolves.toBeTruthy()
  })
})
