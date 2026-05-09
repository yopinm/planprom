import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = process.cwd()
const MIGRATION = readFileSync(
  join(ROOT, 'supabase/migrations/20260419000010_fake_discount_detection.sql'),
  'utf8',
)

describe('TASK 4.4 fake discount migration', () => {
  it('stores fake discount review flags on products', () => {
    expect(MIGRATION).toContain('ADD COLUMN IF NOT EXISTS suspicious_discount boolean')
    expect(MIGRATION).toContain('ADD COLUMN IF NOT EXISTS suspicious_discount_reason text')
    expect(MIGRATION).toContain('ADD COLUMN IF NOT EXISTS suspicious_discount_checked_at timestamptz')
  })

  it('keeps a review queue view for flagged products', () => {
    expect(MIGRATION).toContain('CREATE OR REPLACE VIEW v_fake_discount_review_queue')
    expect(MIGRATION).toContain('WHERE suspicious_discount = true')
    expect(MIGRATION).toContain('price_original / NULLIF(price_current, 0)')
  })
})
