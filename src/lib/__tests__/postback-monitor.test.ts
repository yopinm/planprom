import { describe, expect, it } from 'vitest'
import {
  buildPostbackMonitorSummary,
  mapControlBlockedPostback,
  mapRevenuePostback,
} from '@/lib/postback-monitor'

describe('postback monitor mapping', (): void => {
  it('maps verified revenue rows as successful postbacks', (): void => {
    const row = mapRevenuePostback({
      id: 'rev-1',
      platform: 'shopee',
      sub_id: 'search_top_1',
      order_id: 'S-001',
      commission: 42,
      event_type: 'conversion',
      raw_payload: { product_id: 'prod-1' },
      received_at: '2026-04-23T10:00:00.000Z',
    })

    expect(row.status).toBe('success')
    expect(row.reason).toBe('verified')
    expect(row.sub_id).toBe('search_top_1')
    expect(row.product_id).toBe('prod-1')
  })

  it('maps control-blocked postback events as blocked attempts', (): void => {
    const row = mapControlBlockedPostback({
      id: 'event-1',
      event_name: 'control_blocked',
      path: '/api/postback/lazada',
      created_at: '2026-04-23T10:00:00.000Z',
      properties: {
        route: '/api/postback/lazada',
        platform: 'lazada',
        reason: 'settings_disabled',
        order_id: 'L-001',
        sub_id: 'seo_deal',
      },
    })

    expect(row?.status).toBe('blocked')
    expect(row?.platform).toBe('lazada')
    expect(row?.reason).toBe('settings_disabled')
    expect(row?.order_id).toBe('L-001')
  })

  it('ignores non-postback blocked control events', (): void => {
    const row = mapControlBlockedPostback({
      id: 'event-2',
      event_name: 'control_blocked',
      path: '/api/r',
      created_at: '2026-04-23T10:00:00.000Z',
      properties: { route: '/api/r', reason: 'settings_disabled' },
    })

    expect(row).toBeNull()
  })

  it('summarizes successes, blocked attempts, and unattributed rows', (): void => {
    const summary = buildPostbackMonitorSummary([
      mapRevenuePostback({
        id: 'rev-1',
        platform: 'shopee',
        sub_id: null,
        order_id: 'S-001',
        commission: 42,
        event_type: 'conversion',
        raw_payload: {},
        received_at: '2026-04-23T10:00:00.000Z',
      }),
      {
        id: 'blocked:event-1',
        status: 'blocked',
        platform: 'lazada',
        route: '/api/postback/lazada',
        order_id: null,
        sub_id: null,
        commission: null,
        event_type: null,
        reason: 'settings_disabled',
        source_page: null,
        product_id: null,
        occurred_at: '2026-04-23T09:00:00.000Z',
      },
    ])

    expect(summary.successCount).toBe(1)
    expect(summary.blockedCount).toBe(1)
    expect(summary.unattributedCount).toBe(1)
  })
})
