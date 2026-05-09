// TASK 3.23 — Phase 6 data prep SQL checks

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = process.cwd()
const MIGRATION = readFileSync(
  join(ROOT, 'supabase/migrations/20260419000009_phase6_data_prep.sql'),
  'utf8',
)
const PHASE6_SEED = readFileSync(
  join(ROOT, 'supabase/seed/phase6_baseline_seed.sql'),
  'utf8',
)
const DEV_SEED = readFileSync(join(ROOT, 'supabase/seed/dev_seed.sql'), 'utf8')

describe('TASK 3.23 Phase 6 data prep migration', () => {
  it('keeps price_history available with the current captured_at schema', () => {
    expect(MIGRATION).toContain('CREATE TABLE IF NOT EXISTS price_history')
    expect(MIGRATION).toContain('captured_at timestamptz')
    expect(MIGRATION).not.toContain('recorded_at')
  })

  it('adds time-series indexes for price, views, and conversions', () => {
    expect(MIGRATION).toContain('idx_price_history_platform_captured')
    expect(MIGRATION).toContain('idx_product_views_viewed_at')
    expect(MIGRATION).toContain('idx_product_views_product_viewed')
    expect(MIGRATION).toContain('idx_revenue_tracking_subid_received')
    expect(MIGRATION).toContain('idx_revenue_tracking_platform_event_received')
  })

  it('creates a unified baseline event view for future AI work', () => {
    expect(MIGRATION).toContain('CREATE OR REPLACE VIEW v_phase6_baseline_events')
    expect(MIGRATION).toContain("'price_snapshot'::text")
    expect(MIGRATION).toContain("'product_view'::text")
    expect(MIGRATION).toContain("'conversion'")
    expect(MIGRATION).toContain('revenue_tracking')
  })
})

describe('TASK 3.23 Phase 6 seed data', () => {
  it('seeds price, product view, and conversion baseline signals', () => {
    expect(PHASE6_SEED).toContain('INSERT INTO price_history')
    expect(PHASE6_SEED).toContain('INSERT INTO product_views')
    expect(PHASE6_SEED).toContain('INSERT INTO revenue_tracking')
  })

  it('uses captured_at consistently for price history seeds', () => {
    expect(PHASE6_SEED).toContain('captured_at')
    expect(PHASE6_SEED).not.toContain('recorded_at')
    expect(DEV_SEED).toContain('captured_at')
    expect(DEV_SEED).not.toContain('recorded_at')
  })
})
