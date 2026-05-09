import type { UserProfile } from '@/types'

export type OwnedMediaChannel = 'email' | 'line'

export interface OwnedMediaConsentInput {
  channel: OwnedMediaChannel
  source: string
}

export interface OwnedMediaConsentPatch {
  id: string
  owned_media_email_opt_in?: boolean
  owned_media_email_consented_at?: string | null
  owned_media_email_source?: string | null
  owned_media_line_opt_in?: boolean
  owned_media_line_consented_at?: string | null
  owned_media_line_source?: string | null
  updated_at: string
}

export function buildOwnedMediaConsentPatch(
  userId: string,
  current: UserProfile | null,
  input: OwnedMediaConsentInput,
  now: string,
): OwnedMediaConsentPatch {
  const patch: OwnedMediaConsentPatch = {
    id: userId,
    updated_at: now,
  }

  if (input.channel === 'email') {
    patch.owned_media_email_opt_in = true
    patch.owned_media_email_consented_at = current?.owned_media_email_consented_at ?? now
    patch.owned_media_email_source = current?.owned_media_email_source ?? input.source
    return patch
  }

  patch.owned_media_line_opt_in = true
  patch.owned_media_line_consented_at = current?.owned_media_line_consented_at ?? now
  patch.owned_media_line_source = current?.owned_media_line_source ?? input.source
  return patch
}
