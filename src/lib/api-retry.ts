// REV-02: retry utility for transient affiliate API errors
//
// Retries only on transient errors (HTTP 5xx or network failure).
// 4xx errors and application-level errors (e.g. Lazada code !== '0') are not retried.

export interface RetryOptions {
  maxRetries:  number  // attempts after the first — total = maxRetries + 1
  baseDelayMs: number  // first retry delay; doubles each subsequent retry
  label:       string  // identifies the call site in server logs
}

export class TransientApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'TransientApiError'
  }
}

function isTransient(error: unknown): boolean {
  if (error instanceof TransientApiError) return true
  // Network errors (fetch throws TypeError: Failed to fetch, etc.)
  if (error instanceof TypeError) return true
  return false
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions,
): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (!isTransient(err) || attempt === opts.maxRetries) break
      const delayMs = opts.baseDelayMs * Math.pow(2, attempt)
      console.warn(`[api-retry] ${opts.label} attempt ${attempt + 1} failed — retrying in ${delayMs}ms`)
      await sleep(delayMs)
    }
  }
  if (opts.maxRetries > 0) {
    console.error(`[api-retry] ${opts.label} failed after ${opts.maxRetries + 1} attempts`)
  }
  throw lastError
}
