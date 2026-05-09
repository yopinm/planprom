import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = process.cwd()
const MIGRATION = readFileSync(
  join(ROOT, 'supabase/migrations/20260424000002_owned_media_consent.sql'),
  'utf8',
)

describe('REV-OWNED-MEDIA-1 migration', () => {
  it('adds owned-media consent fields to user profiles', () => {
    expect(MIGRATION).toContain('owned_media_email_opt_in boolean NOT NULL DEFAULT false')
    expect(MIGRATION).toContain('owned_media_email_consented_at timestamptz')
    expect(MIGRATION).toContain('owned_media_line_opt_in boolean NOT NULL DEFAULT false')
    expect(MIGRATION).toContain('owned_media_line_consented_at timestamptz')
  })

  it('indexes opted-in rows for future owned-media queries', () => {
    expect(MIGRATION).toContain('idx_user_profiles_owned_media_email_opt_in')
    expect(MIGRATION).toContain('idx_user_profiles_owned_media_line_opt_in')
  })
})
