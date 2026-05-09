// WALLET-GUEST-1: guest-id utility tests

import { describe, expect, it } from 'vitest'
import {
  parseGuestIdFromCookieString,
  buildLineSubscribeUrl,
  generateGuestId,
  GUEST_COOKIE,
} from '@/lib/guest-id'

describe('guest-id utilities — WALLET-GUEST-1', () => {
  it('parseGuestIdFromCookieString extracts ck_guest_id from cookie string', () => {
    const guestId = '550e8400-e29b-41d4-a716-446655440000'
    const cookieStr = `other=foo; ${GUEST_COOKIE}=${guestId}; another=bar`
    expect(parseGuestIdFromCookieString(cookieStr)).toBe(guestId)
  })

  it('parseGuestIdFromCookieString returns null when cookie is absent', () => {
    expect(parseGuestIdFromCookieString('other=foo; session=abc')).toBeNull()
  })

  it('generateGuestId returns a valid UUID v4', () => {
    const id = generateGuestId()
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
  })

  it('buildLineSubscribeUrl returns ti/p/ format with gid param', () => {
    const guestId = '550e8400-e29b-41d4-a716-446655440000'
    const url = buildLineSubscribeUrl('@testoa', guestId)
    expect(url).toContain('line.me/R/ti/p/%40testoa')
    expect(url).toContain(`gid=${guestId}`)
  })

  it('buildLineSubscribeUrl handles oaId without @ prefix', () => {
    const url = buildLineSubscribeUrl('testoa', '550e8400-e29b-41d4-a716-446655440000')
    expect(url).toContain('ti/p/testoa')
    expect(url).not.toContain('%40testoa')
  })
})
