import { describe, it, expect } from 'vitest'
import {
  KEYWORD_CLUSTERS,
  TIER1_CLUSTERS,
  TARGET_URL_PATTERNS,
  getClustersByPlatform,
  getClustersByCategory,
  getCluster,
  PRODUCT_CATEGORIES,
} from '../seo-keywords'

describe('KEYWORD_CLUSTERS structure', () => {
  it('has at least 8 clusters', () => {
    expect(KEYWORD_CLUSTERS.length).toBeGreaterThanOrEqual(8)
  })

  it('every cluster has a unique id', () => {
    const ids = KEYWORD_CLUSTERS.map(c => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every cluster has at least 2 keywords', () => {
    for (const c of KEYWORD_CLUSTERS) {
      expect(c.keywords.length).toBeGreaterThanOrEqual(2)
    }
  })

  it('every cluster has a non-empty targetUrlPattern', () => {
    for (const c of KEYWORD_CLUSTERS) {
      expect(c.targetUrlPattern.length).toBeGreaterThan(0)
    }
  })

  it('every cluster has metaTitleTemplate and metaDescTemplate', () => {
    for (const c of KEYWORD_CLUSTERS) {
      expect(c.metaTitleTemplate.length).toBeGreaterThan(0)
      expect(c.metaDescTemplate.length).toBeGreaterThan(0)
    }
  })

  it('tiers are only 1, 2, or 3', () => {
    const validTiers = new Set([1, 2, 3])
    for (const c of KEYWORD_CLUSTERS) {
      expect(validTiers.has(c.tier)).toBe(true)
    }
  })

  it('platforms are shopee, lazada, or both', () => {
    const validPlatforms = new Set(['shopee', 'lazada', 'both'])
    for (const c of KEYWORD_CLUSTERS) {
      expect(validPlatforms.has(c.platform)).toBe(true)
    }
  })

  it('intents are valid values', () => {
    const validIntents = new Set(['transactional', 'informational', 'navigational'])
    for (const c of KEYWORD_CLUSTERS) {
      expect(validIntents.has(c.intent)).toBe(true)
    }
  })
})

describe('TIER1_CLUSTERS', () => {
  it('only contains tier-1 clusters', () => {
    for (const c of TIER1_CLUSTERS) {
      expect(c.tier).toBe(1)
    }
  })

  it('has at least 2 tier-1 clusters', () => {
    expect(TIER1_CLUSTERS.length).toBeGreaterThanOrEqual(2)
  })

  it('includes shopee-coupon and lazada-coupon', () => {
    const ids = TIER1_CLUSTERS.map(c => c.id)
    expect(ids).toContain('shopee-coupon')
    expect(ids).toContain('lazada-coupon')
  })
})

describe('TARGET_URL_PATTERNS', () => {
  it('has no duplicates', () => {
    expect(new Set(TARGET_URL_PATTERNS).size).toBe(TARGET_URL_PATTERNS.length)
  })

  it('all start with /', () => {
    for (const url of TARGET_URL_PATTERNS) {
      expect(url.startsWith('/')).toBe(true)
    }
  })
})

describe('getClustersByPlatform', () => {
  it('returns shopee clusters', () => {
    const shopee = getClustersByPlatform('shopee')
    for (const c of shopee) {
      expect(['shopee', 'both']).toContain(c.platform)
    }
  })

  it('returns lazada clusters', () => {
    const lazada = getClustersByPlatform('lazada')
    for (const c of lazada) {
      expect(['lazada', 'both']).toContain(c.platform)
    }
  })

  it('shopee and lazada each return at least 2 clusters', () => {
    expect(getClustersByPlatform('shopee').length).toBeGreaterThanOrEqual(2)
    expect(getClustersByPlatform('lazada').length).toBeGreaterThanOrEqual(2)
  })
})

describe('getClustersByCategory', () => {
  it('returns clusters matching the category or null category', () => {
    const clusters = getClustersByCategory('มือถือ')
    for (const c of clusters) {
      expect(c.category === 'มือถือ' || c.category === null).toBe(true)
    }
  })
})

describe('getCluster', () => {
  it('returns the cluster by id', () => {
    const cluster = getCluster('shopee-coupon')
    expect(cluster.id).toBe('shopee-coupon')
  })

  it('throws for unknown id', () => {
    expect(() => getCluster('non-existent')).toThrow('Keyword cluster not found: non-existent')
  })
})

describe('PRODUCT_CATEGORIES', () => {
  it('includes มือถือ', () => {
    expect(PRODUCT_CATEGORIES).toContain('มือถือ')
  })

  it('has at least 5 categories', () => {
    expect(PRODUCT_CATEGORIES.length).toBeGreaterThanOrEqual(5)
  })
})
