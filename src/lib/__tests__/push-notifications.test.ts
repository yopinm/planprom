import { beforeEach, describe, expect, it, vi } from 'vitest'

const dbMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/db', () => ({
  db: dbMock,
}))

import {
  deactivatePushSubscription,
  savePushSubscription,
  sendPushNotification,
} from '@/lib/push-notifications'

beforeEach((): void => {
  vi.unstubAllEnvs()
  dbMock.mockReset()
  dbMock.mockResolvedValue([])
})

describe('push notifications', (): void => {
  it('returns disabled when push notifications are not enabled', async (): Promise<void> => {
    await expect(sendPushNotification('Deal', 'Price drop', '/')).resolves.toEqual({
      sent: false,
      reason: 'disabled',
    })
  })

  it('returns package-required stub when push notifications are enabled', async (): Promise<void> => {
    vi.stubEnv('PUSH_NOTIFICATIONS_ENABLED', 'true')

    await expect(sendPushNotification('Deal', 'Price drop', '/')).resolves.toEqual({
      sent: false,
      reason: 'web-push package required',
    })
  })

  it('saves a push subscription when db responds ok', async (): Promise<void> => {
    await expect(savePushSubscription({
      endpoint: 'https://push.example/subscription',
      p256dh: 'public-key',
      auth: 'auth-secret',
    })).resolves.toBeUndefined()

    expect(dbMock).toHaveBeenCalledTimes(1)
    expect(dbMock.mock.calls[0]?.slice(1)).toEqual([
      'https://push.example/subscription',
      'public-key',
      'auth-secret',
      null,
    ])
  })

  it('deactivates a push subscription when db responds ok', async (): Promise<void> => {
    await expect(deactivatePushSubscription('https://push.example/subscription')).resolves.toBeUndefined()

    expect(dbMock).toHaveBeenCalledTimes(1)
    expect(dbMock.mock.calls[0]?.slice(1)).toEqual(['https://push.example/subscription'])
  })
})
