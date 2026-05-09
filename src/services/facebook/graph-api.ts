// src/services/facebook/graph-api.ts — TASK 3.17
// Facebook Graph API client — page posting + token verification.
// Used by: /api/admin/facebook/verify (health check) + TASK 3.18 (auto-post engine)

const GRAPH_BASE = 'https://graph.facebook.com/v21.0'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FbPageInfo {
  id: string
  name: string
  fan_count?: number
}

export interface FbPublishResult {
  id: string   // Facebook post ID (format: "{page_id}_{post_id}")
}

interface FbApiErrorBody {
  message: string
  type: string
  code: number
  fbtrace_id?: string
}

// ---------------------------------------------------------------------------
// Env helpers — throw early with a clear message
// ---------------------------------------------------------------------------

function getPageId(): string {
  const v = process.env.FB_PAGE_ID
  if (!v) throw new Error('FB_PAGE_ID is not set')
  return v
}

function getPageToken(): string {
  const v = process.env.FB_PAGE_ACCESS_TOKEN
  if (!v) throw new Error('FB_PAGE_ACCESS_TOKEN is not set')
  return v
}

// ---------------------------------------------------------------------------
// Internal fetch helper
// ---------------------------------------------------------------------------

async function graphFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${GRAPH_BASE}${path}`, { cache: 'no-store', ...init })
  const json = (await res.json()) as Record<string, unknown>
  if (!res.ok || json.error) {
    const err = json.error as FbApiErrorBody | undefined
    throw new Error(
      err ? `FB Graph API ${err.code}: ${err.message}` : `HTTP ${res.status} ${res.statusText}`,
    )
  }
  return json as T
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Verify the page access token and return basic page info.
 * Throws if the token is invalid or env vars are missing.
 */
export async function verifyPageToken(): Promise<FbPageInfo> {
  const id    = getPageId()
  const token = getPageToken()
  return graphFetch<FbPageInfo>(
    `/${id}?fields=id,name,fan_count`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
}

/**
 * Publish a text post (with optional link) to the page feed.
 * Used by TASK 3.18 Auto-Post Deal Engine.
 */
export async function publishFeedPost(
  message: string,
  link?: string,
): Promise<FbPublishResult> {
  const id    = getPageId()
  const token = getPageToken()
  const body: Record<string, string> = { message, access_token: token }
  if (link) body.link = link

  return graphFetch<FbPublishResult>(`/${id}/feed`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
}

/**
 * Publish a photo post to the page.
 * `url` must be a publicly accessible image URL.
 * Used by TASK 3.18 when post has an image.
 */
export async function publishPhotoPost(
  imageUrl: string,
  caption:  string,
): Promise<FbPublishResult> {
  const id    = getPageId()
  const token = getPageToken()

  return graphFetch<FbPublishResult>(`/${id}/photos`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ url: imageUrl, caption, access_token: token }),
  })
}

/** Check if Graph API is configured (env vars present) without making a network call. */
export function isGraphApiConfigured(): boolean {
  return !!(process.env.FB_PAGE_ID && process.env.FB_PAGE_ACCESS_TOKEN)
}

// ---------------------------------------------------------------------------
// Comment operations — TASK 3.20
// ---------------------------------------------------------------------------

export interface FbComment {
  id:           string
  message:      string
  from?:        { id: string; name: string }
  created_time: string
}

interface FbCommentsPage {
  data:    FbComment[]
  paging?: { cursors: { before: string; after: string } }
}

/** Fetch recent comments on a page post. */
export async function getPostComments(fbPostId: string): Promise<FbComment[]> {
  const token = getPageToken()
  const result = await graphFetch<FbCommentsPage>(
    `/${fbPostId}/comments?fields=id,message,from,created_time&access_token=${encodeURIComponent(token)}`,
  )
  return result.data
}

/** Reply to a comment on the page. */
export async function replyToComment(commentId: string, message: string): Promise<FbPublishResult> {
  const token = getPageToken()
  return graphFetch<FbPublishResult>(`/${commentId}/comments`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ message, access_token: token }),
  })
}
