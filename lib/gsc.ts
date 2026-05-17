// Google Search Console API — read-only, OAuth refresh token

type RawRow = { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }
type RawRes = { rows?: RawRow[] }

async function getAccessToken(): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     process.env.GSC_CLIENT_ID     ?? '',
      client_secret: process.env.GSC_CLIENT_SECRET ?? '',
      refresh_token: process.env.GSC_REFRESH_TOKEN ?? '',
      grant_type:    'refresh_token',
    }),
  })
  const data = await res.json() as { access_token?: string; error?: string }
  if (!data.access_token) throw new Error(`GSC token error: ${data.error}`)
  return data.access_token
}

async function queryGsc(token: string, dimensions: string[], rowLimit = 25): Promise<RawRow[]> {
  const site    = encodeURIComponent(process.env.GSC_SITE_URL ?? 'sc-domain:planprom.com')
  const endDate = new Date().toISOString().slice(0, 10)
  const start   = new Date(Date.now() - 28 * 86_400_000)
  const startDate = start.toISOString().slice(0, 10)

  const body: Record<string, unknown> = { startDate, endDate, rowLimit, dataState: 'all' }
  if (dimensions.length) body.dimensions = dimensions

  const res = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${site}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  )
  const data = await res.json() as RawRes
  return data.rows ?? []
}

// ── Public types ──────────────────────────────────────────────────────────────
export type GscQueryRow = { query: string; clicks: number; impressions: number; ctr: number; position: number }
export type GscPageRow  = { page:  string; clicks: number; impressions: number; ctr: number; position: number }
export type GscData = {
  clicks: number
  impressions: number
  ctr: number
  position: number
  topQueries: GscQueryRow[]
  topPages:   GscPageRow[]
  startDate:  string
  endDate:    string
}

export async function fetchGscData(): Promise<GscData | null> {
  if (!process.env.GSC_CLIENT_ID || !process.env.GSC_REFRESH_TOKEN) return null
  try {
    const token = await getAccessToken()
    const endDate   = new Date().toISOString().slice(0, 10)
    const startDate = new Date(Date.now() - 28 * 86_400_000).toISOString().slice(0, 10)

    const [summaryRows, queryRows, pageRows] = await Promise.all([
      queryGsc(token, [], 1),
      queryGsc(token, ['query'], 25),
      queryGsc(token, ['page'],  15),
    ])

    const s = summaryRows[0] ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 }

    return {
      clicks:      s.clicks,
      impressions: s.impressions,
      ctr:         s.ctr,
      position:    s.position,
      topQueries:  queryRows.map(r => ({ query: r.keys[0] ?? '', clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position })),
      topPages:    pageRows.map(r  => ({ page:  r.keys[0] ?? '', clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position })),
      startDate,
      endDate,
    }
  } catch (e) {
    console.error('[GSC] fetch error:', e)
    return null
  }
}
