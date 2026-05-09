import { describe, it, expect } from 'vitest'
import { createHmac } from 'crypto'
import { computeHmac, verifyHmac } from '../postback-verify'

const SECRET = 'test-secret-key'
const BODY   = JSON.stringify({ sub_id: 'search_top_1', order_id: 'LZ-001', commission: 45.50 })

function sign(body: string): string {
  return createHmac('sha256', SECRET).update(body, 'utf8').digest('hex')
}

describe('computeHmac', () => {
  it('returns lowercase hex string', () => {
    const result = computeHmac(SECRET, BODY)
    expect(result).toMatch(/^[0-9a-f]{64}$/)
  })

  it('is deterministic', () => {
    expect(computeHmac(SECRET, BODY)).toBe(computeHmac(SECRET, BODY))
  })

  it('differs for different body', () => {
    expect(computeHmac(SECRET, BODY)).not.toBe(computeHmac(SECRET, BODY + ' '))
  })

  it('differs for different secret', () => {
    expect(computeHmac(SECRET, BODY)).not.toBe(computeHmac('other-secret', BODY))
  })
})

describe('verifyHmac', () => {
  it('returns true for correct signature', () => {
    expect(verifyHmac(SECRET, BODY, sign(BODY))).toBe(true)
  })

  it('returns false for wrong signature', () => {
    expect(verifyHmac(SECRET, BODY, 'deadbeef')).toBe(false)
  })

  it('returns false for tampered body', () => {
    const sig = sign(BODY)
    expect(verifyHmac(SECRET, BODY + 'x', sig)).toBe(false)
  })

  it('returns false for empty secret', () => {
    expect(verifyHmac('', BODY, sign(BODY))).toBe(false)
  })

  it('returns false for empty body', () => {
    expect(verifyHmac(SECRET, '', sign(BODY))).toBe(false)
  })

  it('returns false for empty signature', () => {
    expect(verifyHmac(SECRET, BODY, '')).toBe(false)
  })

  it('accepts uppercase hex signature (case-insensitive)', () => {
    const upperSig = sign(BODY).toUpperCase()
    expect(verifyHmac(SECRET, BODY, upperSig)).toBe(true)
  })

  it('returns false for signature of wrong length', () => {
    expect(verifyHmac(SECRET, BODY, 'abc123')).toBe(false)
  })
})
