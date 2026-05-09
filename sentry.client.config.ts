import * as Sentry from '@sentry/nextjs'
import {
  SENTRY_DENY_URLS,
  SENTRY_IGNORE_ERRORS,
  filterSentryNoise,
  getSentryReplayOnErrorSampleRate,
  getSentryReplaySessionSampleRate,
  getSentryTracesSampleRate,
} from '@/lib/sentry-noise-filter'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV ?? 'development',
  tracesSampleRate: getSentryTracesSampleRate(),
  replaysSessionSampleRate: getSentryReplaySessionSampleRate(),
  replaysOnErrorSampleRate: getSentryReplayOnErrorSampleRate(),
  ignoreErrors: SENTRY_IGNORE_ERRORS,
  denyUrls: SENTRY_DENY_URLS,
  beforeSend: filterSentryNoise,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
})
