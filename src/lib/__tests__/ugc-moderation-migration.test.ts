import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = process.cwd()
const MIGRATION = readFileSync(
  join(ROOT, 'supabase/migrations/20260421000002_product_tips_admin_moderation.sql'),
  'utf8',
)

describe('UGC-MOD product tips moderation migration', () => {
  it('adds moderation metadata to product tips', () => {
    expect(MIGRATION).toContain('ADD COLUMN IF NOT EXISTS approved_at')
    expect(MIGRATION).toContain('ADD COLUMN IF NOT EXISTS moderated_by')
  })

  it('adds admin-only moderation policy and pending review index', () => {
    expect(MIGRATION).toContain('idx_product_tips_pending_review')
    expect(MIGRATION).toContain('CREATE POLICY "admin_manage_product_tips"')
    expect(MIGRATION).toContain("role = 'admin'")
  })
})
