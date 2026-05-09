import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = process.cwd()
const MIGRATION = readFileSync(
  join(ROOT, 'supabase/migrations/20260423000004_admin_control_center.sql'),
  'utf8',
)

describe('ADMIN-CONTROL-1 migration', (): void => {
  it('creates control flags and audit log tables', (): void => {
    expect(MIGRATION).toContain('CREATE TABLE IF NOT EXISTS admin_control_flags')
    expect(MIGRATION).toContain('CREATE TABLE IF NOT EXISTS admin_control_audit_logs')
    expect(MIGRATION).toContain('previous_enabled boolean     NOT NULL')
    expect(MIGRATION).toContain('next_enabled     boolean     NOT NULL')
  })

  it('seeds risky controls off by default', (): void => {
    expect(MIGRATION).toContain("'ai_ranking'")
    expect(MIGRATION).toContain("'affiliate_redirect'")
    expect(MIGRATION).toContain("'postback_tracking'")
    expect(MIGRATION).toContain("'maintenance_mode'")
  })

  it('locks control center data to admins', (): void => {
    expect(MIGRATION).toContain('ALTER TABLE admin_control_flags ENABLE ROW LEVEL SECURITY')
    expect(MIGRATION).toContain('CREATE POLICY "admin_manage_control_flags"')
    expect(MIGRATION).toContain('CREATE POLICY "admin_read_control_audit_logs"')
    expect(MIGRATION).toContain("role = 'admin'")
  })
})
