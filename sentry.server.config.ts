import * as Sentry from '@sentry/nextjs'
import {
  SENTRY_DENY_URLS,
  SENTRY_IGNORE_ERRORS,
  filterSentryNoise,
  getSentryTracesSampleRate,
} from '@/lib/sentry-noise-filter'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV ?? 'development',
  tracesSampleRate: getSentryTracesSampleRate(),
  ignoreErrors: SENTRY_IGNORE_ERRORS,
  denyUrls: SENTRY_DENY_URLS,
  beforeSend: filterSentryNoise,
  enabled: !!process.env.SENTRY_DSN,
})
