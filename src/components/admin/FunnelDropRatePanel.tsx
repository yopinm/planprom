import type { ReactElement } from 'react'

import type { PathRow } from '@/lib/funnel-metrics'

interface FunnelDropRatePanelProps {
  totalClicks: number
  totalConvs: number
  paths: PathRow[]
}

interface DropPathRow {
  path: string
  platform: string
  clickCount: number
  conversionCount: number
  dropRate: number
}

export function computeDropRate(clicks: number, convs: number): number {
  if (clicks <= 0) return 0

  const abandonedRate = ((clicks - convs) / clicks) * 100
  const clampedRate = Math.min(100, Math.max(0, abandonedRate))
  return Math.round(clampedRate * 100) / 100
}

function formatPercent(value: number): string {
  return value.toLocaleString('th-TH', { maximumFractionDigits: 2 })
}

function toDropPathRow(row: PathRow): DropPathRow {
  return {
    path: row.path,
    platform: row.platform,
    clickCount: Number(row.click_count),
    conversionCount: Number(row.conversion_count),
    dropRate: computeDropRate(Number(row.click_count), Number(row.conversion_count)),
  }
}

export function FunnelDropRatePanel({
  totalClicks,
  totalConvs,
  paths,
}: FunnelDropRatePanelProps): ReactElement {
  const convertedRate = totalClicks > 0
    ? Math.round(Math.min(100, Math.max(0, (totalConvs / totalClicks) * 100)) * 100) / 100
    : 0
  const abandonedRate = computeDropRate(totalClicks, totalConvs)
  const sortedPaths = paths
    .map(toDropPathRow)
    .sort((a, b) => b.dropRate - a.dropRate)

  return (
    <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5">
      <h2 className="text-sm font-extrabold text-black">Funnel Drop Rate</h2>
      <p className="mt-0.5 text-xs text-neutral-500">converted vs abandoned traffic by overall funnel and source path</p>

      <div className="mt-4 rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-extrabold text-neutral-700">Overall bar</p>
          {totalClicks > 0 && (
            <p className="text-xs font-bold text-neutral-500">
              {formatPercent(convertedRate)}% converted · {formatPercent(abandonedRate)}% abandoned
            </p>
          )}
        </div>

        {totalClicks > 0 ? (
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-neutral-200">
            <div
              className="inline-block h-full bg-green-500 align-top"
              style={{ width: `${convertedRate}%` }}
              aria-label={`${formatPercent(convertedRate)}% converted`}
            />
            <div
              className="inline-block h-full bg-red-400 align-top"
              style={{ width: `${abandonedRate}%` }}
              aria-label={`${formatPercent(abandonedRate)}% abandoned`}
            />
          </div>
        ) : (
          <p className="mt-3 rounded-xl bg-white px-3 py-4 text-center text-xs text-neutral-400">
            ยังไม่มีข้อมูล
          </p>
        )}
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[420px] text-xs">
          <thead>
            <tr className="border-b border-neutral-100">
              {['Path', 'Clicks', 'Converted', '% Drop'].map(header => (
                <th key={header} className="pb-2 text-left font-extrabold text-neutral-500">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedPaths.map((row, index) => (
              <tr key={`${row.path}-${row.platform}-${index}`} className="border-b border-neutral-50">
                <td className="py-2">
                  <p className="font-semibold text-black">{row.path}</p>
                  <p className="text-[11px] text-neutral-400">{row.platform}</p>
                </td>
                <td className="py-2 text-neutral-600">{row.clickCount.toLocaleString('th-TH')}</td>
                <td className="py-2 text-neutral-600">{row.conversionCount.toLocaleString('th-TH')}</td>
                <td className="py-2 font-bold text-red-500">{formatPercent(row.dropRate)}%</td>
              </tr>
            ))}
            {sortedPaths.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-xs text-neutral-400">
                  ยังไม่มีข้อมูล
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
