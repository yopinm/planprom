import { afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { buildSubId } from '@/lib/sub-id'

const ORIGINAL_ENV = { ...process.env }

interface MockProductRecord {
  id: string
  name: string
  platform: 'shopee' | 'lazada'
  affiliate_url: string
  url: string
  is_active: boolean
  shop_name: string | null
  image_url: string | null
  price_current: number
  price_original: number | null
}

interface MockClickRow {
  id: string
  product_id: string
  platform: string
  source_page: string
  query: string | null
  sub_id: string | null
  session_id: string | null
  user_agent: string | null
  ip_hash: string | null
  clicked_at: string
}

interface MockRevenueRow {
  id: string
  platform: string
  sub_id: string | null
  order_id: string | null
  commission: number
  event_type: string
  raw_payload: Record<string, unknown>
  received_at: string
}

function flushAsyncWork(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0)
  })
}

interface ProductsQuery {
  select(): ProductsQuery
  eq(column: string, value: unknown): ProductsQuery
  single(): Promise<{ data: MockProductRecord | null; error: Error | null }>
}

function createProductsQuery(products: MockProductRecord[]): ProductsQuery {
  const filters = new Map<string, unknown>()

  return {
    select(): ProductsQuery {
      return this
    },
    eq(column: string, value: unknown): ProductsQuery {
      filters.set(column, value)
      return this
    },
    async single(): Promise<{ data: MockProductRecord | null; error: Error | null }> {
      const match = products.find((product) =>
        Array.from(filters.entries()).every(([column, value]) => {
          const productValue = product[column as keyof MockProductRecord]
          return productValue === value
        }),
      ) ?? null

      return {
        data: match,
        error: match ? null : new Error('Product not found'),
      }
    },
  }
}

interface AttributionRow {
  revenue_id: string
  platform: string
  sub_id: string | null
  order_id: string | null
  commission: number
  received_at: string
  click_id: string | null
  product_id: string | null
  source_page: string | null
  query: string | null
  session_id: string | null
  clicked_at: string | null
}

interface AttributionDetailQuery {
  select(): AttributionDetailQuery
  eq(column: string, value: string): AttributionDetailQuery
  order(): Promise<{ data: AttributionRow[]; error: null }>
}

function createAttributionDetailQuery(clicks: MockClickRow[], revenueRows: MockRevenueRow[]): AttributionDetailQuery {
  let subIdFilter: string | null = null

  return {
    select(): AttributionDetailQuery {
      return this
    },
    eq(column: string, value: string): AttributionDetailQuery {
      if (column === 'sub_id') {
        subIdFilter = value
      }
      return this
    },
    async order(): Promise<{ data: AttributionRow[]; error: null }> {
      const filteredRevenue = revenueRows.filter((row) => row.sub_id === subIdFilter)

      const data = filteredRevenue.map((row) => {
        const matchingClicks = clicks
          .filter((click) => click.sub_id === row.sub_id && click.platform === row.platform)
          .sort((left, right) => right.clicked_at.localeCompare(left.clicked_at))
        const latestClick = matchingClicks[0] ?? null

        return {
          revenue_id: row.id,
          platform: row.platform,
          sub_id: row.sub_id,
          order_id: row.order_id,
          commission: row.commission,
          received_at: row.received_at,
          click_id: latestClick?.id ?? null,
          product_id: latestClick?.product_id ?? null,
          source_page: latestClick?.source_page ?? null,
          query: latestClick?.query ?? null,
          session_id: latestClick?.session_id ?? null,
          clicked_at: latestClick?.clicked_at ?? null,
        }
      })

      return { data, error: null }
    },
  }
}

afterEach((): void => {
  process.env = { ...ORIGINAL_ENV }
  vi.resetModules()
  vi.clearAllMocks()
})

describe('QA-E2E-SMOKE-1 revenue loop', (): void => {
  it('links a search CTA click to a simulated Shopee postback through sub_id attribution', async (): Promise<void> => {
    process.env = {
      ...ORIGINAL_ENV,
      USE_MOCK_DATA: 'false',
      REVENUE_WEBHOOK_SECRET: 'test-secret',
    }

    const products: MockProductRecord[] = [
      {
        id: 'prod-iphone-1',
        name: 'iPhone Flash Deal',
        platform: 'shopee',
        affiliate_url: 'https://shopee.co.th/product/1',
        url: 'https://shopee.co.th/product/1',
        is_active: true,
        shop_name: 'Couponkum Shop',
        image_url: null,
        price_current: 19990,
        price_original: 24990,
      },
    ]
    const clickLogs: MockClickRow[] = []
    const revenueRows: MockRevenueRow[] = []

    vi.doMock('@/lib/db', () => {
      const db = async (strings: TemplateStringsArray, ...values: unknown[]): Promise<unknown[]> => {
        const sql = strings.join('?')

        if (sql.includes('FROM products')) {
          const id = values[0]
          return products.filter(product => product.id === id && product.is_active)
        }

        if (sql.includes('INSERT INTO click_logs')) {
          clickLogs.push({
            id: `click-${clickLogs.length + 1}`,
            product_id: values[0] as string,
            platform: values[1] as string,
            source_page: values[2] as string,
            query: values[3] as string | null,
            sub_id: values[4] as string | null,
            session_id: values[5] as string | null,
            user_agent: values[6] as string | null,
            ip_hash: values[7] as string | null,
            clicked_at: values[8] as string,
          })
          return []
        }

        if (sql.includes('INSERT INTO revenue_tracking')) {
          revenueRows.push({
            id: `rev-${revenueRows.length + 1}`,
            platform: 'shopee',
            sub_id: values[0] as string | null,
            order_id: values[1] as string | null,
            commission: values[2] as number,
            event_type: values[3] as string,
            raw_payload: values[5] as Record<string, unknown>,
            received_at: new Date(`2026-04-24T0${revenueRows.length}:00:00.000Z`).toISOString(),
          })
          return []
        }

        if (sql.includes('UPDATE revenue_tracking')) {
          return []
        }

        throw new Error(`Unhandled db query: ${sql}`)
      }

      return {
        db: Object.assign(db, {
          json: (value: unknown): unknown => value,
        }),
      }
    })

    vi.doMock('@/lib/supabase/server', () => ({
      createAdminClient: vi.fn(() => ({
        from: (table: string) => {
          if (table === 'products') {
            return createProductsQuery(products)
          }

          if (table === 'click_logs') {
            return {
              insert: vi.fn(async (row: Omit<MockClickRow, 'id'>) => {
                clickLogs.push({
                  id: `click-${clickLogs.length + 1}`,
                  ...row,
                })
                return { error: null }
              }),
            }
          }

          if (table === 'revenue_tracking') {
            return {
              upsert: vi.fn(async (row: Omit<MockRevenueRow, 'id' | 'received_at'>) => {
                revenueRows.push({
                  id: `rev-${revenueRows.length + 1}`,
                  received_at: new Date(`2026-04-24T0${revenueRows.length}:00:00.000Z`).toISOString(),
                  ...row,
                })
                return { error: null }
              }),
            }
          }

          if (table === 'v_revenue_attribution_detail') {
            return createAttributionDetailQuery(clickLogs, revenueRows)
          }

          throw new Error(`Unhandled mock table: ${table}`)
        },
      })),
    }))

    vi.doMock('@/lib/admin-control-runtime', () => ({
      getMaintenanceModeStatus: vi.fn(() => Promise.resolve({
        enabled: false,
        reason: 'settings_disabled',
        message: 'Maintenance Mode is disabled in admin control flags.',
      })),
      getRuntimeAdminControlStatus: vi.fn(() => Promise.resolve({
        enabled: true,
        reason: 'enabled',
        message: 'Runtime control is enabled.',
      })),
      logControlBlockedAttempt: vi.fn(() => Promise.resolve()),
    }))

    vi.doMock('@/lib/bot-detection', () => ({
      checkBotAndRateLimit: vi.fn(() => ({ allowed: true })),
    }))

    vi.doMock('@/lib/link-health', () => ({
      SsrfBlockedError: class SsrfBlockedError extends Error {},
      getCachedHealth: vi.fn(() => null),
      refreshAsync: vi.fn(),
      assertAllowedUrl: vi.fn(),
    }))

    vi.doMock('@/lib/analytics', () => ({
      logAnalyticsEvent: vi.fn(),
    }))

    vi.doMock('@/lib/platforms/tiktok', () => ({
      resolveTiktokShortLink: vi.fn(async () => null),
    }))

    const [{ GET }, { POST }, { getAttributionBySubId }, { computeHmac }] = await Promise.all([
      import('@/app/api/r/route'),
      import('@/app/api/postback/shopee/route'),
      import('@/lib/revenue-attribution'),
      import('@/lib/postback-verify'),
    ])

    const subId = buildSubId('search', { rank: 1 })
    const redirectRequest = new NextRequest(
      `http://localhost/api/r?id=prod-iphone-1&platform=shopee&source=search&q=iphone&sub_id=${subId}`,
      {
        headers: {
          'x-forwarded-for': '203.0.113.10',
          'x-session-id': 'session-e2e-1',
          'user-agent': 'vitest-agent',
        },
      },
    )

    const redirectResponse = await GET(redirectRequest)

    expect(redirectResponse.status).toBe(302)
    // REV-01: sub_id must be injected into the outgoing affiliate URL
    expect(redirectResponse.headers.get('location')).toBe(`https://shopee.co.th/product/1?sub_id=${subId}`)
    expect(redirectResponse.headers.get('x-redirect-product')).toBe('prod-iphone-1')
    expect(redirectResponse.headers.get('x-redirect-platform')).toBe('shopee')

    await flushAsyncWork()

    expect(clickLogs).toHaveLength(1)
    expect(clickLogs[0]).toMatchObject({
      product_id: 'prod-iphone-1',
      platform: 'shopee',
      source_page: 'search',
      query: 'iphone',
      sub_id: subId,
      session_id: 'session-e2e-1',
    })

    const postbackPayload = JSON.stringify({
      sub_id: subId,
      order_id: 'SP-240424-001',
      commission: 120,
      conversion_type: 'conversion',
    })
    const signature = computeHmac('test-secret', postbackPayload)
    const postbackRequest = new NextRequest('http://localhost/api/postback/shopee', {
      method: 'POST',
      body: postbackPayload,
      headers: {
        'x-shopee-signature': signature,
      },
    })

    const postbackResponse = await POST(postbackRequest)

    expect(postbackResponse.status).toBe(200)
    expect(await postbackResponse.json()).toEqual({ ok: true })
    expect(revenueRows).toHaveLength(1)
    expect(revenueRows[0]).toMatchObject({
      platform: 'shopee',
      sub_id: subId,
      order_id: 'SP-240424-001',
      commission: 120,
      event_type: 'conversion',
    })

    const attributedRows = await getAttributionBySubId(subId)

    expect(attributedRows).toHaveLength(1)
    expect(attributedRows[0]).toMatchObject({
      platform: 'shopee',
      sub_id: subId,
      order_id: 'SP-240424-001',
      commission: 120,
      click_id: 'click-1',
      product_id: 'prod-iphone-1',
      source_page: 'search',
      query: 'iphone',
      session_id: 'session-e2e-1',
    })
  })
})
