import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import {
  formatCheckedAt,
  getPreflightBadge,
  PreflightStatusView,
} from '@/app/admin/preflight/PreflightClient'

import type { DbPreflightResult } from '@/app/admin/preflight/PreflightClient'

const READY_RESULT: DbPreflightResult = {
  ok: true,
  tables: [
    { name: 'products', rows: 120 },
    { name: 'coupons', rows: 42 },
  ],
  missing: [],
  checked_at: '2026-04-30T07:00:00.000Z',
}

const MISSING_RESULT: DbPreflightResult = {
  ok: false,
  tables: [
    { name: 'products', rows: 120 },
    { name: 'click_logs', rows: 0 },
  ],
  missing: ['click_logs'],
  checked_at: '2026-04-30T07:00:00.000Z',
}

describe('PreflightClient view', (): void => {
  it('renders ready status when preflight passes', (): void => {
    const html = renderToStaticMarkup(
      <PreflightStatusView result={READY_RESULT} status="done" onRecheck={() => undefined} />,
    )

    expect(html).toContain('พร้อม migrate')
    expect(html).toContain('products')
    expect(html).toContain('120')
  })

  it('renders problem status and missing table when preflight fails', (): void => {
    const html = renderToStaticMarkup(
      <PreflightStatusView result={MISSING_RESULT} status="error" onRecheck={() => undefined} />,
    )

    expect(html).toContain('พบปัญหา')
    expect(html).toContain('click_logs')
    expect(html).toContain('Missing tables')
  })

  it('renders loading state and disables the re-check button', (): void => {
    const html = renderToStaticMarkup(
      <PreflightStatusView result={null} status="loading" onRecheck={() => undefined} />,
    )

    expect(html).toContain('กำลังตรวจสอบ...')
    expect(html).toContain('disabled=""')
  })

  it('returns the correct badge labels', (): void => {
    expect(getPreflightBadge(READY_RESULT).label).toContain('พร้อม migrate')
    expect(getPreflightBadge(MISSING_RESULT).label).toContain('พบปัญหา')
  })

  it('formats checked time in Bangkok locale', (): void => {
    expect(formatCheckedAt('bad-date')).toBe('-')
    expect(formatCheckedAt(READY_RESULT.checked_at)).toContain('2569')
  })
})
