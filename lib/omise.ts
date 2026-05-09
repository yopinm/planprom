// Omise REST API wrapper — no npm SDK dependency
const OMISE_API = 'https://api.omise.co'

function auth(): string {
  return `Basic ${Buffer.from(`${process.env.OMISE_SECRET_KEY}:`).toString('base64')}`
}

export interface OmiseCharge {
  id:       string
  status:   'pending' | 'successful' | 'failed' | 'expired'
  amount:   number
  currency: string
  source?: {
    type: string
    scannable_code?: {
      image?: { download_uri: string }
    }
  }
  metadata?: Record<string, string>
  failure_code?:    string
  failure_message?: string
}

// Create PromptPay charge — amount in THB baht (converted to satang internally)
export async function createPromptPayCharge(
  amountBaht: number,
  metadata: Record<string, string>,
): Promise<OmiseCharge> {
  const body = new URLSearchParams({
    amount:          String(amountBaht * 100),
    currency:        'thb',
    'source[type]':  'promptpay',
  })
  for (const [k, v] of Object.entries(metadata)) {
    body.set(`metadata[${k}]`, v)
  }
  const res = await fetch(`${OMISE_API}/charges`, {
    method:  'POST',
    headers: { Authorization: auth(), 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    body.toString(),
  })
  const json = await res.json() as OmiseCharge & { message?: string }
  if (!res.ok) throw new Error((json as { message?: string }).message ?? `Omise error ${res.status}`)
  return json
}

export async function getCharge(chargeId: string): Promise<OmiseCharge> {
  const res = await fetch(`${OMISE_API}/charges/${chargeId}`, {
    headers: { Authorization: auth() },
  })
  if (!res.ok) throw new Error('Omise charge not found')
  return res.json() as Promise<OmiseCharge>
}
