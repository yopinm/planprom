import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { computeDropRate, FunnelDropRatePanel } from '@/components/admin/FunnelDropRatePanel'

import type { PathRow } from '@/lib/funnel-metrics'

describe('FunnelDropRatePanel', (): void => {
  it('returns 0 when clicks are zero', (): void => {
    expect(computeDropRate(0, 0)).toBe(0)
  })

  it('returns 100 when no conversions happened', (): void => {
    expect(computeDropRate(100, 0)).toBe(100)
  })

  it('returns abandoned percentage from clicks and conversions', (): void => {
    expect(computeDropRate(100, 25)).toBe(75)
  })

  it('renders the empty state when there is no funnel data', (): void => {
    const html = renderToStaticMarkup(
      <FunnelDropRatePanel totalClicks={0} totalConvs={0} paths={[]} />,
    )

    expect(html).toContain('ยังไม่มีข้อมูล')
  })

  it('sorts path rows by highest drop rate first', (): void => {
    const paths: PathRow[] = [
      {
        path: 'search',
        platform: 'shopee',
        click_count: 100,
        conversion_count: 50,
        cvr_pct: 50,
        total_commission: 0,
        revenue_per_click: 0,
        last_click_at: null,
      },
      {
        path: 'landing',
        platform: 'lazada',
        click_count: 100,
        conversion_count: 10,
        cvr_pct: 10,
        total_commission: 0,
        revenue_per_click: 0,
        last_click_at: null,
      },
    ]

    const html = renderToStaticMarkup(
      <FunnelDropRatePanel totalClicks={200} totalConvs={60} paths={paths} />,
    )

    expect(html.indexOf('landing')).toBeLessThan(html.indexOf('search'))
  })
})
