import { createHmac } from 'node:crypto'
import { afterEach, describe, expect, it } from 'vitest'
import {
  isWebhookSignatureConfigured,
  verifyFacebookWebhookSignature,
} from '@/services/facebook/webhook-security'

const ORIGINAL_ENV = { ...process.env }

function sign(body: string, secret: string): string {
  const digest = createHmac('sha256', secret).update(body, 'utf8').digest('hex')
  return `sha256=${digest}`
}

afterEach((): void => {
  process.env = { ...ORIGINAL_ENV }
})

describe('facebook webhook security', (): void => {
  it('detects missing app secret configuration', (): void => {
    delete process.env.FB_APP_SECRET

    expect(isWebhookSignatureConfigured()).toBe(false)
    expect(verifyFacebookWebhookSignature('{"ok":true}', null)).toEqual({
      ok: false,
      reason: 'missing_app_secret',
    })
  })

  it('accepts a valid X-Hub-Signature-256 header', (): void => {
    process.env.FB_APP_SECRET = 'app-secret'
    const body = '{"object":"page"}'

    expect(verifyFacebookWebhookSignature(body, sign(body, 'app-secret'))).toEqual({ ok: true })
  })

  it('rejects missing, malformed, and mismatched signatures', (): void => {
    process.env.FB_APP_SECRET = 'app-secret'
    const body = '{"object":"page"}'

    expect(verifyFacebookWebhookSignature(body, null).reason).toBe('missing_signature')
    expect(verifyFacebookWebhookSignature(body, 'sha1=abc').reason).toBe('bad_format')
    expect(verifyFacebookWebhookSignature(body, sign('{"object":"user"}', 'app-secret')).reason).toBe('mismatch')
  })
})
