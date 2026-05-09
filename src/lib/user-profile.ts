// src/lib/user-profile.ts
// TASK 2.3: User Profile + Personalization helpers (server-side only)

import { db } from '@/lib/db'
import type { Product, UserProfile } from '@/types'
import { buildOwnedMediaConsentPatch, type OwnedMediaChannel } from '@/lib/owned-media-consent'

// ---------------------------------------------------------------------------
// Profile fetch
// ---------------------------------------------------------------------------

/** Get user profile by auth.users.id — returns null if not found */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const [data] = await db<UserProfile[]>`
    SELECT
      id,
      full_name,
      interests,
      line_notify_token,
      line_notify_status,
      line_notify_error,
      line_notify_checked_at,
      owned_media_email_opt_in,
      owned_media_email_consented_at,
      owned_media_email_source,
      owned_media_line_opt_in,
      owned_media_line_consented_at,
      owned_media_line_source,
      created_at,
      updated_at
    FROM user_profiles
    WHERE id = ${userId}
    LIMIT 1
  `

  if (!data) return null
  return {
    ...data,
    interests: (data.interests ?? []) as string[],
  } as UserProfile
}

// ---------------------------------------------------------------------------
// Interest upsert
// ---------------------------------------------------------------------------

/**
 * Add an interest keyword to the user's profile.
 * - Deduplicates (case-insensitive, moves existing entry to front)
 * - Caps the list at 20 entries (LRU: newest first)
 * - Upserts the row so it works even if profile row doesn't exist yet
 */
export async function upsertUserInterest(userId: string, interest: string): Promise<void> {
  const normalized = interest.trim().toLowerCase()
  if (!normalized) return

  // Read current interests
  const [data] = await db<Pick<UserProfile, 'interests'>[]>`
    SELECT interests
    FROM user_profiles
    WHERE id = ${userId}
    LIMIT 1
  `

  const current: string[] = Array.isArray(data?.interests) ? (data.interests as string[]) : []

  // Dedupe + keep newest-first, cap at 20
  const updated = [normalized, ...current.filter(i => i !== normalized)].slice(0, 20)

  await db`
    INSERT INTO user_profiles (id, interests, updated_at)
    VALUES (${userId}, ${updated}, ${new Date().toISOString()})
    ON CONFLICT (id)
    DO UPDATE SET
      interests = EXCLUDED.interests,
      updated_at = EXCLUDED.updated_at
  `
}

export async function updateLineNotifyToken(
  userId: string,
  token: string | null,
): Promise<void> {
  const trimmed = token?.trim() ?? ''

  await db`
    INSERT INTO user_profiles (
      id,
      line_notify_token,
      line_notify_status,
      line_notify_error,
      line_notify_checked_at,
      updated_at
    )
    VALUES (
      ${userId},
      ${trimmed || null},
      ${trimmed ? 'active' : null},
      ${null},
      ${trimmed ? new Date().toISOString() : null},
      ${new Date().toISOString()}
    )
    ON CONFLICT (id)
    DO UPDATE SET
      line_notify_token = EXCLUDED.line_notify_token,
      line_notify_status = EXCLUDED.line_notify_status,
      line_notify_error = EXCLUDED.line_notify_error,
      line_notify_checked_at = EXCLUDED.line_notify_checked_at,
      updated_at = EXCLUDED.updated_at
  `
}

export async function markOwnedMediaConsent(
  userId: string,
  channel: OwnedMediaChannel,
  source: string,
): Promise<void> {
  const current = await getUserProfile(userId)
  const now = new Date().toISOString()
  const patch = buildOwnedMediaConsentPatch(userId, current, { channel, source }, now)

  await db`
    INSERT INTO user_profiles ${db(patch)}
    ON CONFLICT (id)
    DO UPDATE SET
      owned_media_email_opt_in = EXCLUDED.owned_media_email_opt_in,
      owned_media_email_consented_at = EXCLUDED.owned_media_email_consented_at,
      owned_media_email_source = EXCLUDED.owned_media_email_source,
      owned_media_line_opt_in = EXCLUDED.owned_media_line_opt_in,
      owned_media_line_consented_at = EXCLUDED.owned_media_line_consented_at,
      owned_media_line_source = EXCLUDED.owned_media_line_source,
      updated_at = EXCLUDED.updated_at
  `
}

// ---------------------------------------------------------------------------
// Personalization helpers (pure — no I/O)
// ---------------------------------------------------------------------------

/**
 * Filter products to those matching any of the user's interests.
 * Matches against product name and category (case-insensitive substring).
 * Returns empty array when interests is empty.
 */
export function filterByInterests(products: Product[], interests: string[]): Product[] {
  if (interests.length === 0) return []

  const lower = interests.map(i => i.toLowerCase())

  return products.filter(p => {
    const name = p.name.toLowerCase()
    const cat = (p.category ?? '').toLowerCase()
    return lower.some(interest => name.includes(interest) || cat.includes(interest))
  })
}
