// Postback HMAC verification — TASK 4.10a
//
// Both Lazada and Shopee S2S postbacks are authenticated with HMAC-SHA256.
// The signing key is REVENUE_WEBHOOK_SECRET (shared secret, never in client).
//
// Lazada: signature sent as query param `?sign=<hex>`
// Shopee: signature sent as header `x-shopee-signature: <hex>`
//
// Timing-safe comparison prevents timing-oracle attacks.

import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Compute HMAC-SHA256 of `body` using `secret`.
 * Returns lowercase hex string.
 */
export function computeHmac(secret: string, body: string): string {
  return createHmac('sha256', secret).update(body, 'utf8').digest('hex')
}

/**
 * Verify that `signature` matches HMAC-SHA256(secret, body).
 * Uses timing-safe comparison.
 */
export function verifyHmac(secret: string, body: string, signature: string): boolean {
  if (!secret || !body || !signature) return false
  const expected = computeHmac(secret, body)
  try {
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature.toLowerCase(), 'hex'))
  } catch {
    // Buffer lengths differ → invalid signature
    return false
  }
}
