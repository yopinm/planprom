import { readFileSync } from 'fs'
import { join } from 'path'
import { describe, expect, it } from 'vitest'

const MIGRATION = readFileSync(
  join(process.cwd(), 'supabase/migrations/20260423000005_admin_alert_rules.sql'),
  'utf8',
)

describe('admin alert rules migration', (): void => {
  it('creates alert rules and audit tables', (): void => {
    expect(MIGRATION).toContain('CREATE TABLE IF NOT EXISTS admin_alert_rules')
    expect(MIGRATION).toContain('CREATE TABLE IF NOT EXISTS admin_alert_rule_audit_logs')
  })

  it('seeds the required threshold rules', (): void => {
    expect(MIGRATION).toContain("'postback_failure_count'")
    expect(MIGRATION).toContain("'broken_link_count'")
    expect(MIGRATION).toContain("'conversion_rate_floor'")
  })

  it('keeps rule tables service-role protected', (): void => {
    expect(MIGRATION).toContain('ALTER TABLE admin_alert_rules ENABLE ROW LEVEL SECURITY')
    expect(MIGRATION).toContain('admin_alert_rules: service role full access')
  })
})
