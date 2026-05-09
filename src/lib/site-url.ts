const DEFAULT_PUBLIC_BASE_URL = 'https://couponkum.com'

function isLocalhostOrigin(origin: string): boolean {
  try {
    const url = new URL(origin)
    return url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '::1'
  } catch {
    return true
  }
}

function normalizeBaseUrl(value: string | undefined): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null

  try {
    const url = new URL(trimmed)
    return url.origin
  } catch {
    return null
  }
}

export function getConfiguredPublicBaseUrl(): string {
  return (
    normalizeBaseUrl(process.env.NEXT_PUBLIC_BASE_URL) ??
    normalizeBaseUrl(process.env.BASE_URL) ??
    normalizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL) ??
    DEFAULT_PUBLIC_BASE_URL
  )
}

export function getSafePublicOrigin(requestOrigin: string): string {
  if (process.env.NODE_ENV === 'production' && isLocalhostOrigin(requestOrigin)) {
    return getConfiguredPublicBaseUrl()
  }

  return normalizeBaseUrl(requestOrigin) ?? getConfiguredPublicBaseUrl()
}
