import { createHmac, timingSafeEqual } from 'node:crypto'

export interface FbWebhookSignatureResult {
  ok: boolean
  reason?: 'missing_app_secret' | 'missing_signature' | 'bad_format' | 'mismatch'
}

function getAppSecret(): string | null {
  return process.env.FB_APP_SECRET ?? null
}

function parseSha256Signature(signature: string): string | null {
  const [algorithm, digest] = signature.split('=', 2)
  if (algorithm !== 'sha256' || !digest) return null
  return digest
}

function hmacSha256Hex(body: string, secret: string): string {
  return createHmac('sha256', secret).update(body, 'utf8').digest('hex')
}

export function isWebhookSignatureConfigured(): boolean {
  return !!getAppSecret()
}

export function verifyFacebookWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
): FbWebhookSignatureResult {
  const secret = getAppSecret()
  if (!secret) return { ok: false, reason: 'missing_app_secret' }
  if (!signatureHeader) return { ok: false, reason: 'missing_signature' }

  const signatureDigest = parseSha256Signature(signatureHeader)
  if (!signatureDigest) return { ok: false, reason: 'bad_format' }

  const expected = Buffer.from(hmacSha256Hex(rawBody, secret), 'hex')
  const actual = Buffer.from(signatureDigest, 'hex')

  if (expected.length !== actual.length) return { ok: false, reason: 'mismatch' }
  if (!timingSafeEqual(expected, actual)) return { ok: false, reason: 'mismatch' }

  return { ok: true }
}
