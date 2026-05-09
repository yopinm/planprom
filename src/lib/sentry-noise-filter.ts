import type { ErrorEvent, EventHint } from '@sentry/nextjs'

const BENIGN_ERROR_PATTERNS = [
  /ResizeObserver loop (limit exceeded|completed with undelivered notifications)/i,
  /Script error\.?/i,
  /AbortError/i,
  /The operation was aborted/i,
  /Load failed/i,
  /Failed to fetch/i,
  /NetworkError when attempting to fetch resource/i,
  /Non-Error promise rejection captured with value: Object Not Found Matching Id/i,
  /cancelled/i,
]

const THIRD_PARTY_URL_PATTERNS = [
  /chrome-extension:\/\//i,
  /moz-extension:\/\//i,
  /safari-extension:\/\//i,
  /extensions\//i,
  /google-analytics\.com/i,
  /googletagmanager\.com/i,
  /facebook\.net/i,
  /connect\.facebook\.net/i,
]

const LOW_SIGNAL_PATHS = [
  '/api/health',
  '/api/health/detail',
  '/robots.txt',
  '/sitemap.xml',
]

export const SENTRY_IGNORE_ERRORS = BENIGN_ERROR_PATTERNS.map(pattern => pattern.source)
export const SENTRY_DENY_URLS = THIRD_PARTY_URL_PATTERNS

export function getSentryTracesSampleRate(): number {
  return process.env.NODE_ENV === 'production' ? 0.05 : 1.0
}

export function getSentryReplaySessionSampleRate(): number {
  return process.env.NODE_ENV === 'production' ? 0.005 : 0
}

export function getSentryReplayOnErrorSampleRate(): number {
  return process.env.NODE_ENV === 'production' ? 0.5 : 0
}

export function filterSentryNoise(
  event: ErrorEvent,
  hint: EventHint,
): ErrorEvent | null {
  if (event.level === 'fatal') return event

  if (isLowSignalRequest(event)) return null
  if (isThirdPartyFrameEvent(event)) return null

  const searchableText = [
    event.message,
    ...getExceptionValues(event),
    getOriginalExceptionMessage(hint.originalException),
  ]
    .filter((value): value is string => Boolean(value))
    .join('\n')

  if (BENIGN_ERROR_PATTERNS.some(pattern => pattern.test(searchableText))) {
    return null
  }

  return event
}

function isLowSignalRequest(event: ErrorEvent): boolean {
  const requestUrl = event.request?.url
  if (!requestUrl) return false

  const path = getPathname(requestUrl)
  return LOW_SIGNAL_PATHS.some(lowSignalPath => path === lowSignalPath)
}

function isThirdPartyFrameEvent(event: ErrorEvent): boolean {
  const frameFilenames = event.exception?.values
    ?.flatMap(exception => exception.stacktrace?.frames ?? [])
    .map(frame => frame.filename)
    .filter((filename): filename is string => Boolean(filename)) ?? []

  return frameFilenames.some(filename =>
    THIRD_PARTY_URL_PATTERNS.some(pattern => pattern.test(filename)),
  )
}

function getExceptionValues(event: ErrorEvent): string[] {
  return event.exception?.values?.flatMap(exception => [
    exception.type,
    exception.value,
  ]).filter((value): value is string => Boolean(value)) ?? []
}

function getOriginalExceptionMessage(originalException: unknown): string | null {
  if (originalException instanceof Error) return originalException.message
  if (typeof originalException === 'string') return originalException
  return null
}

function getPathname(url: string): string {
  try {
    return new URL(url).pathname
  } catch {
    return url
  }
}
