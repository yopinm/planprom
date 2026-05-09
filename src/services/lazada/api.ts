// Lazada Open API — low-level signed HTTP client
// Docs: https://open.lazada.com/apps/doc/api
//
// All requests are signed with HMAC-SHA256:
//   1. Collect all params (including app_key, timestamp, sign_method)
//   2. Sort keys alphabetically
//   3. Concatenate as key1value1key2value2… (no separator)
//   4. HMAC-SHA256(app_secret, message) → uppercase hex = sign

import { createHmac } from 'crypto'
import { withRetry, TransientApiError } from '@/lib/api-retry'
import { lazadaQueue } from '@/lib/api-queue'

const BASE_URL = 'https://api.lazada.co.th/rest'

const RETRY_OPTS = { maxRetries: 2, baseDelayMs: 500, label: 'lazada-api' } as const

type Params = Record<string, string>

// Lazada signing: path prepended to sorted key-value pairs (no separator)
// e.g. /marketing/product/feedapp_key105827limit50offerType1...
function buildSign(secret: string, path: string, params: Params): string {
  const message = path + Object.keys(params).sort().map(k => `${k}${params[k]}`).join('')
  return createHmac('sha256', secret).update(message).digest('hex').toUpperCase()
}

function withAuth(path: string, params: Params, accessToken?: string): Params {
  const signed: Params = {
    ...params,
    app_key:     process.env.LAZADA_APP_KEY    ?? '',
    timestamp:   String(Date.now()),
    sign_method: 'sha256',
    ...(accessToken ? { access_token: accessToken } : {}),
  }
  signed.sign = buildSign(process.env.LAZADA_APP_SECRET ?? '', path, signed)
  return signed
}

function toUrl(endpoint: string, params: Params): string {
  const url = new URL(`${BASE_URL}${endpoint}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return url.toString()
}

interface LazadaResponse<T> {
  code:              string
  request_id?:       string
  result?:           T
  data?:             T
  error_description?: string
}

const FETCH_TIMEOUT_MS = 10_000  // 10s abort guard

async function lazadaFetch(url: string): Promise<LazadaResponse<unknown>> {
  const ctrl  = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, { cache: 'no-store', signal: ctrl.signal })
    if (res.status >= 500) throw new TransientApiError(res.status, `HTTP ${res.status}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return (await res.json()) as LazadaResponse<unknown>
  } finally {
    clearTimeout(timer)
  }
}

export async function lazadaGet<T>(
  endpoint: string,
  params: Params = {},
  accessToken?: string,
): Promise<T> {
  const url = toUrl(endpoint, withAuth(endpoint, params, accessToken))

  // Direct fetch with retry — bypasses queue to avoid deadlock (tokens=0, running=0)
  return withRetry(async () => {
    const json = await lazadaFetch(url)
    if (json.code !== '0') {
      throw new Error(`Lazada API error [${json.code}]: ${json.error_description ?? 'unknown'}`)
    }
    return (json.result ?? json.data) as T
  }, { ...RETRY_OPTS, label: `lazada-get ${endpoint}` })
}

export async function lazadaPost<T>(
  endpoint: string,
  params: Params = {},
  body: string,
  accessToken?: string,
): Promise<T> {
  const url = toUrl(endpoint, withAuth(endpoint, params, accessToken))

  return lazadaQueue.enqueue(() => withRetry(async () => {
    const ctrl  = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
    let res: Response
    try {
      res = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        cache:   'no-store',
        signal:  ctrl.signal,
      })
    } finally {
      clearTimeout(timer)
    }

    if (res.status >= 500) throw new TransientApiError(res.status, `Lazada API ${endpoint}: HTTP ${res.status}`)
    if (!res.ok) throw new Error(`Lazada API ${endpoint}: HTTP ${res.status}`)

    const json = (await res.json()) as LazadaResponse<T>
    if (json.code !== '0') {
      throw new Error(`Lazada API error [${json.code}]: ${json.error_description ?? 'unknown'}`)
    }

    return (json.result ?? json.data) as T
  }, { ...RETRY_OPTS, label: `lazada-post ${endpoint}` }))
}
