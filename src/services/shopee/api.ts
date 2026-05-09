// Shopee Affiliate Open API — GraphQL client
// Endpoint: https://open-api.affiliate.shopee.co.th/graphql
//
// Auth (Authorization header):
//   SHA256 Credential={app_id}, Timestamp={timestamp}, Signature={hmac}
//   hmac = HMAC-SHA256(app_secret, "{app_id}\n{timestamp}\n{sha256(body)}\n")

import { createHmac, createHash } from 'crypto'
import { withRetry, TransientApiError } from '@/lib/api-retry'

const GRAPHQL_URL = 'https://open-api.affiliate.shopee.co.th/graphql'
const FETCH_TIMEOUT_MS = 15_000
const RETRY_OPTS = { maxRetries: 2, baseDelayMs: 500, label: 'shopee-api' } as const

function buildAuth(body: string): string {
  const appId    = process.env.SHOPEE_APP_ID    ?? ''
  const secret   = process.env.SHOPEE_APP_SECRET ?? ''
  const ts       = String(Math.floor(Date.now() / 1000))
  const bodyHash = createHash('sha256').update(body).digest('hex')
  const message  = `${appId}\n${ts}\n${bodyHash}\n`
  const sig      = createHmac('sha256', secret).update(message).digest('hex')
  return `SHA256 Credential=${appId}, Timestamp=${ts}, Signature=${sig}`
}

interface GqlResponse<T> {
  data?:   T
  errors?: { message: string; extensions?: { code: number; message: string } }[]
}

export async function shopeeGql<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const body = JSON.stringify({ query, variables })

  return withRetry(async () => {
    const ctrl  = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)

    let res: Response
    try {
      res = await fetch(GRAPHQL_URL, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': buildAuth(body),
        },
        body,
        cache:  'no-store',
        signal: ctrl.signal,
      })
    } finally {
      clearTimeout(timer)
    }

    if (res.status >= 500) throw new TransientApiError(res.status, `Shopee API HTTP ${res.status}`)
    if (!res.ok) throw new Error(`Shopee API HTTP ${res.status}`)

    const json = (await res.json()) as GqlResponse<T>
    if (json.errors?.length) {
      const e = json.errors[0]
      const code = e.extensions?.code ?? 0
      if (code === 10030) throw new TransientApiError(429, `Shopee rate limit`)
      throw new Error(`Shopee GQL [${code}]: ${e.extensions?.message ?? e.message}`)
    }
    if (!json.data) throw new Error('Shopee GQL: empty data')
    return json.data
  }, { ...RETRY_OPTS, label: `shopee-gql` })
}
