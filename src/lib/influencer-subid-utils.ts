// POSTLIVE-33: pure client-safe utilities for influencer sub_id
// This file has no server-only imports and can be used in Client Components.

/** Sanitize a handle/name to a safe slug for use in sub_id */
export function sanitizeHandle(handle: string): string {
  return handle
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 24)
}

/** Build the canonical influencer sub_id */
export function buildInfluencerSubId(handle: string): string {
  return `inf_${sanitizeHandle(handle)}`
}
