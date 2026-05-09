import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = process.cwd()
const MIGRATION = readFileSync(
  join(ROOT, 'supabase/migrations/20260420000001_automated_link_checker.sql'),
  'utf8',
)

describe('TASK 3.15 automated link checker migration', () => {
  it('persists product link scan results', () => {
    expect(MIGRATION).toContain('CREATE TABLE IF NOT EXISTS product_link_checks')
    expect(MIGRATION).toContain('product_id uuid PRIMARY KEY REFERENCES products')
    expect(MIGRATION).toContain('target_url text NOT NULL')
    expect(MIGRATION).toContain('ok boolean NOT NULL')
    expect(MIGRATION).toContain('status integer NOT NULL')
  })

  it('adds dead link review view and indexes', () => {
    expect(MIGRATION).toContain('idx_product_link_checks_ok_checked')
    expect(MIGRATION).toContain('CREATE OR REPLACE VIEW v_dead_product_links')
    expect(MIGRATION).toContain('WHERE plc.ok = false')
  })
})
