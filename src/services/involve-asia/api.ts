// Involve Asia REST API client
// Auth: POST /authenticate → 2h Bearer token (cached per process)
// Base: https://api.involve.asia/api

const IA_API_BASE = 'https://api.involve.asia/api'
const IA_TIMEOUT_MS = 15_000

export class IaApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message)
    this.name = 'IaApiError'
  }
}

let _tokenCache: { token: string; expiresAt: number } | null = null

async function iaGetToken(): Promise<string> {
  const now = Date.now()
  if (_tokenCache && _tokenCache.expiresAt > now + 60_000) return _tokenCache.token

  const secret = process.env.IA_REST_API_KEY
  if (!secret) throw new IaApiError('IA_REST_API_KEY not set')

  const body = new URLSearchParams({ key: 'general', secret })
  const res = await fetch(`${IA_API_BASE}/authenticate`, {
    method:  'POST',
    headers: { Accept: 'application/json' },
    body,
  })
  if (!res.ok) throw new IaApiError(`IA auth failed: ${res.status}`)

  const json = await res.json() as { status: string; message: string; data?: { token: string } }
  if (json.status !== 'success' || !json.data?.token) {
    throw new IaApiError(`IA auth: ${json.message ?? 'unknown error'}`)
  }

  _tokenCache = { token: json.data.token, expiresAt: now + 7_200_000 }
  return _tokenCache.token
}

export async function iaPost<T>(path: string, body: Record<string, unknown> = {}): Promise<T> {
  const token = await iaGetToken()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), IA_TIMEOUT_MS)

  try {
    const res = await fetch(`${IA_API_BASE}${path}`, {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept:         'application/json',
      },
      body:   JSON.stringify(body),
      signal: controller.signal,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new IaApiError(`IA API ${res.status}: ${text}`, res.status)
    }

    return res.json() as Promise<T>
  } finally {
    clearTimeout(timer)
  }
}
