import { describe, expect, it } from 'vitest'

import { buildOwnedMediaConsentPatch } from '@/lib/owned-media-consent'
import type { UserProfile } from '@/types'

const NOW = '2026-04-24T03:00:00.000Z'

function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'user-1',
    full_name: 'Test User',
    interests: [],
    line_notify_token: null,
    line_notify_status: null,
    line_notify_error: null,
    line_notify_checked_at: null,
    owned_media_email_opt_in: false,
    owned_media_email_consented_at: null,
    owned_media_email_source: null,
    owned_media_line_opt_in: false,
    owned_media_line_consented_at: null,
    owned_media_line_source: null,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  }
}

describe('buildOwnedMediaConsentPatch', () => {
  it('creates an email opt-in patch for a new consent', () => {
    const patch = buildOwnedMediaConsentPatch('user-1', null, { channel: 'email', source: 'go_intermediate:prod-1' }, NOW)

    expect(patch.owned_media_email_opt_in).toBe(true)
    expect(patch.owned_media_email_consented_at).toBe(NOW)
    expect(patch.owned_media_email_source).toBe('go_intermediate:prod-1')
  })

  it('creates a line opt-in patch for a new consent', () => {
    const patch = buildOwnedMediaConsentPatch('user-1', null, { channel: 'line', source: 'go_intermediate:prod-1' }, NOW)

    expect(patch.owned_media_line_opt_in).toBe(true)
    expect(patch.owned_media_line_consented_at).toBe(NOW)
    expect(patch.owned_media_line_source).toBe('go_intermediate:prod-1')
  })

  it('preserves the first consent timestamp and source when the same email consent is re-saved', () => {
    const current = makeProfile({
      owned_media_email_opt_in: true,
      owned_media_email_consented_at: '2026-04-20T01:00:00.000Z',
      owned_media_email_source: 'go_intermediate:prod-older',
    })

    const patch = buildOwnedMediaConsentPatch('user-1', current, { channel: 'email', source: 'go_intermediate:prod-new' }, NOW)

    expect(patch.owned_media_email_opt_in).toBe(true)
    expect(patch.owned_media_email_consented_at).toBe('2026-04-20T01:00:00.000Z')
    expect(patch.owned_media_email_source).toBe('go_intermediate:prod-older')
  })
})
