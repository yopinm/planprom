import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

interface DbMock {
  <T>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T>
}

const dbMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/db', () => ({
  db: (async <T>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T> => dbMock(strings, ...values) as Promise<T>) as DbMock,
}))

import { POST } from '../../../app/api/webhooks/uptime/route'

function createUptimeRequest(body: string, secret = 'valid-secret'): NextRequest {
  return new NextRequest(`https://couponkum.com/api/webhooks/uptime?secret=${secret}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body,
  })
}

function createPayload(alertType: 1 | 2): string {
  return new URLSearchParams({
    monitorID: '123456',
    monitorURL: 'https://couponkum.com/api/health',
    monitorFriendlyName: 'Couponkum Health',
    alertType: String(alertType),
    alertTypeFriendlyName: alertType === 1 ? 'Down' : 'Up',
    alertDetails: alertType === 1 ? 'Connection timeout' : 'Monitor is up',
    alertDuration: '0',
    monitorAlertContacts: 'yopinm@gmail.com',
  }).toString()
}

describe('POST /api/webhooks/uptime', (): void => {
  beforeEach((): void => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
    vi.stubEnv('UPTIME_WEBHOOK_SECRET', 'valid-secret')
    dbMock.mockResolvedValue([])
  })

  it('returns 200 and inserts a down alert', async (): Promise<void> => {
    const res = await POST(createUptimeRequest(createPayload(1)))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json).toEqual({ ok: true })
    expect(dbMock).toHaveBeenCalledTimes(1)
    expect(dbMock.mock.calls[0]?.slice(1)).toEqual([
      'Couponkum Health',
      1,
      'Connection timeout',
    ])
  })

  it('returns 200 and inserts an up alert', async (): Promise<void> => {
    const res = await POST(createUptimeRequest(createPayload(2)))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json).toEqual({ ok: true })
    expect(dbMock).toHaveBeenCalledTimes(1)
    expect(dbMock.mock.calls[0]?.slice(1)).toEqual([
      'Couponkum Health',
      2,
      'Monitor is up',
    ])
  })

  it('returns 401 when the secret is wrong', async (): Promise<void> => {
    const res = await POST(createUptimeRequest(createPayload(1), 'wrong-secret'))
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json).toEqual({ error: 'Unauthorized' })
    expect(dbMock).not.toHaveBeenCalled()
  })

  it('returns 400 when monitorFriendlyName is missing', async (): Promise<void> => {
    const res = await POST(createUptimeRequest('alertType=1&alertDetails=Connection+timeout'))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json).toEqual({ error: 'Invalid uptime webhook payload' })
    expect(dbMock).not.toHaveBeenCalled()
  })

  it('returns 200 and inserts null alertDetails for an up alert with no details', async (): Promise<void> => {
    const body = new URLSearchParams({
      monitorFriendlyName: 'Couponkum Health',
      alertType: '2',
    }).toString()
    const res = await POST(createUptimeRequest(body))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json).toEqual({ ok: true })
    expect(dbMock).toHaveBeenCalledTimes(1)
    expect(dbMock.mock.calls[0]?.slice(1)).toEqual(['Couponkum Health', 2, null])
  })
})
