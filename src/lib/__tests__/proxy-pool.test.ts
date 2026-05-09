import { describe, it, expect } from 'vitest'
import { buildPool, getNextProxy, getProxyCount, hasProxies } from '../proxy-pool'

describe('buildPool', () => {
  it('returns empty array when unset', () => {
    expect(buildPool(undefined)).toEqual([])
    expect(buildPool('')).toEqual([])
  })

  it('parses single URL', () => {
    expect(buildPool('http://proxy.example.com:8080')).toEqual([
      'http://proxy.example.com:8080',
    ])
  })

  it('parses multiple URLs', () => {
    expect(buildPool('http://p1:8080,http://p2:8080')).toEqual([
      'http://p1:8080',
      'http://p2:8080',
    ])
  })

  it('trims whitespace around entries', () => {
    expect(buildPool(' http://p1:8080 , http://p2:8080 ')).toEqual([
      'http://p1:8080',
      'http://p2:8080',
    ])
  })

  it('filters empty entries from consecutive commas', () => {
    expect(buildPool('http://p1:8080,,http://p2:8080')).toEqual([
      'http://p1:8080',
      'http://p2:8080',
    ])
  })

  it('supports user:pass@host format', () => {
    const pool = buildPool('http://user:pass@proxy.example.com:8080')
    expect(pool).toEqual(['http://user:pass@proxy.example.com:8080'])
  })
})

describe('getNextProxy / hasProxies / getProxyCount (no PROXY_URLS in test env)', () => {
  it('returns undefined when PROXY_URLS not set', () => {
    // POOL is built at module load with empty PROXY_URLS in CI/test env
    expect(getNextProxy()).toBeUndefined()
  })

  it('reports count as 0', () => {
    expect(getProxyCount()).toBe(0)
  })

  it('reports hasProxies as false', () => {
    expect(hasProxies()).toBe(false)
  })
})
