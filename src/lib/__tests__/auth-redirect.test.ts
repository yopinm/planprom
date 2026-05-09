import { describe, expect, it } from 'vitest'
import { buildAdminLoginRedirectPath, isSafeRelativePath, resolveSafeNextPath } from '../auth-redirect'

describe('isSafeRelativePath', () => {
  it('allows root and normal app paths', () => {
    expect(isSafeRelativePath('/')).toBe(true)
    expect(isSafeRelativePath('/wallet')).toBe(true)
    expect(isSafeRelativePath('/search?q=phone#top')).toBe(true)
  })

  it('rejects absolute URLs', () => {
    expect(isSafeRelativePath('https://evil.example')).toBe(false)
    expect(isSafeRelativePath('http://evil.example')).toBe(false)
  })

  it('rejects protocol-relative URLs', () => {
    expect(isSafeRelativePath('//evil.example')).toBe(false)
    expect(isSafeRelativePath('///evil.example')).toBe(false)
  })

  it('rejects non-path schemes and bare domains', () => {
    expect(isSafeRelativePath('javascript:alert(1)')).toBe(false)
    expect(isSafeRelativePath('evil.example/path')).toBe(false)
  })

  it('rejects backslash-based browser URL confusion', () => {
    expect(isSafeRelativePath('/\\evil.example')).toBe(false)
    expect(isSafeRelativePath('\\evil.example')).toBe(false)
  })

  it('rejects control characters', () => {
    expect(isSafeRelativePath('/wallet\n//evil.example')).toBe(false)
    expect(isSafeRelativePath('/wallet\u0000')).toBe(false)
  })
})

describe('resolveSafeNextPath', () => {
  it('returns root for missing or empty next values', () => {
    expect(resolveSafeNextPath(null)).toBe('/')
    expect(resolveSafeNextPath('')).toBe('/')
  })

  it('keeps safe relative paths unchanged', () => {
    expect(resolveSafeNextPath('/alerts')).toBe('/alerts')
    expect(resolveSafeNextPath('/auth/login?notice=expired')).toBe('/auth/login?notice=expired')
  })

  it('falls back to root for unsafe redirect targets', () => {
    expect(resolveSafeNextPath('//evil.example')).toBe('/')
    expect(resolveSafeNextPath('https://evil.example')).toBe('/')
    expect(resolveSafeNextPath('/\\evil.example')).toBe('/')
  })
})

describe('buildAdminLoginRedirectPath', () => {
  it('uses the plain admin login for the dashboard fallback', () => {
    expect(buildAdminLoginRedirectPath()).toBe('/admin/login')
    expect(buildAdminLoginRedirectPath('/admin')).toBe('/admin/login')
  })

  it('preserves the intended admin destination as an encoded next value', () => {
    expect(buildAdminLoginRedirectPath('/admin/facebook/queue')).toBe(
      '/admin/login?next=%2Fadmin%2Ffacebook%2Fqueue'
    )
  })

  it('falls back safely when the next value is unsafe', () => {
    expect(buildAdminLoginRedirectPath('https://evil.example')).toBe(
      '/admin/login?next=%2F'
    )
  })
})
