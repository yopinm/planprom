import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = process.cwd()
const MIGRATION = readFileSync(
  join(ROOT, 'supabase/migrations/20260420000002_query_optimization.sql'),
  'utf8',
)
const DOC = readFileSync(join(ROOT, 'docs/query-optimization.md'), 'utf8')

describe('TASK 4.1 query optimization migration', () => {
  it('adds search and active product indexes', () => {
    expect(MIGRATION).toContain('CREATE EXTENSION IF NOT EXISTS pg_trgm')
    expect(MIGRATION).toContain('idx_products_active_name_trgm')
    expect(MIGRATION).toContain('idx_products_active_platform_updated')
    expect(MIGRATION).toContain('idx_products_active_updated')
  })

  it('adds coupon, click, and facebook queue indexes', () => {
    expect(MIGRATION).toContain('idx_coupons_active_discount')
    expect(MIGRATION).toContain('idx_coupons_active_platform_tier_code')
    expect(MIGRATION).toContain('idx_click_logs_recent_product')
    expect(MIGRATION).toContain('idx_click_logs_session_clicked')
    expect(MIGRATION).toContain('idx_facebook_posts_status_score')
    expect(MIGRATION).toContain('idx_facebook_posts_status_approved')
  })

  it('documents the query paths being optimized', () => {
    expect(DOC).toContain('/search')
    expect(DOC).toContain('/api/cron/price-history')
    expect(DOC).toContain('rare_item_scores.final_score')
  })
})
