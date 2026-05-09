import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = process.cwd()
const MIGRATION = readFileSync(
  join(ROOT, 'supabase/migrations/20260424000001_data_freshness_verified_timestamps.sql'),
  'utf8',
)

describe('DATA-FRESHNESS-VERIFY-1 migration', () => {
  it('adds source-verified freshness timestamps to products and coupons', () => {
    expect(MIGRATION).toContain('ADD COLUMN IF NOT EXISTS price_checked_at timestamptz;')
    expect(MIGRATION).toContain('ADD COLUMN IF NOT EXISTS source_checked_at timestamptz;')
  })

  it('indexes verified freshness timestamps for admin and guard queries', () => {
    expect(MIGRATION).toContain('idx_products_price_checked_at')
    expect(MIGRATION).toContain('idx_coupons_source_checked_at')
  })
})
