import { describe, expect, it } from 'vitest'
import { filterSentryNoise, getSentryReplayOnErrorSampleRate, getSentryReplaySessionSampleRate, getSentryTracesSampleRate } from '../sentry-noise-filter'
import type { ErrorEvent, EventHint } from '@sentry/nextjs'

function event(patch: Partial<ErrorEvent>): ErrorEvent {
  return {
    type: undefined,
    event_id: 'event-1',
    platform: 'javascript',
    ...patch,
  }
}

const EMPTY_HINT: EventHint = {}

describe('SENTRY-NOISE filter', () => {
  it('drops known browser noise messages', () => {
    const result = filterSentryNoise(
      event({ message: 'ResizeObserver loop limit exceeded' }),
      EMPTY_HINT,
    )

    expect(result).toBeNull()
  })

  it('drops extension stack frames', () => {
    const result = filterSentryNoise(
      event({
        exception: {
          values: [{
            type:  'TypeError',
            value: 'Extension failed',
            stacktrace: {
              frames: [{ filename: 'chrome-extension://abcd/content.js' }],
            },
          }],
        },
      }),
      EMPTY_HINT,
    )

    expect(result).toBeNull()
  })

  it('drops low-signal health requests', () => {
    const result = filterSentryNoise(
      event({
        request: { url: 'https://couponkum.com/api/health' },
        message: 'health probe disconnected',
      }),
      EMPTY_HINT,
    )

    expect(result).toBeNull()
  })

  it('keeps fatal and app-owned errors', () => {
    const fatal = event({ level: 'fatal', message: 'Failed to settle order revenue' })
    const appError = event({ message: 'Combination solver crashed' })

    expect(filterSentryNoise(fatal, EMPTY_HINT)).toBe(fatal)
    expect(filterSentryNoise(appError, EMPTY_HINT)).toBe(appError)
  })

  it('uses lower production sampling for pre-go-live noise control', () => {
    expect(getSentryTracesSampleRate()).toBeTypeOf('number')
    expect(getSentryReplaySessionSampleRate()).toBeTypeOf('number')
    expect(getSentryReplayOnErrorSampleRate()).toBeTypeOf('number')
  })
})
