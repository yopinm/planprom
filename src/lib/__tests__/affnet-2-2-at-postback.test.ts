// AFFNET-2.2 — AccessTrade postback route unit tests

import { afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const ORIGINAL_ENV = { ...process.env }

afterEach((): void => {
  process.env = { ...ORIGINAL_ENV }
  vi.resetModules()
  vi.clearAllMocks()
})

function makeDbMock() {
  const dbFn = vi.fn(() => Promise.resolve([]))
  return Object.assign(dbFn, { json: vi.fn((v: unknown) => v) })
}

function makeControlMock(enabled: boolean) {
  return {
    getRuntimeAdminControlStatus: vi.fn(() => Promise.resolve({ enabled, reason: 'test' })),
    logControlBlockedAttempt: vi.fn(() => Promise.resolve()),
  }
}

function atUrl(params: Record<string, string>): NextRequest {
  const sp = new URLSearchParams(params).toString()
  return new NextRequest(`http://localhost/api/postback/accesstrade?${sp}`)
}

describe('GET /api/postback/accesstrade', () => {
  it('returns 503 when secret is not configured', async () => {
    process.env.REVENUE_WEBHOOK_SECRET = ''
    vi.doMock('@/lib/admin-control-runtime', () => makeControlMock(true))
    vi.doMock('@/lib/db', () => ({ db: makeDbMock() }))

    const { GET } = await import('@/app/api/postback/accesstrade/route')
    const req = atUrl({ aff_sub: 's1', order_id: 'AT-1', commission: '10', token: '' })
    const res = await GET(req)
    expect(res.status).toBe(503)
  })

  it('returns validation response when token is wrong', async () => {
    process.env.REVENUE_WEBHOOK_SECRET = 'real-secret'
    vi.doMock('@/lib/admin-control-runtime', () => makeControlMock(true))
    vi.doMock('@/lib/db', () => ({ db: makeDbMock() }))

    const { GET } = await import('@/app/api/postback/accesstrade/route')
    const req = atUrl({ aff_sub: 's1', order_id: 'AT-1', commission: '10', token: 'wrong' })
    const res = await GET(req)
    const body = await res.json() as { mode: string }
    expect(body.mode).toBe('validation')
  })

  it('returns validation response when aff_sub is missing', async () => {
    process.env.REVENUE_WEBHOOK_SECRET = 'secret'
    vi.doMock('@/lib/admin-control-runtime', () => makeControlMock(true))
    vi.doMock('@/lib/db', () => ({ db: makeDbMock() }))

    const { GET } = await import('@/app/api/postback/accesstrade/route')
    const req = atUrl({ order_id: 'AT-1', commission: '10', token: 'secret' })
    const res = await GET(req)
    const body = await res.json() as { mode: string }
    expect(body.mode).toBe('validation')
  })

  it('returns validation response when order_id is missing', async () => {
    process.env.REVENUE_WEBHOOK_SECRET = 'secret'
    vi.doMock('@/lib/admin-control-runtime', () => makeControlMock(true))
    vi.doMock('@/lib/db', () => ({ db: makeDbMock() }))

    const { GET } = await import('@/app/api/postback/accesstrade/route')
    const req = atUrl({ aff_sub: 's1', commission: '10', token: 'secret' })
    const res = await GET(req)
    const body = await res.json() as { mode: string }
    expect(body.mode).toBe('validation')
  })

  it('accepts transaction_id alias for order_id', async () => {
    process.env.REVENUE_WEBHOOK_SECRET = 'secret'
    const db = makeDbMock()
    vi.doMock('@/lib/admin-control-runtime', () => makeControlMock(true))
    vi.doMock('@/lib/db', () => ({ db }))

    const { GET } = await import('@/app/api/postback/accesstrade/route')
    const req = atUrl({ aff_sub: 's1', transaction_id: 'TXN-99', commission: '15', status: 'approved', token: 'secret' })
    const res = await GET(req)
    const body = await res.json() as { ok: boolean; provider: string }
    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.provider).toBe('accesstrade')
    expect(db).toHaveBeenCalled()
  })

  it('accepts approved_commission alias for commission', async () => {
    process.env.REVENUE_WEBHOOK_SECRET = 'secret'
    const db = makeDbMock()
    vi.doMock('@/lib/admin-control-runtime', () => makeControlMock(true))
    vi.doMock('@/lib/db', () => ({ db }))

    const { GET } = await import('@/app/api/postback/accesstrade/route')
    const req = atUrl({ aff_sub: 's1', order_id: 'AT-2', approved_commission: '20', token: 'secret' })
    const res = await GET(req)
    const body = await res.json() as { ok: boolean }
    expect(body.ok).toBe(true)
  })

  it('returns ok:true and calls db on valid conversion postback', async () => {
    process.env.REVENUE_WEBHOOK_SECRET = 'secret'
    const db = makeDbMock()
    vi.doMock('@/lib/admin-control-runtime', () => makeControlMock(true))
    vi.doMock('@/lib/db', () => ({ db }))

    const { GET } = await import('@/app/api/postback/accesstrade/route')
    const req = atUrl({ aff_sub: 'home_top', order_id: 'AT-100', commission: '45.50', status: 'approved', token: 'secret' })
    const res = await GET(req)
    const body = await res.json() as { ok: boolean; provider: string }
    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.provider).toBe('accesstrade')
    expect(db).toHaveBeenCalled()
  })

  it('treats rejected status as reversal — db called twice (insert + update)', async () => {
    process.env.REVENUE_WEBHOOK_SECRET = 'secret'
    const db = makeDbMock()
    vi.doMock('@/lib/admin-control-runtime', () => makeControlMock(true))
    vi.doMock('@/lib/db', () => ({ db }))

    const { GET } = await import('@/app/api/postback/accesstrade/route')
    const req = atUrl({ aff_sub: 's1', order_id: 'AT-101', commission: '10', status: 'rejected', token: 'secret' })
    const res = await GET(req)
    const body = await res.json() as { ok: boolean }
    expect(body.ok).toBe(true)
    expect(db).toHaveBeenCalledTimes(2)
  })

  it('treats cancelled status as reversal', async () => {
    process.env.REVENUE_WEBHOOK_SECRET = 'secret'
    const db = makeDbMock()
    vi.doMock('@/lib/admin-control-runtime', () => makeControlMock(true))
    vi.doMock('@/lib/db', () => ({ db }))

    const { GET } = await import('@/app/api/postback/accesstrade/route')
    const req = atUrl({ aff_sub: 's1', order_id: 'AT-102', commission: '10', status: 'cancelled', token: 'secret' })
    const res = await GET(req)
    const body = await res.json() as { ok: boolean }
    expect(body.ok).toBe(true)
    expect(db).toHaveBeenCalledTimes(2)
  })

  it('returns validation on db error (never returns 5xx)', async () => {
    process.env.REVENUE_WEBHOOK_SECRET = 'secret'
    const db = Object.assign(vi.fn(() => Promise.reject(new Error('db down'))), { json: vi.fn((v: unknown) => v) })
    vi.doMock('@/lib/admin-control-runtime', () => makeControlMock(true))
    vi.doMock('@/lib/db', () => ({ db }))

    const { GET } = await import('@/app/api/postback/accesstrade/route')
    const req = atUrl({ aff_sub: 's1', order_id: 'AT-103', commission: '10', token: 'secret' })
    const res = await GET(req)
    const body = await res.json() as { mode: string }
    expect(res.status).toBe(200)
    expect(body.mode).toBe('validation')
  })
})
