import { db } from '@/lib/db'

export interface PushSubscriptionPayload {
  endpoint: string
  p256dh: string
  auth: string
}

export interface PushSendResult {
  sent: boolean
  reason: string
}

export async function savePushSubscription(
  payload: PushSubscriptionPayload,
  userId?: string,
): Promise<void> {
  await db`
    INSERT INTO push_subscriptions (endpoint, p256dh, auth, user_id, is_active)
    VALUES (
      ${payload.endpoint},
      ${payload.p256dh},
      ${payload.auth},
      ${userId ?? null},
      true
    )
    ON CONFLICT (endpoint)
    DO UPDATE SET
      p256dh = EXCLUDED.p256dh,
      auth = EXCLUDED.auth,
      user_id = EXCLUDED.user_id,
      is_active = true
  `
}

export async function deactivatePushSubscription(endpoint: string): Promise<void> {
  await db`
    UPDATE push_subscriptions
    SET is_active = false
    WHERE endpoint = ${endpoint}
  `
}

// Requires web-push npm package -- activate in Month 9 when package is added.
export async function sendPushNotification(
  title: string,
  body: string,
  url: string,
): Promise<PushSendResult> {
  void title
  void body
  void url

  if (process.env.PUSH_NOTIFICATIONS_ENABLED !== 'true') {
    return { sent: false, reason: 'disabled' }
  }

  return { sent: false, reason: 'web-push package required' }
}
